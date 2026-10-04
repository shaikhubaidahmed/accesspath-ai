import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { unzipSync } from "fflate";
import type { MtaEquipment, MtaOutage, ReliabilityProfile, RouteEdge, Station, SubwayGraph } from "../shared/types.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "data", "raw");
const processedDir = path.join(root, "data", "processed");
const fixtureDir = path.join(root, "data", "fixtures");

const urls = {
  gtfs: "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
  stations: "https://data.ny.gov/resource/39hk-dx4f.json?$limit=5000",
  equipment: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene_equipments.json",
  outages: "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fnyct_ene.json",
  reliability: "https://data.ny.gov/resource/rc78-7x78.json"
};

async function fetchChecked(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "AccessPath/0.1 (+https://github.com/)" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function number(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function csvFile(files: Record<string, Uint8Array>, name: string): Array<Record<string, string>> {
  const bytes = files[name];
  if (!bytes) throw new Error(`GTFS archive is missing ${name}`);
  return parse(Buffer.from(bytes), { columns: true, skip_empty_lines: true, relax_column_count: true });
}

function edgeMinutes(a: Station, b: Station): number {
  const latKm = (a.lat - b.lat) * 111;
  const lonKm = (a.lon - b.lon) * 84;
  const km = Math.sqrt(latKm * latKm + lonKm * lonKm);
  return Math.max(2, Math.min(8, Math.round(km * 2.2 + 1)));
}

async function buildGraph(): Promise<SubwayGraph> {
  const [stationResponse, gtfsResponse] = await Promise.all([fetchChecked(urls.stations), fetchChecked(urls.gtfs)]);
  const stationRows = (await stationResponse.json()) as Array<Record<string, string>>;
  const archive = new Uint8Array(await gtfsResponse.arrayBuffer());
  await writeFile(path.join(rawDir, "gtfs_subway.zip"), archive);

  const files = unzipSync(archive);
  const stopRows = csvFile(files, "stops.txt");
  const routeRows = csvFile(files, "routes.txt");
  const tripRows = csvFile(files, "trips.txt");
  const stopTimeRows = csvFile(files, "stop_times.txt");

  const stations: Record<string, Station> = {};
  for (const row of stationRows) {
    stations[row.gtfs_stop_id] = {
      id: row.gtfs_stop_id,
      complexId: row.complex_id,
      name: row.stop_name,
      borough: row.borough,
      lat: number(row.gtfs_latitude),
      lon: number(row.gtfs_longitude),
      ada: number(row.ada) as 0 | 1 | 2,
      adaNorthbound: number(row.ada_northbound) as 0 | 1,
      adaSouthbound: number(row.ada_southbound) as 0 | 1,
      adaNotes: row.ada_notes && row.ada_notes !== "NaN" ? row.ada_notes : null,
      daytimeRoutes: (row.daytime_routes ?? "").split(/\s+/).filter(Boolean)
    };
  }

  const parentByStop = new Map<string, string>();
  for (const row of stopRows) {
    const parent = row.parent_station || row.stop_id.replace(/[NS]$/, "");
    parentByStop.set(row.stop_id, parent);
  }

  const routeByTrip = new Map(tripRows.map((row) => [row.trip_id, row.route_id]));
  const routes: SubwayGraph["routes"] = {};
  for (const row of routeRows) {
    routes[row.route_id] = {
      id: row.route_id,
      name: row.route_short_name || row.route_long_name || row.route_id,
      color: `#${row.route_color || "475569"}`
    };
  }
  routes.WALK = { id: "WALK", name: "Station transfer", color: "#64748B" };

  const edgeMap = new Map<string, Set<string>>();
  let currentTrip = "";
  let previousParent = "";
  for (const row of stopTimeRows) {
    if (row.trip_id !== currentTrip) {
      currentTrip = row.trip_id;
      previousParent = "";
    }
    const parent = parentByStop.get(row.stop_id) ?? row.stop_id.replace(/[NS]$/, "");
    if (previousParent && parent !== previousParent && stations[parent] && stations[previousParent]) {
      const route = routeByTrip.get(row.trip_id) ?? "?";
      for (const [from, to] of [[previousParent, parent], [parent, previousParent]]) {
        const key = `${from}|${to}`;
        const set = edgeMap.get(key) ?? new Set<string>();
        set.add(route);
        edgeMap.set(key, set);
      }
    }
    previousParent = parent;
  }

  const stationsByComplex = new Map<string, string[]>();
  for (const station of Object.values(stations)) {
    const members = stationsByComplex.get(station.complexId) ?? [];
    members.push(station.id);
    stationsByComplex.set(station.complexId, members);
  }
  for (const members of stationsByComplex.values()) {
    if (members.length < 2) continue;
    for (const from of members) {
      for (const to of members) {
        if (from === to) continue;
        const key = `${from}|${to}`;
        const set = edgeMap.get(key) ?? new Set<string>();
        set.add("WALK");
        edgeMap.set(key, set);
      }
    }
  }

  const adjacency: Record<string, RouteEdge[]> = {};
  for (const [key, routeSet] of edgeMap) {
    const [from, to] = key.split("|");
    adjacency[from] ??= [];
    const transfer = routeSet.has("WALK");
    adjacency[from].push({
      to,
      routes: [...routeSet].sort(),
      minutes: transfer ? 5 : edgeMinutes(stations[from], stations[to])
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    sources: [
      { name: "MTA Subway Stations", url: "https://data.ny.gov/d/39hk-dx4f" },
      { name: "MTA Static GTFS", url: urls.gtfs }
    ],
    stations,
    adjacency,
    routes
  };
}

async function fetchReliability(): Promise<ReliabilityProfile[]> {
  const params = new URLSearchParams({
    "$select": "station_complex_mrn,station_complex_name,avg(_24_hour_availability) as availability,avg(unscheduled_outages) as unscheduled,max(month) as latest",
    "$where": 'equipment_type="Elevator"',
    "$group": "station_complex_mrn,station_complex_name",
    "$limit": "5000"
  });
  const response = await fetchChecked(`${urls.reliability}?${params.toString()}`);
  const rows = (await response.json()) as Array<Record<string, string>>;
  return rows.map((row) => {
    const availability = number(row.availability, 0.95);
    const unscheduled = number(row.unscheduled);
    const risk = availability < 0.95 || unscheduled > 3 ? "elevated" : availability < 0.98 || unscheduled > 1.5 ? "moderate" : "low";
    return {
      complexId: row.station_complex_mrn,
      stationName: row.station_complex_name.replace(/\s+-\s+Station$/, ""),
      historicalAvailability: availability,
      meanMonthlyUnscheduledOutages: unscheduled,
      risk,
      model: "historical-baseline",
      asOf: row.latest
    } satisfies ReliabilityProfile;
  });
}

async function main() {
  await Promise.all([rawDir, processedDir, fixtureDir].map((dir) => mkdir(dir, { recursive: true })));
  const [graph, equipmentResponse, outageResponse, reliability] = await Promise.all([
    buildGraph(),
    fetchChecked(urls.equipment),
    fetchChecked(urls.outages),
    fetchReliability()
  ]);

  const equipment = (await equipmentResponse.json()) as MtaEquipment[];
  const outages = (await outageResponse.json()) as MtaOutage[];
  const capturedAt = new Date().toISOString();

  await Promise.all([
    writeFile(path.join(processedDir, "subway-graph.json"), JSON.stringify(graph)),
    writeFile(path.join(processedDir, "reliability.json"), JSON.stringify(reliability, null, 2)),
    writeFile(path.join(fixtureDir, "mta-equipment.json"), JSON.stringify({ capturedAt, records: equipment }, null, 2)),
    writeFile(path.join(fixtureDir, "mta-outages.json"), JSON.stringify({ capturedAt, records: outages }, null, 2)),
    writeFile(
      path.join(fixtureDir, "scenario-outage.json"),
      JSON.stringify(
        {
          capturedAt,
          simulated: true,
          record: {
            station: "Queensboro Plaza",
            trainno: "7/N/W",
            equipment: "DEMO-EL-QBP-XFER",
            equipmenttype: "EL",
            serving: "mezzanine between 7 and N/W platforms",
            ADA: "Y",
            outagedate: capturedAt,
            estimatedreturntoservice: "Demonstration only",
            reason: "Simulated transfer-lift outage",
            isupcomingoutage: "N",
            ismaintenanceoutage: "N"
          }
        },
        null,
        2
      )
    ),
    writeFile(
      path.join(processedDir, "manifest.json"),
      JSON.stringify(
        {
          generatedAt: capturedAt,
          sources: [
            { name: "MTA Regular Subway GTFS", url: urls.gtfs, license: "MTA terms" },
            { name: "MTA Subway Stations", url: "https://data.ny.gov/d/39hk-dx4f", license: "Public data" },
            { name: "MTA Elevator Equipment", url: urls.equipment, license: "MTA terms" },
            { name: "MTA Elevator Outages", url: urls.outages, license: "MTA terms" },
            { name: "MTA Equipment Availability", url: "https://data.ny.gov/d/rc78-7x78", license: "Public data" }
          ],
          counts: {
            stations: Object.keys(graph.stations).length,
            edges: Object.values(graph.adjacency).reduce((sum, edges) => sum + edges.length, 0),
            equipment: equipment.length,
            outages: outages.length,
            reliabilityProfiles: reliability.length
          }
        },
        null,
        2
      )
    )
  ]);

  console.log(`Synced ${Object.keys(graph.stations).length} stations, ${equipment.length} equipment records, ${outages.length} outages.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
