# Partner evidence ledger

This is the proof index for the final submission. **Ready** means an integration and honest fallback exist in the repository. **Proven** means a real partner-backed run has produced inspectable output. Only proven categories should appear in the published DEV post.

## Proven in the default build

### Mastra: Best Use of Mastra

- **What we built:** a typed five-step evidence-to-route workflow.
- **Where it is used:** `server/workflow.ts`, called by `POST /api/plan`.
- **Why it matters:** judges can inspect interpretation, evidence resolution, constrained planning, explanation, and enrichment independently.
- **Demo path:** run the outage demo, then open **Inspect this run**.
- **Repository evidence:** `server/workflow.test.ts` verifies all five steps; the UI renders states and durations.
- **Status:** proven locally. A public URL and source link remain required for submission.

## Partner runs with committed local evidence

### TabPFN: Best Use of TabPFN

- **What we built:** chronological lift-risk forecasting from lagged MTA equipment history, compared with a histogram gradient-boosting baseline.
- **Where it is used:** `ml/train_tabpfn.py`; generated forecasts are loaded by `server/data-store.ts` and labelled in the evidence ledger.
- **Why it matters:** two currently working routes may have different historical failure risk.
- **Repository evidence:** `ml/reports/tabpfn-evaluation.json`, `ml/reports/tabpfn-model.json`, and `data/processed/tabpfn-reliability.json` contain the authenticated run, model identity, and 150 station-complex forecasts.
- **Result:** TabPFN scored 0.7888 balanced accuracy, 0.8583 F1, and 0.8946 ROC AUC on 3,823 chronological holdout rows.
- **Status:** proven locally; public repository and demo evidence remain required for the final submission.

### Tinker: Best Use of Tinker

- **What we built:** a rank-16 LoRA fine-tune for structured accessibility-note extraction plus an OpenAI-compatible inference adapter.
- **Where it is used:** `training/tinker_finetune.py`, `training/accessibility_examples.jsonl`, and `server/services/gemma.ts`.
- **Why it matters:** this measures whether specialization improves exact schema extraction over the base model.
- **Repository evidence:** `training/reports/tinker-evaluation.json` records the model identity, persistent baseline and fine-tuned sampler checkpoint paths, dependency versions, 12-step loss sequence, and untouched four-example holdout outputs.
- **Result:** exact match improved from 0% to 50%, and field accuracy improved from 0% to 90% (18 of 20 fields).
- **Status:** proven locally through an authenticated run; public repository and demo evidence remain required for the final submission.

## Built and awaiting a real partner run

### Gemma: Best Use of Gemma

- **What we built:** private accessibility-note extraction and fact-bound explanation through Ollama.
- **Where it is used:** `server/services/gemma.ts` and the interpretation/explanation workflow steps.
- **Why it matters:** sensitive rider notes can stay on infrastructure the operator controls.
- **Demo path:** set `OLLAMA_BASE_URL`, run a plan, and show `gemma` in the workflow trace.
- **Evidence required:** screenshot or recording of a validated Gemma run and the exact model name.
- **Status:** adapter ready; default demo uses deterministic rules.

### Backboard: Best Use of Backboard

- **What we built:** one fixed held-out extraction benchmark across three open models through a unified API.
- **Where it is used:** `scripts/benchmark-backboard.ts`.
- **Why it matters:** model choice becomes an accuracy, latency, and cost decision instead of a guess.
- **Demo path:** run `BACKBOARD_API_KEY=... npm run benchmark:backboard`.
- **Evidence required:** `benchmarks/backboard-model-comparison.json` with resolved models, field accuracy, latency, and cost.
- **Status:** benchmark ready; report absent.

### ElevenLabs: Best Use of ElevenLabs

