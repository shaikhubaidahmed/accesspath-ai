import path from "node:path";
import "dotenv/config";

// Both tsx (source) and node (compiled server-dist) launch from the project root.
// An explicit override keeps workers and container entrypoints deterministic.
export const projectRoot = path.resolve(process.env.ACCESSPATH_ROOT ?? process.cwd());

export const config = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? "127.0.0.1",
  dataMode: process.env.DATA_MODE ?? "replay",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL?.replace(/\/$/, ""),
  ollamaModel: process.env.OLLAMA_MODEL ?? "gemma3:4b",
  elevenLabsKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  serpApiKey: process.env.SERPAPI_API_KEY,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDatabase: process.env.MONGODB_DATABASE ?? "accesspath",
  tigerDatabaseUrl: process.env.TIGER_DATABASE_URL,
  sentryDsn: process.env.SENTRY_DSN,
  temporalAddress: process.env.TEMPORAL_ADDRESS,
  temporalNamespace: process.env.TEMPORAL_NAMESPACE ?? "default",
  tabPfnApiKey: process.env.TABPFN_API_KEY,
  backboardApiKey: process.env.BACKBOARD_API_KEY,
  tinkerApiKey: process.env.TINKER_API_KEY,
  tinkerInferenceUrl: process.env.TINKER_INFERENCE_URL?.replace(/\/$/, ""),
  tinkerInferenceToken: process.env.TINKER_INFERENCE_TOKEN,
  tinkerModel: process.env.TINKER_MODEL,
  openRouteServiceKey: process.env.OPENROUTESERVICE_API_KEY,
  digitalOceanAppId: process.env.DIGITALOCEAN_APP_ID,
  renderServiceId: process.env.RENDER_SERVICE_ID
};
