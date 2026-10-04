# Hacktoberfest 2026 — Competition Build Agent Instructions

## Mission

You are the lead engineer, product designer, AI architect, researcher, QA engineer, and competition strategist for this repository.

We are participating in the **DEV Hacktoberfest 2026 Weekend Challenge: Build for a Friend**.

Official challenge:
https://dev.to/challenges/hacktoberfest-weekend-2026-10-01

The goal is to build a **genuinely useful, polished, technically impressive product for one real person**, while maximizing our legitimate eligibility across the available Hacktoberfest partner categories.

We are NOT trying to game the judging system.

We ARE aggressively optimizing for:

1. Strong real-world usefulness
2. Exceptional product quality
3. Excellent UX/UI
4. Strong open-source AI usage
5. Deep, meaningful partner integrations
6. A compelling technical story
7. Excellent demoability
8. Excellent DEV submission/write-up
9. Clear evidence for every partner category we enter
10. A product that looks like something a serious startup could ship

The project must feel like **one coherent product**, not a collection of sponsor integrations.

---

# 1. NON-NEGOTIABLE CHALLENGE REQUIREMENTS

The official challenge requires:

- A brand-new project
- Built during the challenge window
- Open-source AI at the core
- Theme: **Build for a Friend**
- The product should solve a real problem for a real person
- The submission must explain why open innovation matters
- The DEV write-up is extremely important
- Partner technologies must actually be used if we claim their category

Do NOT build a generic AI chatbot.

Do NOT build a superficial wrapper around an API.

Do NOT add technology merely for a logo.

Every major technology should solve a real product problem.

---

# 2. PRIMARY PRODUCT DIRECTION

Build a product we will call:

# FriendOS

> A personal AI operating system that helps one real friend make progress on a specific recurring problem in their life.

The exact friend/problem should be determined before implementation.

Examples:

- A friend trying to get their first software job
- A friend preparing for exams
- A friend trying to learn a difficult skill
- A friend running a small business
- A friend trying to organize freelance work
- A friend overwhelmed by projects and deadlines
- A friend trying to build a consistent learning/work routine

DO NOT make the problem generic.

The application should revolve around ONE identifiable person's real workflow.

The user should be able to say:

> "This was built specifically for my friend X because they struggled with Y."

That should become the central story of the project.

---

# 3. PRODUCT CONCEPT

FriendOS should combine:

- Personal AI assistant
- Long-term memory
- Web research
- Personal knowledge retrieval
- Voice interaction
- Data analysis
- Planning
- Automated workflows
- Progress tracking
- Durable background jobs
- AI observability
- Personalized recommendations

The experience should feel like:

> "An AI teammate that actually knows my friend's goals, history, constraints, progress and preferences."

NOT:

> "A chat box with 15 APIs connected to it."

---

# 4. CORE USER EXPERIENCE

The application should have a polished modern dashboard.

Suggested navigation:

- Home
- AI Assistant
- Goals
- Timeline
- Insights
- Research
- Voice
- Data
- Automations
- Memory
- Activity / Agent Runs
- Settings

The home screen should immediately communicate:

### What matters today?

Examples:

- Today's priorities
- Progress toward goals
- Important deadlines
- Recently discovered information
- AI-generated suggestions
- Upcoming automated workflows
- Recent voice interactions
- Personal insights

---

# 5. OPEN-SOURCE AI MUST BE CENTRAL

The application must satisfy the core Hacktoberfest requirement.

Use an open-weight/open-source model as a meaningful part of the product.

## Primary model

Use **Gemma** as one of the primary AI models.

Gemma should not simply appear in the README.

It must perform meaningful product work such as:

- reasoning
- summarization
- planning
- classification
- extracting structured information
- generating personalized recommendations
- processing retrieved context
- assisting with the user's workflow

Prefer a model architecture that allows us to demonstrate:

- model swapping
- local inference where practical
- open-weight inference
- reduced vendor lock-in
- privacy benefits
- reproducibility

The README must explain:

> Why open-source/open-weight AI was important for this product.

---

# 6. TARGET PARTNER CATEGORIES

We are intentionally targeting every relevant category EXCEPT Arduino.

Do not force integrations that don't make sense.

The following are our target categories.

## FEATURED — $200 CATEGORIES

