import { describe, expect, it } from "vitest";
import { runPlanWorkflow } from "./workflow.js";

describe("Mastra evidence workflow", () => {
  it("produces a sourced plan with an auditable five-step trace", async () => {
    const plan = await runPlanWorkflow({
      originId: "723",
      destinationId: "R03",
      mode: "replay",
      profile: {
        stepFree: true,
        avoidLongWalks: true,
        avoidCrowds: false,
        needsAccessibleToilet: false,
        maximumWalkMinutes: 12,
        notes: "wheelchair user"
      }
    });

    expect(plan.recommended.stops.length).toBeGreaterThan(2);
    expect(plan.evidence.length).toBeGreaterThanOrEqual(3);
    expect(plan.trace.map((item) => item.step)).toEqual([
      "Interpret access needs",
      "Resolve live infrastructure evidence",
      "Compute constrained route",
      "Explain the verified route",
      "Ground destination evidence"
    ]);
    expect(plan.integrations.find((item) => item.id === "mastra")?.state).toBe("live");
  });
});
