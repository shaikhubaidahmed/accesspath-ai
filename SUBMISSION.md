---
title: "AccessPath: the backup route is part of the route"
published: false
tags: devchallenge, weekendchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Weekend Challenge: Build for a Friend](https://dev.to/challenges/hacktoberfest-weekend-2026-10-01).*

## What I Built

An "accessible" journey can stop being accessible because one lift fails between planning and arrival. The usual route card does not tell my sibling which piece of infrastructure the trip depends on, how recently it was checked, or what happens when that piece fails.

My sibling relies on step-free transit, but ordinary route planners do not reliably account for inaccessible transfers or elevator outages. A single unavailable lift can make the suggested journey unusable.

I built AccessPath around that gap. It plans step-free NYC Subway journeys, checks the equipment and outage evidence behind them, and prepares another valid route when the first one breaks. The rider's requirements stay fixed while the network changes.

The demonstration starts at Grand Central-42 St and ends at Astoria Blvd. Plan A changes from the 7 to the N at Queensboro Plaza. I then inject a clearly labelled failure of the transfer lift. That single change invalidates Plan A, and AccessPath reruns the graph search. Plan B keeps the step-free constraint and transfers at Times Sq-42 St instead.

The interface keeps both plans on screen. It also shows the evidence ledger, current warnings, model confidence, source timestamps, and the five operations that produced the recommendation. A simulation never appears as a live MTA fact.

## Demo

- Live app: **Local development only (`http://127.0.0.1:5173`); a public deployment is not available yet.**
- Three-minute video: **Not recorded yet.**

For the stable judging path:

1. Leave Grand Central-42 St and Astoria Blvd selected.
2. Keep Step-free and Short transfers checked.
3. Choose Outage demo.
4. Press Build my access plan.
5. Compare the interrupted Queensboro Plaza route with the Times Square reroute.
6. Open Evidence and then Inspect this run.
7. Play the spoken journey briefing.

The before-and-after route is available in the local Outage demo. A public screenshot has not been added yet.

## Code

Repository: **[github.com/shaikhubaidahmed/accesspath-ai](https://github.com/shaikhubaidahmed/accesspath-ai)**

The repository includes the application, reproducible public-data pipeline, tests, deployment manifests, TabPFN benchmark, Tinker training and evaluation pipeline, and partner activation evidence. The checked-in replay fixture lets judges run the same scenario even if an external service is unavailable.

```bash
git clone https://github.com/shaikhubaidahmed/accesspath-ai.git
cd accesspath-ai
npm install
npm run dev
```

## How I Built It

### I separated interpretation from authority

The first design decision was deciding what AI should be allowed to do.

When configured, Gemma reads a short rider note and converts it into typed preferences such as `stepFree`, `avoidLongWalks`, and `needsAccessibleToilet`. It also turns a completed plan into a concise briefing. Gemma does not decide whether a station is accessible. It cannot clear an outage or quietly loosen a hard preference to save time.

Those decisions belong to official MTA records and a deterministic graph search. Every start, arrival, and transfer point is checked. A transfer carries a larger cost for someone who asked for shorter station changes, and an outage on a required platform path blocks that interchange.

This boundary made the open model useful without asking it to be a transit database.

### Mastra makes the planning run inspectable

I built the agent path as a typed Mastra workflow:

```text
rider note
  -> interpret access needs
  -> resolve MTA evidence
  -> compute constrained route
  -> explain verified result
  -> ground extra official evidence
```

Each step returns `complete` or `fallback`, a duration, and a plain-language detail. If local Gemma is down, the workflow preserves explicit checkboxes and uses local rules. If the live MTA endpoint times out, it switches to the recorded response and says so. That degraded state appears in the UI instead of disappearing into a server log.

### The graph came from public transport data

The data script combines the MTA Subway Stations dataset with Regular Subway GTFS. It creates travel edges from adjacent stops and walking edges inside station complexes. Equipment and outage feeds add the infrastructure state. Monthly availability records provide the reliability history.

The current processed graph contains 496 stops plus the travel and interchange edges needed for routing. `npm run data:sync` rebuilds it from the official endpoints.

There are three evidence modes:

- Live asks the current MTA outage feed.
- Replay uses a timestamped response for a stable demonstration.
- Outage demo adds one local, labelled Queensboro Plaza transfer-lift failure.

The evidence ledger keeps the source type, URL, observation time, freshness note, and confidence for every claim.

### TabPFN predicts which lift dependencies deserve caution

Elevator status is a point-in-time fact. Reliability is a different question: how much caution should a route receive before a new outage appears?

My TabPFN pipeline uses monthly MTA availability and unscheduled-outage history. It creates one-month lags and three-month rolling features, then holds out the latest 20 percent of months. This chronological split prevents future months from leaking into training.

I compare TabPFN with a histogram gradient-boosting baseline on balanced accuracy, F1, ROC AUC, and runtime. The real TabPFN run writes station-complex forecasts that the TypeScript route engine loads directly.

An authenticated TabPFN run has not been completed, so I am not claiming model metrics or entry in the TabPFN prize category yet.

The script refuses to write a `tabpfn` artifact without a real token. A fallback score should not inherit a partner's name.

### Tinker measures the value of specialization

The Tinker training path fine-tunes Qwen3.5-4B for one narrow task: turn a rider's plain-language access note into five typed constraints. The dataset includes wheelchair use, fatigue, crowd sensitivity, toilet access, and explicit walking limits. Four examples remain untouched for evaluation.

The training script measures the base model first, performs 12 LoRA supervised updates, and measures the same holdout again. It records exact JSON match, per-field accuracy, loss, and elapsed time.

The Tinker fine-tune has not been run, so I am not claiming before-and-after metrics or entry in the Tinker prize category yet.

That before-and-after result matters more than saying a model was fine-tuned.

### The backup can keep watching

Planning once is not enough for a journey that begins later. The Temporal workflow checks live evidence on a timer, retries failed planning activities with exponential backoff, compares the new route with the previous one, and records a change. Temporal can reconstruct the monitor from its event history if a worker restarts.

This is the part of AccessPath I would trust to run for several hours before a concert or appointment. A route change becomes a durable event, not a tab that has to remain open.

### The other partner components have one job each

- ElevenLabs speaks the evidence-bound route briefing. Browser speech synthesis remains available when the API is not configured.
- Backboard runs the same held-out extraction notes through three open models and records field accuracy, latency, resolved model, and cost.
- MongoDB Atlas stores expiring journey-plan documents.
- Tiger Data stores source claims as timestamped evidence events for later time-aware retrieval.
- SerpApi adds a current result from an official domain when destination evidence is needed.
- Sentry wraps the planning workflow in an agent span and captures API failures.
- The Render Blueprint deploys the public web application from the Docker image.
- The DigitalOcean manifests deploy either the application or the private Ollama and Gemma inference service.

The app reports whether each component is live, configured, or using a fallback. That status grid is also a quick way to review the deployed demo.

### Technical checks

The repository currently passes:

```text
4 test files
10 tests
Oxc TypeScript lint
TypeScript client check
TypeScript server check
Vite production build
npm audit: 0 vulnerabilities
production SPA and API smoke test
```

Tests cover the hard access constraint, the Queensboro Plaza reroute, evidence labels, all five Mastra steps, malformed API input, health metadata, and Temporal's degraded response.

## Why Does Open Innovation Matter?

Access needs are personal. The sentence someone writes about wheelchair use, pain, fatigue, or toilet access should not require a trip through a closed model provider before a route can be calculated.

Gemma can run beside the app through Ollama, including on a laptop. Mastra makes the orchestration readable and replaceable. The deterministic fallback means the hard requirements still work without any model service. If another open-weight model handles this small extraction task better, the Backboard benchmark and Tinker evaluation give me a way to measure that change instead of rebuilding the product around a vendor.

The open approach also made debugging safer. I can inspect the exact profile passed to the route engine, the graph rule that rejected a transfer, the data record supporting a warning, and the sentence Gemma received after the decision. No hidden model judgment gets to become an accessibility fact.

Open innovation gave this project a useful shape: private where the rider speaks, deterministic where safety constraints apply, and sourced wherever the app makes a claim.

## My Agent Session

Agent session: **Not published.**

I used an AI coding agent to help build the project during the challenge window. The session shows the data-source checks, route-engine debugging, accessibility review, production smoke test, and the point where a compiled-path bug was found after the development build had already passed.

## Prize Categories

Current qualified category:

- Best Use of Mastra

I did not enter the Arduino category because the project has no UNO Q component. I also left out Entire and GitHub Copilot because I did not use them to build AccessPath. The included GitHub Actions pipeline is reproducibility evidence, not a Copilot category claim.