### 1. Best Use of Render

Use Render meaningfully.

Possible implementation:

- Host the production application
- Run the AI backend
- Run an agent service
- Run an inference service
- Host the frontend/API

Render should be part of the actual production architecture.

Document:

- what runs on Render
- why Render was selected
- deployment architecture
- environment configuration
- production URL

---

### 2. Best Use of TabPFN

Use TabPFN for an actual tabular intelligence feature.

Possible functionality:

- Analyze historical productivity
- Predict completion likelihood
- Classify task/project outcomes
- Detect anomalies in behavior
- Forecast progress
- Identify patterns in historical data

Example:

Input:

```text
Date
Hours worked
Tasks planned
Tasks completed
Study sessions
Sleep
Project category
Deadline proximity
```

TabPFN could identify:

- likelihood of completing upcoming goals
- productivity patterns
- anomalous weeks
- factors associated with successful outcomes

This must be a real feature, not a demo-only integration.

Expose the result through the UI.

---

### 3. Best Use of Tinker

Use Tinker for a meaningful model customization/fine-tuning experiment.

Create a narrowly defined task.

For example:

> Personal planning / task prioritization style adapted to the specific friend's preferences.

Build a baseline.

Then use Tinker to fine-tune/customize the model.

Measure:

- baseline quality
- tuned quality
- latency
- cost
- task-specific accuracy

Create a small evaluation dataset.

The UI or demo should show the improvement.

The README should contain a clear:

```text
Before Tinker
vs.
After Tinker
```

comparison.

Do not claim improvement without measuring it.

---

### 4. Best Use of DigitalOcean

Use DigitalOcean meaningfully in the architecture.

Potential roles:

- GPU inference
- model serving
- background AI worker
- secondary deployment
- AI infrastructure

If practical, run an open-weight model on a DigitalOcean GPU.

The architecture should clearly explain what DigitalOcean does that Render does not.

Avoid pointless duplication.

---

### 5. Best Use of Gemma

Gemma must be a core model.

Use it for meaningful reasoning/generation.

Examples:

- personal planning
- summarization
- classification
- extracting structured information
- personalized recommendations
- agent decisions

Clearly expose Gemma's role in the architecture.

---

# PARTNER — $100 CATEGORIES

## 6. Best Use of Backboard

Use Backboard for:

- persistent AI memory
- RAG
- agent memory
- conversation history
- personal context

The agent should remember useful information across sessions.

Example:

```text
Friend prefers short study sessions.
Friend works best in the evening.
Friend dislikes meetings before 10 AM.
Friend's certification exam is on X.
```

The AI should use this information later.

Memory should materially change responses.

---

## 7. Best Use of ElevenLabs

Add a real voice interface.

Capabilities could include:

- speech input
- speech transcription
- spoken AI responses
- voice-based daily briefing
- voice journaling
- voice task creation

Create a compelling demo:

> "Good morning. What should I focus on today?"

Then FriendOS responds with a personalized spoken briefing.

Do not make voice a gimmick.

---

## 8. Best Use of Entire

Use Entire to capture/document agent sessions and development context.

We need to make the project's AI-assisted development process inspectable.

Use it wherever appropriate for:

- agent sessions
- development reasoning/history
- explaining important implementation decisions
- showing how AI contributed to the build

Include relevant Entire evidence in the DEV write-up.

---

## 9. Best Use of GitHub Copilot

Use GitHub Copilot meaningfully during development.

Possible uses:

- Copilot coding agent
- Copilot CLI
- GitHub Actions
- automated testing
- code review
- issue handling

Prefer using GitHub Actions + Copilot where practical.

Document meaningful examples rather than claiming:

> "We used Copilot."

Show what it actually helped automate.

---

## 10. Best Use of Mastra

Mastra should be the orchestration layer for the AI system where appropriate.

Use it for:

- agents
- workflows
- tools
- memory
- model orchestration
- multi-step tasks

Example agent architecture:

```text
User
 ↓
FriendOS Agent
 ↓
Mastra orchestration
 ├── Memory Tool
 ├── Search Tool
 ├── Analytics Tool
 ├── Goal Tool
 ├── Voice Tool
 ├── Database Tool
 └── Automation Tool
```

Mastra should be a meaningful part of the system architecture.

