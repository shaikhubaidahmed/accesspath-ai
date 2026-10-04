# Competition audit

This audit answers a stricter question than “does adapter code exist?”: can a judge verify that the technology performed meaningful work in the submitted project?

## Current category gate

| Category | Actually used now? | Evidence available | Submission decision |
| --- | --- | --- | --- |
| Mastra | Yes | Five-step runtime trace, source, and passing tests | Claim after public deployment |
| Gemma | Not yet proven | Ollama adapter and private deployment manifest | Run Gemma and capture trace first |
| TabPFN | Yes, locally | Authenticated evaluation, model metadata, and 150 route-engine forecasts | Claim after artifacts are committed and shown in the demo |
| Tinker | Run completed | Before/after holdout outputs and 12-step loss sequence | Rerun with persistent checkpoint capture before claiming |
| Backboard | Not yet | Reproducible benchmark script only | Generate comparison report first |
| ElevenLabs | Not yet | Voice endpoint and UI control; browser fallback active | Record partner-generated audio first |
| Temporal | Not yet proven | Workflow, worker, retry policy, endpoint, degraded-mode test | Capture server event history first |
| MongoDB Atlas | Not yet | Persistence adapter; memory fallback active | Capture stored expiring plan first |
| Tiger Data | Not yet | Timestamped-event adapter; memory fallback active | Capture hosted event rows first |
| Sentry | Not yet | Instrumentation exists; no DSN evidence | Capture trace and handled failure first |
| SerpApi | Not yet | Official-domain search adapter | Capture returned evidence record first |
| Render | Not yet | Dockerfile and Blueprint | Deploy and verify public URL first |
| DigitalOcean | Not yet | App Platform and GPU cloud-init manifests | Deploy and capture cloud proof first |
| GitHub Copilot | No | Copilot was not used; GitHub Actions is separate | Do not claim |
| Arduino | No | No relevant implementation | Do not claim |
| Entire | No | Not used | Do not claim |

`fallback` in the interface means the core product still works; it does not mean the named partner was used. `configured` means credentials or an endpoint are present. `live` is reserved for a local component that ran or a partner artifact that exists.

## Judge simulation

### Writing quality: strongest current asset

The submission has a clear problem, safety boundaries, and an understandable technical story. The confirmed sibling relationship and step-free access need are included without publishing a name, diagnosis, or unverified reaction.

### Prompt and theme relevance: strong

The friend is not decorative: the need for dependable step-free travel defines the hard constraint, evidence ledger, backup route, audio briefing, privacy boundary, and interface. Open-source AI is central through Mastra and Gemma, but it is deliberately kept outside the safety-critical accessibility decision.

### Creativity: strong

AccessPath adds an evidence contract to route planning. It can show why a route was rejected, what changed, which claim is simulated, and which source supports the replacement. The side-by-side disrupted and recommended journeys make that idea legible within seconds.

### Technical execution: strong locally, public operations pending

Current local gate:

- 496 official station records;
- 1,302 graph edges;
- 707 equipment records;
- 60 outage records in the synchronized snapshot;
- 132 historical reliability profiles;
- 11 automated tests across four test files;
- TypeScript client and server checks pass;
- production build passes;
- dependency audit reports no known vulnerabilities.

The remaining execution risk is operational proof: public deployment, a public CI run, and real partner service traces.

### Partner technology: broad implementation, narrow proof today

Mastra is proven in the default build, and TabPFN now has an authenticated local run plus route-engine artifacts. Tinker has local before-and-after evidence but still needs persistent checkpoint proof. The remaining partner paths do not earn credit without execution evidence. Activate them in the order in `PARTNER_ACTIVATION.md`; delete every unproven category from the final DEV post.

## Remaining risks, in priority order

1. **No public demo or video URL:** required for judging; the public repository is already available.
2. **Tinker checkpoint proof is incomplete:** rerun the updated script once to record persistent baseline and fine-tuned checkpoint paths.
3. **Most external partner run artifacts are still absent:** TabPFN and Tinker now have local run evidence, while the remaining integrations still need proof.
4. **No recorded three-minute demo:** the strongest behavior is easier to understand on video than in prose.
5. **Live transit uncertainty:** use the labelled scenario as the judging path and demonstrate live mode separately.

## Release decision

The product is ready for partner activation and a public deployment. It is not ready for final submission while placeholders remain in `SUBMISSION.md` or while categories without proof are listed. Passing criterion: no placeholders, public links work in a private browser, the video follows `demo-script.md`, and every listed category has one linked evidence item.
