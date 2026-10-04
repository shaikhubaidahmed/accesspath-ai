import { fileURLToPath } from "node:url";
import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.js";
import { config } from "../config.js";
import { journeyMonitorTaskQueue } from "./types.js";

if (!config.temporalAddress) {
  throw new Error("Set TEMPORAL_ADDRESS before starting the AccessPath journey monitor worker.");
}

const connection = await NativeConnection.connect({ address: config.temporalAddress });
const worker = await Worker.create({
  connection,
  namespace: config.temporalNamespace,
  taskQueue: journeyMonitorTaskQueue,
  workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
  activities
});

console.log(`Temporal worker polling ${journeyMonitorTaskQueue} at ${config.temporalAddress}`);
await worker.run();