---

## 11. Best Use of MongoDB Atlas

Use MongoDB Atlas as a real data layer.

Possible uses:

- user profile
- goals
- tasks
- activity
- conversations
- memories
- documents
- embeddings
- semantic retrieval

Use Atlas Vector Search where useful.

Do not maintain duplicate databases unnecessarily.

Explain exactly why Atlas is being used.

---

## 12. Best Use of Sentry Agent Tracing

Add serious observability.

Track AI operations such as:

- agent runs
- latency
- model calls
- failures
- token usage where available
- tool calls
- workflow failures
- retries
- errors

Create an observable agent pipeline.

Capture screenshots/evidence for the DEV article.

The goal is to demonstrate:

> "We can see exactly what the agent did, where it spent time, and where it failed."

---

## 13. Best Use of SerpApi

Give the agent real web research capabilities.

Examples:

- research a topic
- search current information
- find resources
- compare opportunities
- research products/services
- monitor relevant news
- discover learning resources

Search results should be grounded in the UI.

Show:

- search query
- sources
- extracted information
- AI synthesis

Do not fabricate citations.

---

## 14. Best Use of Temporal

Use Temporal for durable workflows.

This is a major opportunity to make the project technically impressive.

Examples:

```text
Daily AI briefing
      ↓
Temporal Workflow
      ↓
Retrieve memory
      ↓
Fetch current data
      ↓
Analyze progress
      ↓
Generate recommendations
      ↓
Generate voice briefing
      ↓
Store result
      ↓
Notify user
```

If one API fails:

- retry
- resume
- continue from the failed step

The workflow should survive restarts.

This should be visible in the architecture.

---

## 15. Best Use of Tiger Data

Use Tiger Data/Postgres + pgvector for a meaningful vector/hybrid search capability.

Potential architecture:

```text
Documents
   ↓
Chunking
   ↓
Embeddings
   ↓
Tiger Data / pgvector
   ↓
Hybrid retrieval
   ↓
Agent
```

Use it for:

- personal documents
- notes
- learning materials
- project information
- semantic search

If both MongoDB Atlas and Tiger Data are used, give them distinct responsibilities.

For example:

MongoDB Atlas:

```text
application state
profiles
tasks
goals
activity
```

Tiger Data:

```text
document retrieval
embeddings
semantic/hybrid search
```

Do not duplicate the same data without a reason.

---

# 7. TARGET ARCHITECTURE

Prefer a modern TypeScript-first stack.

Suggested stack:

Frontend:

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui or another carefully customized component system
- Framer Motion where appropriate

Backend:

- TypeScript
- Node.js
- Mastra
- Temporal
- REST/API routes or tRPC where appropriate

AI:

- Gemma
- open-weight models
- Tinker
- TabPFN

Data:

- MongoDB Atlas
- Tiger Data / PostgreSQL
- pgvector

Infrastructure:

- Render
- DigitalOcean

Observability:

- Sentry

Web:

- SerpApi

Voice:

- ElevenLabs

Memory/RAG:

- Backboard
- MongoDB Atlas Vector Search
- Tiger Data/pgvector where appropriate

Development:

- GitHub
- GitHub Copilot
- GitHub Actions
- Entire

---

# 8. DO NOT CREATE A TECHNOLOGY SPAGHETTI

This is extremely important.

The final architecture must be explainable in under 2 minutes.

Every integration must answer:

> "Why does this technology belong here?"

If an integration does not improve the product, remove it.

The goal is:

```text
One excellent product
        ↓
Multiple natural technical capabilities
        ↓
Multiple legitimate category qualifications
```

NOT:

```text
15 sponsors
   ↓
15 random API calls
   ↓
bad product
```

---

# 9. UI/UX REQUIREMENTS

The product must look like a polished startup product.

Avoid:

- generic AI dashboard
- excessive rounded cards
- excessive gradients
- purple AI aesthetic
- template-looking shadcn UI
- giant hero sections
- unnecessary animations
- "AI-powered" everywhere
- generic chatbot-first design

Create a distinct visual identity.

Requirements:

- responsive
- desktop-first but mobile-friendly
- dark mode
- light mode
- excellent typography
- strong visual hierarchy
- keyboard accessibility
- loading states
- empty states
- error states
- skeleton states
- useful micro-interactions
- meaningful animations only

