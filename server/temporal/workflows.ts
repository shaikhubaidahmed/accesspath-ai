import { proxyActivities, sleep } from "@temporalio/workflow";
import type { JourneyMonitorActivities, JourneyMonitorInput, JourneyMonitorResult } from "./types.js";

const { replanJourney, recordRouteChange } = proxyActivities<JourneyMonitorActivities>({
  startToCloseTimeout: "45 seconds",
  retry: { maximumAttempts: 4, initialInterval: "2 seconds", backoffCoefficient: 2 }
});

/**
 * Rechecks evidence before departure without losing state when a worker restarts.
 * In production this can run for hours; the demo starts with three short checks.
 */
export async function journeyMonitorWorkflow(input: JourneyMonitorInput): Promise<JourneyMonitorResult> {
  let latestPlan = await replanJourney({ ...input.request, mode: "live" });
  let routeChanged = false;

  for (let check = 1; check < input.maxChecks; check += 1) {
    await sleep(input.checkEveryMs);
    const nextPlan = await replanJourney({ ...input.request, mode: "live" });
    const changed = nextPlan.recommended.summary !== latestPlan.recommended.summary ||
      nextPlan.recommended.warnings.join("|") !== latestPlan.recommended.warnings.join("|");
    if (changed) {
      routeChanged = true;
      await recordRouteChange(latestPlan, nextPlan);
    }
    latestPlan = nextPlan;
  }

  return {
    requestId: latestPlan.requestId,
    checksCompleted: input.maxChecks,
    routeChanged,
    latestPlan
  };
}
