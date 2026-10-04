# Partner activation and proof checklist

One project may enter several categories, but the challenge requires genuine use. Add a category to the DEV post only after its proof item exists. A configured adapter without a completed run is described as ready, not live.

## Highest-value activation order

1. Deploy the web service on Render and save the public URL.
2. Run Gemma through Ollama, locally or on a private DigitalOcean GPU Droplet. Capture one workflow trace whose interpretation and explanation steps report Gemma.
3. Run the TabPFN benchmark and commit the generated evaluation and reliability artifacts.
4. Run the Tinker fine-tune and commit its before-and-after evaluation.
5. Add ElevenLabs credentials and record the briefing audio in the demo video.
6. Configure Sentry, run the outage demo, and capture its agent trace waterfall.
7. Start Temporal, run its worker, call `/api/monitor`, and capture the workflow event history.
8. Configure MongoDB Atlas and Tiger Data, run one plan, and capture the stored plan and evidence events.
9. Add SerpApi, run a destination evidence search, and capture the official-domain result.
10. Run `npm run benchmark:backboard` and commit the model-comparison report.

## Category proof matrix

| Category | Activation | Proof to put in the post | Ready now |
| --- | --- | --- | --- |
| Best Use of Render | Deploy `render.yaml` | public demo URL and Render service screenshot | code ready |
| Best Use of TabPFN | set `TABPFN_TOKEN`; run `ml/train_tabpfn.py` | metric table plus `tabpfn-evaluation.json` | code ready |
| Best Use of Tinker | set `TINKER_API_KEY`; run `training/tinker_finetune.py` | baseline and tuned accuracy plus loss curve | code ready |
| Best Use of DigitalOcean | deploy `.do/app.yaml` or the Gemma GPU Droplet | app URL or Droplet console and private model endpoint | manifest ready |
| Best Use of Gemma | run `gemma3:4b` through Ollama | workflow trace showing Gemma on real requests | adapter ready |
| Best Use of Backboard | set `BACKBOARD_API_KEY`; run benchmark script | committed three-model comparison | code ready |
| Best Use of ElevenLabs | set key and voice ID; play briefing | audible segment in demo video | adapter ready |
| Best Use of Mastra | run any plan | five-step trace in UI and source link | complete |
| Best Use of MongoDB Atlas | set `MONGODB_URI`; run a plan | stored `journey_plans` document with expiry | adapter ready |
| Best Use of Sentry Agent Tracing | set `SENTRY_DSN`; run plans and one failure | workflow span screenshot with durations | instrumentation ready |
| Best Use of SerpApi | set key; run plan | official-domain evidence record in ledger | adapter ready |
| Best Use of Temporal | set address; run worker and monitor endpoint | event history showing timer, retry policy, and activities | workflow ready |
| Best Use of Tiger Data | set `TIGER_DATABASE_URL`; run a plan | timestamped rows in `accesspath_evidence_events` | adapter ready |
| GitHub Actions release proof | push the repository and run the supplied workflow | passing Actions run for tests, audit, smoke test, and container build | workflow ready; not a Copilot category claim |

The Arduino category is intentionally omitted because AccessPath has no physical UNO Q component. Entire and GitHub Copilot are also omitted because neither was used to build this repository. A passing GitHub Actions run is still useful release evidence.

## Commands

```bash
# public data and deterministic fixture
npm run data:sync

# open-model comparison
BACKBOARD_API_KEY=... npm run benchmark:backboard

# durable monitor worker
TEMPORAL_ADDRESS=localhost:7233 npm run temporal:worker

# production verification
npm test && npm run typecheck && npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=8787 npm start
```

## Final demo recording

Keep the video under three minutes:

1. State who the project is for in one sentence.
2. Show the Grand Central to Astoria route before the simulated lift failure.
3. Trigger the outage and show the Times Square reroute.
4. Open the evidence ledger and point to the simulation label and timestamps.
5. Play the ElevenLabs briefing.
6. Open the workflow trace, then show the TabPFN and Tinker evaluation results.
7. End on the deployed URL and repository.

Before publishing, replace every placeholder in `SUBMISSION.md`, add the public URLs, include the friend's reaction if they tested it, and delete any prize category whose proof is incomplete.