The application should feel production-ready.

---

# 10. BUILD A WOW MOMENT

The first 60 seconds of the demo matter.

Create one extremely memorable flow.

Example:

### "Morning Briefing"

Friend opens FriendOS.

The system:

1. Retrieves their long-term memory
2. Checks current goals
3. Checks upcoming deadlines
4. Uses recent activity
5. Searches the web for relevant information
6. Runs analytics
7. Generates a personalized plan
8. Speaks the briefing aloud
9. Creates actionable tasks
10. Schedules follow-up work

This should feel like:

> "This system actually knows me."

The entire flow should be demoable in a few minutes.

---

# 11. CREATE AN AGENT ACTIVITY VIEW

Build an "Agent Activity" screen.

Show:

```text
Agent Run #1042

✓ Loaded personal memory
✓ Retrieved 12 relevant documents
✓ Searched the web
✓ Analyzed historical data
✓ Generated plan
✓ Created 4 tasks
✓ Scheduled follow-up
✓ Generated voice briefing

Duration: 8.4s
Tools used: 7
Model: Gemma
```

This is valuable for:

- technical credibility
- Sentry category
- Entire category
- demo storytelling
- judging

---

# 12. CREATE A PARTNER TECHNOLOGY PAGE

Create a dedicated `/technology` or `/architecture` page.

Show the architecture visually.

Example:

```text
                    ┌──────────────┐
                    │   FriendOS   │
                    └──────┬───────┘
                           │
                     AI Agent Layer
                           │
                    ┌──────┴──────┐
                    │   Mastra    │
                    └──────┬──────┘
                           │
       ┌──────────┬────────┼─────────┬──────────┐
       ↓          ↓        ↓         ↓          ↓
    Gemma     Backboard  SerpApi  TabPFN   ElevenLabs
       │          │        │         │          │
       └──────────┴────────┴─────────┴──────────┘
                           │
                  ┌────────┴─────────┐
                  │     Data Layer   │
                  ├──────────────────┤
                  │ MongoDB Atlas    │
                  │ Tiger Data       │
                  └──────────────────┘
                           │
                  ┌────────┴─────────┐
                  │ Workflow Layer   │
                  │    Temporal      │
                  └──────────────────┘
```

Adapt this to the actual implementation.

Never display a technology if it is not actually used.

---

# 13. CATEGORY EVIDENCE SYSTEM

Create a `docs/partner-evidence.md`.

For every category document:

```markdown
## Best Use of Render

### What we built

...

### Where Render is used

...

### Why Render matters

...

### Demo path

...

### Evidence

...
```

Do this for every category we genuinely enter.

Categories:

- Render
- TabPFN
- Tinker
- DigitalOcean
- Gemma
- Backboard
- ElevenLabs
- Entire
- GitHub Copilot
- Mastra
- MongoDB Atlas
- Sentry Agent Tracing
- SerpApi
- Temporal
- Tiger Data

EXCLUDE Arduino.

---

# 14. MEASUREMENT

Where possible, measure everything.

Create a metrics dashboard or report containing:

- response latency
- workflow latency
- model latency
- retrieval latency
- search latency
- token usage
- cost
- task completion
- model quality
- fine-tuning improvement
- prediction performance
- workflow reliability

Especially measure Tinker and TabPFN because their categories explicitly benefit from demonstrating meaningful use.

---

# 15. SECURITY

Never commit:

- API keys
- secrets
- credentials
- `.env` files containing secrets
- personal private data
- private friend information

Use:

```text
.env.example
```

with placeholders.

Use environment variables.

Sanitize logs.

Do not expose private information in demo screenshots.

---

# 16. REAL FRIEND REQUIREMENT

The final project must be for a real person.

Before creating fake testimonials or fake usage data, ask the developer for:

1. Who is the friend?
2. What problem do they actually have?
3. What does their current workflow look like?
4. What would save them meaningful time?
5. What data can safely be used?

Never invent a real person's testimonial.

Never claim that a real person used the product unless they actually did.

If time is limited, build a synthetic demo dataset but clearly label it as demo data.

---

# 17. DEMO MODE

Create a polished demo mode.

It should allow us to demonstrate the product without needing to manually configure everything during the presentation.

