import { describe, expect, it } from "vitest";
import type { AccessibilityProfile } from "../shared/types.js";
import { loadDataStore } from "./data-store.js";
import { createPlan, findPath } from "./planner.js";
import { getOutages } from "./services/mta.js";

const wheelchairProfile: AccessibilityProfile = {
  stepFree: true,
  avoidLongWalks: true,
  avoidCrowds: false,
  needsAccessibleToilet: false,
  maximumWalkMinutes: 12,
  notes: "I use a wheelchair and need a reliable, step-free transfer."
};

describe("accessible route planner", () => {
  it("finds a route whose start and destination satisfy the hard access constraint", async () => {
    const store = await loadDataStore();
    const path = findPath(store, "723", "R03", wheelchairProfile, new Set());

    expect(path).toBeDefined();
    expect(path!.minutes).toBeGreaterThan(0);
    expect(path!.transitions[0].from).toBe("723");
    expect(path!.transitions.at(-1)!.to).toBe("R03");
  });

  it("reroutes the demo when the Queensboro Plaza transfer lift fails", async () => {
    const store = await loadDataStore();
    const outageResult = await getOutages("scenario", store);
    const plan = await createPlan(
      store,
      { originId: "723", destinationId: "R03", mode: "scenario", profile: wheelchairProfile },
      outageResult,
      []
    );

    const originalStops = plan.disrupted!.stops.map((stop) => stop.station.name);
    const reroutedStops = plan.recommended.stops.map((stop) => stop.station.name);
    expect(originalStops).toContain("Queensboro Plaza");
    expect(reroutedStops).toContain("Times Sq-42 St");
    expect(plan.recommended.status).toBe("recommended");
    expect(plan.evidence.some((entry) => entry.sourceType === "simulation")).toBe(true);
    expect(plan.narrative).toMatch(/MTA accessibility records/);
  });
});
