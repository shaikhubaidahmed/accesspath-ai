import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import type { PlanRequest, PlanResponse } from "../shared/types.js";
import { loadDataStore } from "./data-store.js";
import { createPlan } from "./planner.js";
import { accessibilityProfileSchema, planRequestSchema } from "./schemas.js";
import { interpretProfile } from "./services/gemma.js";
import { getOutages, type OutageResult } from "./services/mta.js";
import { findOfficialAccessEvidence } from "./services/serpapi.js";

const traceSchema = z.array(
  z.object({
    step: z.string(),
    status: z.enum(["complete", "fallback"]),
    durationMs: z.number(),
    detail: z.string()
  })
);

const interpretedSchema = planRequestSchema.extend({
  profile: accessibilityProfileSchema,
  trace: traceSchema
});

const outageContextSchema = interpretedSchema.extend({
  outageResult: z.custom<OutageResult>()
});

const interpretNeeds = createStep({
  id: "interpret-access-needs",
  description: "Use local Gemma when available, otherwise deterministic rules, to convert rider notes into explicit constraints.",
  inputSchema: planRequestSchema,
  outputSchema: interpretedSchema,
  execute: async ({ inputData }) => {
    const started = performance.now();
    const result = await interpretProfile(inputData.profile);
    return {
      ...inputData,
      profile: result.profile,
      trace: [
        {
          step: "Understand access needs",
          status: result.model === "rules" ? ("fallback" as const) : ("complete" as const),
          durationMs: Math.round(performance.now() - started),
          detail:
            result.model === "tinker"
              ? "The Tinker fine-tuned adapter produced validated structured constraints."
              : result.model === "gemma"
                ? "Gemma produced validated structured constraints locally."
                : "Built-in privacy-safe rules preserved the preferences selected in the planner."
        }
      ]
    };
  }
});

const resolveLiveEvidence = createStep({
  id: "resolve-live-evidence",
  description: "Load live, replayed, or simulated MTA outage evidence with a timestamped fallback.",
  inputSchema: interpretedSchema,
  outputSchema: outageContextSchema,
  execute: async ({ inputData }) => {
    const started = performance.now();
    const store = await loadDataStore();
    const outageResult = await getOutages(inputData.mode, store);
    return {
      ...inputData,
      outageResult,
      trace: [
        ...inputData.trace,
        {
          step: "Check lift and outage information",
          status: outageResult.state === "fallback" ? ("fallback" as const) : ("complete" as const),
          durationMs: Math.round(performance.now() - started),
          detail: outageResult.detail
        }
      ]
    };
  }
});

const computeRoute = createStep({
  id: "compute-constrained-route",
  description: "Run deterministic routing with ADA transfer constraints, disruption handling, and historical risk scoring.",
  inputSchema: outageContextSchema,
  outputSchema: z.custom<PlanResponse>(),
  execute: async ({ inputData }) => {
    const started = performance.now();
    const store = await loadDataStore();
    const trace = [
      ...inputData.trace,
      {
        step: "Find a route that keeps your requirements",
        status: "complete" as const,
        durationMs: 0,
        detail: "The route engine kept accessible starts, arrivals, and transfers as hard requirements."
      }
    ];
    const plan = await createPlan(store, inputData, inputData.outageResult, trace);
    trace.at(-1)!.durationMs = Math.round(performance.now() - started);
    return plan;
  }
});

const augmentEvidence = createStep({
  id: "augment-official-evidence",
  description: "Use SerpApi, when configured, to add a fresh result from an official operator domain.",
  inputSchema: z.custom<PlanResponse>(),
  outputSchema: z.custom<PlanResponse>(),
  execute: async ({ inputData }) => {
    const started = performance.now();
    const evidence = await findOfficialAccessEvidence(inputData);
    return {
      ...inputData,
      evidence: evidence ? [...inputData.evidence, evidence] : inputData.evidence,
      trace: [
        ...inputData.trace,
        {
          step: "Check extra destination information",
          status: evidence ? ("complete" as const) : ("fallback" as const),
          durationMs: Math.round(performance.now() - started),
          detail: evidence
            ? "SerpApi added a current result from an official domain."
            : "SerpApi is not configured, so no extra web result was added; bundled official sources remain in use."
        }
      ]
    };
  }
});

export const accessPathWorkflow = createWorkflow({
  id: "accesspath-journey-plan",
  description: "Transforms a rider's access needs and public infrastructure evidence into a sourced, disruption-aware journey plan.",
  inputSchema: planRequestSchema,
  outputSchema: z.custom<PlanResponse>()
})
  .then(interpretNeeds)
  .then(resolveLiveEvidence)
  .then(computeRoute)
  .then(augmentEvidence)
  .commit();

export async function runPlanWorkflow(input: PlanRequest): Promise<PlanResponse> {
  const run = await accessPathWorkflow.createRun();
  const result = await run.start({ inputData: input });
  if (result.status !== "success") {
    throw new Error(result.status === "failed" ? result.error.message : `Workflow ended with status ${result.status}`);
  }
  return result.result;
}