- **What we built:** an audio rendering endpoint for the verified route briefing, with browser speech as fallback.
- **Where it is used:** `POST /api/voice` in `server/app.ts` and **Listen to briefing** in the result card.
- **Why it matters:** a rider can hear the critical transfer and warning without reading a dense itinerary.
- **Demo path:** set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`, then play the briefing.
- **Evidence required:** audible ElevenLabs segment in the demo and a configured status in `/api/health`.
- **Status:** adapter ready; browser speech is the default fallback.

### Temporal: Best Use of Temporal

- **What we built:** a durable pre-departure monitor with timers, activity retries, and route-change records.
- **Where it is used:** `server/temporal/` and `POST /api/monitor`.
- **Why it matters:** accessibility can change after a route is planned; monitoring must survive process restarts.
- **Demo path:** start Temporal and `npm run temporal:worker`, call `/api/monitor`, then show the event history.
- **Evidence required:** workflow ID and history showing at least one timer and planning activity.
- **Status:** workflow ready; Temporal server proof pending.

### MongoDB Atlas: Best Use of MongoDB Atlas

- **What we built:** expiring storage for plan documents.
- **Where it is used:** `server/persistence.ts`.
- **Why it matters:** the app can retain a short audit trail without keeping rider data indefinitely.
- **Demo path:** set `MONGODB_URI`, run a plan, and inspect `journey_plans`.
- **Evidence required:** redacted Atlas document and TTL index or expiry field.
- **Status:** adapter ready; Atlas proof pending.

### Tiger Data: Best Use of Tiger Data

- **What we built:** timestamped evidence-event persistence in PostgreSQL-compatible storage.
- **Where it is used:** `server/persistence.ts`.
- **Why it matters:** source claims can be compared across observation times instead of overwritten.
- **Demo path:** set `TIGER_DATABASE_URL`, run a plan, and query `accesspath_evidence_events`.
- **Evidence required:** redacted query result with source, observed time, request ID, and simulation state.
- **Status:** adapter ready; hosted database proof pending.

### Sentry: Best Use of Sentry Agent Tracing

- **What we built:** an `ai.workflow` transaction around each plan plus exception capture.
- **Where it is used:** `server/index.ts` and `server/app.ts`.
- **Why it matters:** failures and workflow latency are observable without hiding degraded output from the rider.
- **Demo path:** set `SENTRY_DSN`, run a plan and one invalid request, then inspect the trace and error.
- **Evidence required:** redacted Sentry waterfall and captured failure.
- **Status:** instrumentation ready; hosted trace pending.

### SerpApi: Best Use of SerpApi

- **What we built:** optional fresh destination evidence restricted to official MTA and New York State domains.
- **Where it is used:** `server/services/serpapi.ts`, fifth Mastra step.
- **Why it matters:** fresh supporting evidence can be added without treating arbitrary web pages as accessibility facts.
- **Demo path:** set `SERPAPI_API_KEY`, run a plan, and inspect the additional ledger record.
- **Evidence required:** returned official URL, timestamp, and successful enrichment step.
- **Status:** adapter ready; search proof pending.

### Render: Best Use of Render

- **What we built:** a production container and Render Blueprint for the combined web/API service.
- **Where it is used:** `Dockerfile` and `render.yaml`.
- **Why it matters:** the exact tested artifact can become the public judging demo.
- **Demo path:** deploy the Blueprint and run `/api/health` plus the outage scenario.
- **Evidence required:** public URL, service screenshot, and production health response.
- **Status:** deployment ready; public service pending.

### DigitalOcean: Best Use of DigitalOcean

- **What we built:** App Platform deployment plus cloud-init for a private Ollama/Gemma host.
- **Where it is used:** `.do/app.yaml` and `deploy/digitalocean/cloud-init.yaml`.
- **Why it matters:** open-model inference can run on controlled infrastructure instead of sending rider notes to a closed model API.
- **Demo path:** deploy the app or private model host and capture one Gemma-backed trace.
- **Evidence required:** redacted service view, endpoint health, and model-backed workflow trace.
- **Status:** manifests ready; cloud deployment pending.

### GitHub Actions: engineering proof, not a current prize claim

- **What we built:** CI for tests, type checks, production build, dependency audit, Python compilation, production smoke checks, and container build.
- **Where it is used:** `.github/workflows/ci.yml`.
- **Why it matters:** public proof can reproduce the same release gate used locally.
- **Demo path:** push to the public repository and open the passing workflow run.
- **Evidence required:** public Actions URL and green jobs.
- **Status:** workflow ready; public run pending. This does not qualify for a GitHub Copilot category because Copilot was not used.

## Deliberately not claimed

- **Arduino:** AccessPath has no physical UNO Q component.
- **Entire:** it was not used to build or review this project.
- **GitHub Copilot:** it was not used to build this project; GitHub Actions alone does not qualify.
- Any integration that remains in `fallback` and has no external run evidence at submission time.