Demo mode should contain:

- realistic data
- realistic goals
- realistic documents
- realistic activity history
- example search results
- example analytics
- example agent traces

Clearly label demo/synthetic data where appropriate.

One command should start the complete local demo environment.

---

# 18. DEVELOPER EXPERIENCE

Provide:

```bash
npm install
npm run dev
```

or the equivalent modern package-manager commands.

Also provide:

```bash
npm run test
npm run lint
npm run typecheck
```

and where applicable:

```bash
npm run build
```

Everything should work from a fresh clone.

---

# 19. TESTING

Write tests for:

- core agent behavior
- API routes
- data validation
- workflows
- critical business logic
- retrieval
- tool invocation
- failure/retry behavior

Do not waste the entire challenge building tests for trivial UI components.

Prioritize the important paths.

---

# 20. FAILURE HANDLING

The product must gracefully handle:

- model unavailable
- SerpApi unavailable
- ElevenLabs unavailable
- database unavailable
- Temporal workflow failure
- invalid user input
- timeout
- rate limits
- missing API keys

Never show a raw stack trace to the user.

Use graceful fallbacks where reasonable.

---

# 21. DEVELOPMENT PRIORITY

Work in this order:

### Phase 1 — Product

Build the core product experience first.

### Phase 2 — Open AI

Get Gemma + agent architecture working.

### Phase 3 — Memory/RAG

Add Backboard + database/vector retrieval.

### Phase 4 — Research

Add SerpApi.

### Phase 5 — Data intelligence

Add TabPFN.

### Phase 6 — Voice

Add ElevenLabs.

### Phase 7 — Workflow

Add Temporal.

### Phase 8 — Observability

Add Sentry.

### Phase 9 — Infrastructure

Add Render + DigitalOcean.

### Phase 10 — Customization

Add Tinker experiment.

### Phase 11 — Development evidence

Add Entire + GitHub/Copilot evidence.

### Phase 12 — Polish

UI, accessibility, performance, animations, responsive design.

### Phase 13 — Competition package

README, screenshots, architecture diagram, demo script, partner evidence, DEV article.

---

# 22. TIME MANAGEMENT

This is a weekend challenge.

Do NOT spend 80% of the available time implementing infrastructure.

Use this priority:

```text
40% — Core product
20% — AI/agent architecture
15% — Partner integrations
10% — UI polish
10% — testing/reliability
5%  — documentation/submission
```

If time becomes limited:

KEEP:

- excellent core product
- Gemma
- Mastra
- one strong agent workflow
- memory
- TabPFN
- one compelling voice/demo experience
- observability
- polished UI

CUT:

- unnecessary features
- cosmetic sponsor integrations
- complex infrastructure that does not improve the demo

Never sacrifice the core product just to increase the number of logos.

---

# 23. README REQUIREMENTS

The README must be exceptional.

Structure:

```markdown
# FriendOS

One sentence describing the product.

## The Problem

Who is the friend?

What problem do they have?

## The Solution

What did we build?

## Why Open AI?

Why was open-source/open-weight AI important?

## Demo

[Demo URL]

## Demo Video

[Video]

## Architecture

[Architecture diagram]

## How It Works

...

## Technology

### AI
- Gemma
- Mastra
- Tinker
- TabPFN

### Infrastructure
- Render
- DigitalOcean

### Data
- MongoDB Atlas
- Tiger Data

### Agent Infrastructure
- Backboard
- Temporal
- Sentry

### Voice
- ElevenLabs

### Web
- SerpApi

### Development
- GitHub Copilot
- Entire

## Partner Category Evidence

...

## Performance

...

## What We Learned

...

## Future Work

...

## Running Locally

...

## Environment Variables

...

## License
```

---

# 24. DEV WRITE-UP STRATEGY

The DEV article is a first-class deliverable.

The official judging criteria heavily weight writing quality.

The article should tell a story:

```text
My friend had a real problem
        ↓
I watched how they dealt with it
        ↓
Existing tools weren't enough
        ↓
I built FriendOS
        ↓
Open-source AI made X possible
        ↓
Here is how the agent works
        ↓
Here is the technical architecture
        ↓
Here is the real demo
        ↓
Here is what happened when my friend used it
        ↓
Here is what I learned
```

