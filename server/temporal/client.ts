import { Client, Connection } from "@temporalio/client";
import type { PlanRequest } from "../../shared/types.js";
import { config } from "../config.js";
import { journeyMonitorTaskQueue, type JourneyMonitorInput } from "./types.js";
import { journeyMonitorWorkflow } from "./workflows.js";

export async function startJourneyMonitor(request: PlanRequest) {
  if (!config.temporalAddress) throw new Error("Temporal is not configured.");
  const connection = await Connection.connect({ address: config.temporalAddress });
  const client = new Client({ connection, namespace: config.temporalNamespace });
  const workflowId = `accesspath-${crypto.randomUUID()}`;
  const input: JourneyMonitorInput = { request, checkEveryMs: 30_000, maxChecks: 3 };
  const handle = await client.workflow.start(journeyMonitorWorkflow, {
    taskQueue: journeyMonitorTaskQueue,
    workflowId,
    args: [input]
  });
  return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId, state: "monitoring" as const };
}
