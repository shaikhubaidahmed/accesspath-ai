import path from "node:path";
import * as Sentry from "@sentry/node";
import express from "express";
import { ZodError } from "zod";
import { config, projectRoot } from "./config.js";
import { loadDataStore } from "./data-store.js";
import { integrationStatuses } from "./integrations.js";
import { persistPlan, recentMemoryPlans } from "./persistence.js";
import { planRequestSchema, voiceRequestSchema } from "./schemas.js";
import { startJourneyMonitor } from "./temporal/client.js";
import { runPlanWorkflow } from "./workflow.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "250kb" }));

  app.get("/api/health", async (_request, response) => {
    const store = await loadDataStore();
    response.json({
      ok: true,
      service: "accesspath-api",
      dataUpdatedAt: store.graph.generatedAt,
      integrations: integrationStatuses()
    });
  });

  app.get("/api/bootstrap", async (_request, response) => {
    const store = await loadDataStore();
    const stations = Object.values(store.graph.stations)
      .filter((station) => station.ada > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
    response.json({
      stations,
      demo: {
        originId: "723",
        destinationId: "R03",
        title: "Grand Central to Astoria Boulevard",
        description: "A transfer-dependent trip that can be rerouted when the Queensboro Plaza lift is unavailable."
      },
      integrations: integrationStatuses(),
      dataUpdatedAt: store.graph.generatedAt
    });
  });

  app.get("/api/evidence/scenario", async (_request, response) => {
    const store = await loadDataStore();
    response.json({
      label: "SIMULATION",
      description: "Local demonstration record. This is not a live MTA outage.",
      capturedAt: store.scenario.capturedAt,
      simulated: store.scenario.simulated,
      record: store.scenario.record
    });
  });

  app.post("/api/plan", async (request, response, next) => {
    try {
      const input = planRequestSchema.parse(request.body);
      const plan = await Sentry.startSpan(
        { name: "accesspath.plan", op: "ai.workflow", attributes: { evidenceMode: input.mode } },
        () => runPlanWorkflow(input)
      );
      const persistence = await persistPlan(plan);
      response.json({ ...plan, persistence });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/monitor", async (request, response, next) => {
    try {
      const input = planRequestSchema.parse(request.body);
      if (!config.temporalAddress) {
        response.status(503).json({
          error: "Temporal is not configured.",
          detail: "Set TEMPORAL_ADDRESS and run npm run temporal:worker to enable durable pre-departure checks."
        });
        return;
      }
      const monitor = await startJourneyMonitor(input);
      response.status(202).json(monitor);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/voice", async (request, response, next) => {
    try {
      const { text } = voiceRequestSchema.parse(request.body);
      if (!config.elevenLabsKey || !config.elevenLabsVoiceId) {
        response.status(204).end();
        return;
      }
      const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": config.elevenLabsKey,
          accept: "audio/mpeg"
        },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" })
      });
      if (!upstream.ok || !upstream.body) {
        response.status(502).json({ error: "Voice provider did not return audio." });
        return;
      }
      response.setHeader("content-type", "audio/mpeg");
      response.setHeader("cache-control", "private, max-age=300");
      response.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/debug/recent", (_request, response) => {
    response.json(recentMemoryPlans().map((plan) => ({ requestId: plan.requestId, generatedAt: plan.generatedAt, mode: plan.mode })));
  });

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(projectRoot, "dist")));
    app.get("/{*splat}", (_request, response) => response.sendFile(path.join(projectRoot, "dist", "index.html")));
  }

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    Sentry.captureException(error);
    if (error instanceof ZodError) {
      response.status(400).json({ error: "Invalid request", details: error.issues });
      return;
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    response.status(500).json({ error: message });
  });

  return app;
}