Do not write a sponsor list disguised as an article.

Technology should support the story.

---

# 25. DEMO VIDEO

Create a short, extremely polished demo.

Target:

3–5 minutes.

Suggested structure:

### 0:00–0:20
The friend's problem.

### 0:20–0:45
Introduce FriendOS.

### 0:45–2:00
Show the primary workflow.

### 2:00–2:45
Show memory + research + analytics.

### 2:45–3:20
Show voice.

### 3:20–4:00
Show agent trace + architecture.

### 4:00–4:30
Explain open-source AI.

### 4:30–5:00
Show deployment + partner technologies.

The demo must be understandable even if the viewer has never heard of the project.

---

# 26. COMPETITION OPTIMIZATION

Before submission, perform a competition audit.

Create:

```text
COMPETITION_AUDIT.md
```

Include:

| Category | Actually Used? | Where? | Demo Evidence? | README Evidence? |
|---|---|---|---|---|
| Render | | | | |
| TabPFN | | | | |
| Tinker | | | | |
| DigitalOcean | | | | |
| Gemma | | | | |
| Backboard | | | | |
| ElevenLabs | | | | |
| Entire | | | | |
| GitHub Copilot | | | | |
| Mastra | | | | |
| MongoDB Atlas | | | | |
| Sentry | | | | |
| SerpApi | | | | |
| Temporal | | | | |
| Tiger Data | | | | |

Do not mark a category "yes" unless the implementation genuinely supports it.

---

# 27. JUDGE SIMULATION

Before declaring the project finished, act as a skeptical Hacktoberfest judge.

Ask:

### Product

- Does this solve a real problem?
- Is the target friend obvious?
- Would someone actually use this?

### Open AI

- Is open-source AI genuinely central?
- Could this product exist without it?
- Have we explained why open innovation matters?

### Creativity

- Is there something memorable here?
- Does this feel different from generic AI assistants?

### Technical execution

- Does everything actually work?
- Are integrations meaningful?
- Is the architecture coherent?
- Is the app reliable?

### Partner categories

For every category:

> "Show me exactly where this partner technology materially contributes."

If the answer is weak, improve the integration or remove the category claim.

### Writing

- Does the DEV article tell a compelling story?
- Does it clearly explain the problem?
- Does it show the build?
- Does it demonstrate open-source AI?
- Does it contain evidence?

---

# 28. NEVER DO THESE THINGS

Never:

- fake testimonials
- fake usage
- fake benchmarks
- fake partner integrations
- claim technology that isn't used
- fabricate citations
- fabricate user data
- fabricate Tinker improvements
- fabricate TabPFN results
- claim an API was used if it wasn't
- add sponsor logos without integration
- copy another project's implementation
- plagiarize DEV articles
- hide limitations
- commit secrets
- compromise security for a category

The project should be competition-optimized through **better engineering and better storytelling**, not deception.

---

# 29. WHEN MAKING ENGINEERING DECISIONS

Prefer:

1. Simplicity
2. Reliability
3. Demoability
4. User value
5. Category relevance
6. Maintainability

When two technologies solve the same problem, choose the one that provides the strongest legitimate Hacktoberfest category alignment, provided it remains technically sensible.

---

# 30. FINAL DELIVERABLES

Before submission, the repository should contain:

```text
/
├── app/
├── components/
├── lib/
├── agents/
├── workflows/
├── tests/
├── docs/
│   ├── architecture.md
│   ├── partner-evidence.md
│   ├── competition-audit.md
│   └── demo-script.md
├── public/
├── README.md
├── AGENTS.md
├── .env.example
├── package.json
└── ...
```

Also prepare:

- production deployment
- demo URL
- demo video
- screenshots
- architecture diagram
- DEV article
- partner category evidence
- setup instructions
- environment-variable documentation
- test results

---

# 31. FINAL COMMAND

Do not stop at:

> "The app works."

The actual target is:

> "The app works, solves a real friend's problem, has an excellent UX, uses open-source AI meaningfully, has deep technical execution, has legitimate integrations across the maximum relevant partner categories, is easy to demonstrate, and has compelling evidence that a Hacktoberfest judge can understand immediately."

Build accordingly.

Optimize aggressively.

Stay honest.

Ship something memorable.