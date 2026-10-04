import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./config.js";
import type { MtaEquipment, MtaOutage, ReliabilityProfile, SubwayGraph } from "../shared/types.js";

type Fixture<T> = { capturedAt: string; records: T[] };
type ScenarioFixture = { capturedAt: string; simulated: boolean; record: MtaOutage };

async function json<T>(relativePath: string): Promise<T> {
  const contents = await readFile(path.join(projectRoot, relativePath), "utf8");
  return JSON.parse(contents) as T;
}

async function optionalJson<T>(relativePath: string): Promise<T | undefined> {
  try {
    return await json<T>(relativePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export type DataStore = {
  graph: SubwayGraph;
  reliability: ReliabilityProfile[];
  equipment: Fixture<MtaEquipment>;
  outages: Fixture<MtaOutage>;
  scenario: ScenarioFixture;
  reliabilityByComplex: Map<string, ReliabilityProfile>;
  equipmentById: Map<string, MtaEquipment>;
};

let storePromise: Promise<DataStore> | undefined;

export function loadDataStore(): Promise<DataStore> {
  storePromise ??= Promise.all([
    json<SubwayGraph>("data/processed/subway-graph.json"),
    json<ReliabilityProfile[]>("data/processed/reliability.json"),
    optionalJson<ReliabilityProfile[]>("data/processed/tabpfn-reliability.json"),
    json<Fixture<MtaEquipment>>("data/fixtures/mta-equipment.json"),
    json<Fixture<MtaOutage>>("data/fixtures/mta-outages.json"),
    json<ScenarioFixture>("data/fixtures/scenario-outage.json")
  ]).then(([graph, historicalReliability, tabPfnReliability, equipment, outages, scenario]) => {
    const predicted = new Map((tabPfnReliability ?? []).map((profile) => [profile.complexId, profile]));
    const historicalIds = new Set(historicalReliability.map((profile) => profile.complexId));
    const reliability = [
      ...historicalReliability.map((profile) => predicted.get(profile.complexId) ?? profile),
      ...(tabPfnReliability ?? []).filter((profile) => !historicalIds.has(profile.complexId))
    ];
    return {
      graph,
      reliability,
      equipment,
      outages,
      scenario,
      reliabilityByComplex: new Map(reliability.map((profile) => [profile.complexId, profile])),
      equipmentById: new Map(equipment.records.map((record) => [record.equipmentno, record]))
    };
  });
  return storePromise;
}
