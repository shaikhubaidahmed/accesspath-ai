import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "../server/config.js";

type Example = { split: string; messages: Array<{ role: string; content: string }> };

const apiKey = process.env.BACKBOARD_API_KEY;
if (!apiKey) throw new Error("Set BACKBOARD_API_KEY before running the open-model comparison.");

const models = (process.env.BACKBOARD_MODELS ?? "google/gemma-3-12b-it,meta-llama/llama-3.3-70b-instruct,qwen/qwen3-14b")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const rows = (await readFile(path.join(projectRoot, "training/accessibility_examples.jsonl"), "utf8"))
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as Example)
  .filter((example) => example.split === "eval");

function extractJson(value: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(value.slice(value.indexOf("{"), value.lastIndexOf("}") + 1)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function ask(model: string, example: Example) {
  const slash = model.indexOf("/");
  const provider = slash === -1 ? "openrouter" : model.slice(0, slash);
  const modelName = slash === -1 ? model : model.slice(slash + 1);
  const started = performance.now();
  const response = await fetch("https://app.backboard.io/api/threads/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "X-API-Key": apiKey! },
    body: JSON.stringify({
      content: `${example.messages[0].content}\n\nRider note: ${example.messages[1].content}`,
      llm_provider: provider === "google" || provider === "meta-llama" || provider === "qwen" ? "openrouter" : provider,
      model_name: provider === "openrouter" ? modelName : model,
      openrouter: { sort: "price" },
      stream: false
    })
  });
  if (!response.ok) throw new Error(`Backboard ${model} returned ${response.status}: ${await response.text()}`);
  const payload = (await response.json()) as Record<string, unknown>;
  const text = String(payload.content ?? (payload.message as { content?: unknown } | undefined)?.content ?? "");
  return {
    actual: extractJson(text),
    latencyMs: Math.round(performance.now() - started),
    resolvedModel: payload.resolved_model,
    costUsd: payload.cost_usd
  };
}

const results = [];
for (const model of models) {
  let fields = 0;
  let correct = 0;
  let exact = 0;
  let latencyMs = 0;
  const cases = [];
  for (const example of rows) {
    const expected = JSON.parse(example.messages[2].content) as Record<string, unknown>;
    const response = await ask(model, example);
    fields += Object.keys(expected).length;
    correct += Object.entries(expected).filter(([key, value]) => response.actual?.[key] === value).length;
    exact += Number(JSON.stringify(response.actual) === JSON.stringify(expected));
    latencyMs += response.latencyMs;
    cases.push({ note: example.messages[1].content, expected, ...response });
  }
  results.push({
    model,
    exactMatch: exact / rows.length,
    fieldAccuracy: correct / fields,
    averageLatencyMs: Math.round(latencyMs / rows.length),
    cases
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  provider: "Backboard unified model API",
  task: "accessibility constraint extraction",
  results: results.sort((a, b) => b.fieldAccuracy - a.fieldAccuracy || a.averageLatencyMs - b.averageLatencyMs)
};
await mkdir(path.join(projectRoot, "benchmarks"), { recursive: true });
await writeFile(path.join(projectRoot, "benchmarks/backboard-model-comparison.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
