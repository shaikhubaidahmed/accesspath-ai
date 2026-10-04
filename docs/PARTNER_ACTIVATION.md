# Partner activation and proof checklist

One project may enter several categories, but the challenge requires genuine use. Add a category to the DEV post only after its proof item exists. A configured adapter without a completed run is described as ready, not live.

## Highest-value activation order

1. Keep the public Render service healthy and capture its service screen for the demo.
2. Run Gemma through Ollama, locally or on a private DigitalOcean GPU Droplet. Capture one workflow trace whose interpretation and explanation steps report Gemma.
3. Commit the completed TabPFN evaluation, model metadata, and reliability artifacts, then show the scored route evidence.
4. Commit the completed Tinker evaluation with its before-and-after metrics and persistent checkpoint paths, then show it in the demo.
5. Add ElevenLabs credentials and record the briefing audio in the demo video.
6. Configure Sentry, run the outage demo, and capture its agent trace waterfall.
7. Start Temporal, run its worker, call `/api/monitor`, and capture the workflow event history.
8. Configure MongoDB Atlas and Tiger Data, run one plan, and capture the stored plan and evidence events.
9. Add SerpApi, run a destination evidence search, and capture the official-domain result.
10. Run `npm run benchmark:backboard` and commit the model-comparison report.

## Category proof matrix

| Category | Activation | Proof to put in the post | Ready now |
| --- | --- | --- | --- |
| Best Use of Render | public deployment complete | public demo URL, successful health and outage checks, and Render service screen | public proof complete; screenshot pending |
| Best Use of TabPFN | authenticated run complete | metric table, model metadata, evaluation, and 150 forecasts | local proof complete |
| Best Use of Tinker | authenticated run complete | baseline and tuned accuracy, full loss sequence, model identity, and persistent checkpoint paths | local proof complete |
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

Before publishing, replace every placeholder in `SUBMISSION.md`, add the public URLs, and delete any prize category whose proof is incomplete. Do not add a reaction or quote unless the sibling actually tested the project and approved its use.
