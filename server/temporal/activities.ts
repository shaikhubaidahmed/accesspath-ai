import type { PlanRequest, PlanResponse } from "../../shared/types.js";
import { persistPlan } from "../persistence.js";
import { runPlanWorkflow } from "../workflow.js";

export async function replanJourney(request: PlanRequest): Promise<PlanResponse> {
  return runPlanWorkflow(request);
}

export async function recordRouteChange(_previous: PlanResponse, current: PlanResponse): Promise<void> {
  await persistPlan(current);
}
