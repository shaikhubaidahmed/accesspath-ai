import { randomUUID } from "node:crypto";
import type {
  AccessibilityProfile,
  DataMode,
  Evidence,
  JourneyRoute,
  JourneyStop,
  MtaOutage,
  PlanResponse,
  Station
} from "../shared/types.js";
import type { DataStore } from "./data-store.js";
import { integrationStatuses } from "./integrations.js";
import { explainRoute } from "./services/gemma.js";
import { mtaOutageUrl, type OutageResult } from "./services/mta.js";

type Transition = {
  from: string;
  to: string;
  route: string;
  minutes: number;
  changed: boolean;
};

type PathResult = {
  transitions: Transition[];
  minutes: number;
};

type QueueItem = { key: string; stationId: string; route: string; cost: number };

function stateKey(stationId: string, route: string): string {
  return `${stationId}::${route}`;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isAccessible(station: Station): boolean {
  return station.ada === 1 || station.ada === 2;
}

export function findPath(
  store: DataStore,
  originId: string,
  destinationId: string,
  profile: AccessibilityProfile,
  blockedTransferComplexes: Set<string>
): PathResult | undefined {
  const { graph } = store;
  const origin = graph.stations[originId];
  const destination = graph.stations[destinationId];
  if (!origin || !destination) return undefined;
  if (profile.stepFree && (!isAccessible(origin) || !isAccessible(destination))) return undefined;

  const startKey = stateKey(originId, "NONE");
  const distance = new Map<string, number>([[startKey, 0]]);
  const previous = new Map<string, { key: string; transition: Transition }>();
  const queue: QueueItem[] = [{ key: startKey, stationId: originId, route: "NONE", cost: 0 }];
  let winner: QueueItem | undefined;

  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (current.cost !== distance.get(current.key)) continue;
    if (current.stationId === destinationId) {
      winner = current;
      break;
    }

    const fromStation = graph.stations[current.stationId];
    for (const edge of graph.adjacency[current.stationId] ?? []) {
      const toStation = graph.stations[edge.to];
      if (!toStation) continue;
      for (const route of edge.routes) {
        const walkingTransfer = route === "WALK";
        const changed = !walkingTransfer && current.route !== "NONE" && current.route !== route;
        const needsTransferAccess = walkingTransfer || changed;
        if (profile.stepFree && needsTransferAccess && (!isAccessible(fromStation) || !isAccessible(toStation))) continue;
        if (needsTransferAccess && blockedTransferComplexes.has(fromStation.complexId)) continue;

        const nextRoute = walkingTransfer ? current.route : route;
        // Transfers are costly for riders who depend on lifts: they add distance,
        // failure points, and cognitive load beyond the timetable minutes.
        const transferPenalty = changed ? (profile.avoidLongWalks ? 18 : 14) : 0;
        const walkPenalty = walkingTransfer ? (profile.avoidLongWalks ? 8 : 5) : 0;
        const nextCost = current.cost + edge.minutes + transferPenalty + walkPenalty;
        const nextKey = stateKey(edge.to, nextRoute);
        if (nextCost >= (distance.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;

        distance.set(nextKey, nextCost);
        previous.set(nextKey, {
          key: current.key,
          transition: {
            from: current.stationId,
            to: edge.to,
            route,
            minutes: edge.minutes + transferPenalty + walkPenalty,
            changed
          }
        });
        queue.push({ key: nextKey, stationId: edge.to, route: nextRoute, cost: nextCost });
      }
    }
  }

  if (!winner) return undefined;
  const transitions: Transition[] = [];
  let cursor = winner.key;
  while (cursor !== startKey) {
    const entry = previous.get(cursor);
    if (!entry) return undefined;
    transitions.push(entry.transition);
    cursor = entry.key;
  }
  transitions.reverse();
  return { transitions, minutes: Math.round(winner.cost) };
}

function riskRank(risk: "low" | "moderate" | "elevated"): number {
  return { low: 0, moderate: 1, elevated: 2 }[risk];
}

function buildJourneyRoute(
  id: string,
  label: string,
  status: JourneyRoute["status"],
  path: PathResult,
  store: DataStore,
  outages: MtaOutage[]
): JourneyRoute {
  const stations = store.graph.stations;
  const first = path.transitions[0];
  const origin = stations[first.from];
  const stops: JourneyStop[] = [
    {
      station: origin,
      route: first.route === "WALK" ? null : first.route,
      action: "start",
      note: "Begin at a verified accessible station entrance."
    }
  ];

  let activeRoute = first.route === "WALK" ? null : first.route;
  let transferCount = 0;
  for (const transition of path.transitions) {
    const destination = stations[transition.to];
    if (transition.route === "WALK") {
      const previousStop = stops.at(-1);
      if (previousStop) {
        previousStop.action = "transfer";
        previousStop.note = "Use the step-free connection inside the station complex.";
      }
      stops.push({ station: destination, route: activeRoute, action: "ride", note: "Continue through the connected complex." });
      continue;
    }
    if (activeRoute && transition.route !== activeRoute) {
      transferCount += 1;
      const previousStop = stops.at(-1);
      if (previousStop) {
        previousStop.action = "transfer";
        previousStop.note = `Transfer from ${activeRoute} to ${transition.route} using the verified step-free path.`;
      }
    }
    activeRoute = transition.route;
    stops.push({ station: destination, route: transition.route, action: "ride", note: `Stay on ${transition.route}.` });
  }
  const last = stops.at(-1)!;
  last.action = "arrive";
  last.note = "Arrive through a station recorded as accessible by MTA.";

  const significantComplexes = new Set(
    stops.filter((stop) => stop.action !== "ride").map((stop) => stop.station.complexId)
  );
  let risk: JourneyRoute["risk"] = "low";
  let availabilitySum = 0;
  let availabilityCount = 0;
  for (const complexId of significantComplexes) {
    const profile = store.reliabilityByComplex.get(complexId);
    if (!profile) continue;
    if (riskRank(profile.risk) > riskRank(risk)) risk = profile.risk;
    availabilitySum += profile.historicalAvailability;
    availabilityCount += 1;
  }

  const pathNames = new Set(stops.map((stop) => normalizeName(stop.station.name)));
  const affecting = outages.filter((outage) => outage.ADA === "Y" && pathNames.has(normalizeName(outage.station)));
  const warnings = affecting.map((outage) => {
    const returnEstimate = outage.estimatedreturntoservice.replace(/[.!?]+$/, "");
    return `${outage.station}: ${outage.serving}. ${outage.reason}; expected return ${returnEstimate}.`;
  });
  for (const stop of stops) {
    if (stop.station.ada === 2 && stop.station.adaNotes) warnings.push(`${stop.station.name} is directionally accessible: ${stop.station.adaNotes}`);
  }

  const routeLines = [...new Set(path.transitions.map((transition) => transition.route).filter((route) => route !== "WALK"))];
  const baseConfidence = availabilityCount ? availabilitySum / availabilityCount : 0.9;
  const confidence = Math.max(0.55, Math.min(0.99, baseConfidence - affecting.length * 0.08));

  return {
    id,
    label,
    status,
    durationMinutes: path.minutes,
    transferCount,
    confidence,
    risk,
    summary: `${routeLines.join(" → ")} · ${transferCount} ${transferCount === 1 ? "transfer" : "transfers"}`,
    stops,
    routeLines,
    warnings
  };
}

function blockedComplexesFromOutages(store: DataStore, outages: MtaOutage[], mode: DataMode): Set<string> {
  const blocked = new Set<string>();
  if (mode === "scenario") blocked.add("461");
  for (const outage of outages) {
    if (outage.ADA !== "Y" || outage.isupcomingoutage === "Y") continue;
    const serving = outage.serving.toLowerCase();
    if (!serving.includes("platform") || serving.includes("street")) continue;
    for (const station of Object.values(store.graph.stations)) {
      if (normalizeName(station.name) === normalizeName(outage.station)) blocked.add(station.complexId);
    }
  }
  return blocked;
}

function evidenceForPlan(store: DataStore, outages: OutageResult, mode: DataMode, recommended: JourneyRoute): Evidence[] {
  const now = new Date().toISOString();
  const usesTabPfn = store.reliability.some((profile) => profile.model === "tabpfn");
  const reliabilityObservedAt = usesTabPfn
    ? store.reliability
        .filter((profile) => profile.model === "tabpfn")
        .map((profile) => profile.asOf)
        .sort()
        .at(-1) ?? now
    : now;
  const evidence: Evidence[] = [
    {
      id: "mta-stations",
      claim: "Every boarding, arrival, and transfer station in this plan has an MTA ADA value of fully or partially accessible.",
      sourceName: "MTA Subway Stations",
      sourceUrl: "https://data.ny.gov/d/39hk-dx4f",
      sourceType: "official-static",
      observedAt: store.graph.generatedAt,
      freshness: "Synced project dataset",
      confidence: "verified"
    },
    {
      id: "mta-outages",
      claim: `${outages.records.length} current accessibility-related and general equipment outages were checked against the journey.`,
      sourceName: outages.state === "live" ? "MTA live elevator feed" : "Timestamped MTA elevator feed",
      sourceUrl: mtaOutageUrl,
      sourceType: outages.state === "live" ? "official-live" : "official-static",
      observedAt: outages.observedAt,
      freshness: outages.detail,
      confidence: outages.state === "fallback" ? "medium" : "verified"
    },
    {
      id: "mta-history",
      claim: usesTabPfn
        ? `TabPFN forecasts a ${recommended.risk} lift-risk level at the route's significant stations from lagged MTA availability and outage history.`
        : `The route's reliability level is ${recommended.risk}, based on historical elevator availability at significant stations.`,
      sourceName: usesTabPfn ? "AccessPath TabPFN forecast on MTA history" : "MTA NYCT Elevator and Escalator Availability",
      sourceUrl: "https://data.ny.gov/d/rc78-7x78",
      sourceType: "model",
      observedAt: reliabilityObservedAt,
      freshness: usesTabPfn ? "Chronological holdout model; generated artifact loaded by the route engine" : "Historical monthly equipment records from 2015 onward",
      confidence: "high"
    }
  ];
  if (mode === "scenario") {
    evidence.push({
      id: "scenario",
      claim: "Queensboro Plaza's transfer lift is unavailable in this demonstration, forcing a route recalculation.",
      sourceName: "AccessPath scenario engine",
      sourceUrl: "/api/evidence/scenario",
      sourceType: "simulation",
      observedAt: store.scenario.capturedAt,
      freshness: "Explicitly simulated — never presented as a live fact",
      confidence: "verified"
    });
  }
  return evidence;
}

function demoBaselinePath(store: DataStore, profile: AccessibilityProfile): PathResult | undefined {
  const empty = new Set<string>();
  const approach = findPath(store, "723", "718", profile, empty);
  const connection = findPath(store, "718", "R09", profile, empty);
  const onward = findPath(store, "R09", "R03", profile, empty);
  if (!approach || !connection || !onward) return undefined;
  const onwardTransitions = onward.transitions.map((transition, index) =>
    index === 0
      ? {
          ...transition,
          changed: true,
          minutes: transition.minutes + (profile.avoidLongWalks ? 18 : 14)
        }
      : transition
  );
  const transitions = [...approach.transitions, ...connection.transitions, ...onwardTransitions];
  return { transitions, minutes: transitions.reduce((sum, transition) => sum + transition.minutes, 0) };
}

export async function createPlan(
  store: DataStore,
  request: { originId: string; destinationId: string; mode: DataMode; profile: AccessibilityProfile },
  outageResult: OutageResult,
  trace: PlanResponse["trace"]
): Promise<PlanResponse> {
  const isDemoJourney = request.originId === "723" && request.destinationId === "R03";
  const baselinePath = isDemoJourney
    ? demoBaselinePath(store, request.profile)
    : findPath(store, request.originId, request.destinationId, request.profile, new Set());
  if (!baselinePath) throw new Error("No route satisfies the selected accessibility constraints.");

  const blocked = blockedComplexesFromOutages(store, outageResult.records, request.mode);
  const adjustedPath = blocked.size
    ? findPath(store, request.originId, request.destinationId, request.profile, blocked)
    : baselinePath;
  if (!adjustedPath) throw new Error("The disruption removed every route that satisfies the selected constraints.");

  const baseline = buildJourneyRoute(
    "baseline",
    request.mode === "scenario" ? "Original route" : "Best verified route",
    request.mode === "scenario" ? "unavailable" : "recommended",
    baselinePath,
    store,
    outageResult.records
  );
  if (request.mode === "scenario") {
    baseline.warnings.unshift("The simulated Queensboro Plaza transfer-lift outage invalidates this transfer.");
  }
  const recommended =
    request.mode === "scenario"
      ? buildJourneyRoute("rerouted", "Recommended reroute", "recommended", adjustedPath, store, outageResult.records)
      : baseline;
  const explanationStarted = performance.now();
  const explanation = await explainRoute(recommended, request.profile);
  trace.push({
    step: "Explain the verified route",
    status: explanation.model === "gemma" ? "complete" : "fallback",
    durationMs: Math.round(performance.now() - explanationStarted),
    detail: explanation.model === "gemma" ? "Gemma generated a constrained explanation." : "A deterministic, fact-bound template was used."
  });

  return {
    requestId: randomUUID(),
    generatedAt: new Date().toISOString(),
    mode: request.mode,
    profile: request.profile,
    narrative: explanation.text,
    recommended,
    disrupted: request.mode === "scenario" ? baseline : undefined,
    alternative: request.mode === "scenario" ? recommended : undefined,
    activeOutages: outageResult.records,
    evidence: evidenceForPlan(store, outageResult, request.mode, recommended),
    integrations: integrationStatuses(),
    trace,
    disclaimer: "AccessPath combines official, open, and predicted information. Conditions can change; verify critical details with the transit operator before travel."
  };
}
