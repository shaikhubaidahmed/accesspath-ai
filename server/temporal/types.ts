import type { PlanRequest, PlanResponse } from "../../shared/types.js";

export const journeyMonitorTaskQueue = "accesspath-journey-monitor";

export type JourneyMonitorInput = {
  request: PlanRequest;
  checkEveryMs: number;
  maxChecks: number;
};

export type JourneyMonitorResult = {
  requestId: string;
  checksCompleted: number;
  routeChanged: boolean;
  latestPlan: PlanResponse;
};

export interface JourneyMonitorActivities {
  replanJourney(request: PlanRequest): Promise<PlanResponse>;
  recordRouteChange(previous: PlanResponse, current: PlanResponse): Promise<void>;
}
