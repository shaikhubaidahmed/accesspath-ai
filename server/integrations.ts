import type { IntegrationStatus } from "../shared/types.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { projectRoot } from "./config.js";

export function integrationStatuses(): IntegrationStatus[] {
  const tabPfnArtifact = existsSync(path.join(projectRoot, "data/processed/tabpfn-reliability.json"));
  const tinkerReport = existsSync(path.join(projectRoot, "training/reports/tinker-evaluation.json"));
  const backboardReport = existsSync(path.join(projectRoot, "benchmarks/backboard-model-comparison.json"));
  return [
    {
      id: "gemma",
      name: "Gemma",
      role: "Private preference interpretation and route explanation",
      state: config.ollamaBaseUrl ? "configured" : "fallback",
      category: "featured"
    },
    {
      id: "tabpfn",
      name: "TabPFN",
      role: "Equipment reliability forecasting from MTA history",
      state: tabPfnArtifact ? "live" : config.tabPfnApiKey ? "configured" : "fallback",
      category: "featured"
    },
    {
      id: "render",
      name: "Render",
      role: "Web application and orchestration runtime",
      state: config.renderServiceId || process.env.RENDER ? "live" : "fallback",
      category: "featured"
    },
    {
      id: "digitalocean",
      name: "DigitalOcean",
      role: "Open-model inference runtime",
      state: config.digitalOceanAppId ? "live" : "fallback",
      category: "featured"
    },
    {
      id: "mastra",
      name: "Mastra",
      role: "Typed evidence-to-route workflow",
      state: "live",
      category: "partner"
    },
    {
      id: "elevenlabs",
      name: "ElevenLabs",
      role: "Accessible spoken journey briefings",
      state: config.elevenLabsKey && config.elevenLabsVoiceId ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "serpapi",
      name: "SerpApi",
      role: "Fresh official venue-access evidence",
      state: config.serpApiKey ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "mongodb",
      name: "MongoDB Atlas",
      role: "Profiles, approved facts, and plan history",
      state: config.mongodbUri ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "sentry",
      name: "Sentry",
      role: "Agent and API failure tracing",
      state: config.sentryDsn ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "temporal",
      name: "Temporal",
      role: "Durable journey monitoring and replanning",
      state: config.temporalAddress ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "tigerdata",
      name: "Tiger Data",
      role: "Time-aware evidence and vector retrieval",
      state: config.tigerDatabaseUrl ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "backboard",
      name: "Backboard",
      role: "Open-model comparison and routing",
      state: backboardReport ? "live" : config.backboardApiKey ? "configured" : "fallback",
      category: "partner"
    },
    {
      id: "tinker",
      name: "Tinker",
      role: "Fine-tuned accessibility evidence extraction",
      state:
        tinkerReport && config.tinkerInferenceUrl && config.tinkerModel
          ? "live"
          : tinkerReport || config.tinkerApiKey
            ? "configured"
            : "fallback",
      category: "featured"
    },
    {
      id: "mta",
      name: "MTA Open Data",
      role: "Official station, service, equipment, and outage facts",
      state: "live",
      category: "open-source"
    }
  ];
}
