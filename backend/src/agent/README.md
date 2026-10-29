# Educational Agent

A modular, domain-specific educational reasoning and conversation engine for the Smart Board project. The agent operates primarily from structured knowledge stored in MongoDB and deterministic reasoning — **without requiring an AI API for core student interactions**.

## Location

This module lives at `backend/src/agent/`. It integrates with the existing Express backend, Mongoose connection (`backend/src/config/db.ts`), and will eventually connect to the React whiteboard frontend via structured tutor responses.

## What Problem It Solves

Traditional AI tutoring couples everything into one LLM call: parsing, solving, explaining, and UI text generation. That approach is:

- Expensive at scale
- Non-deterministic for mathematics
- Hard to extend with curriculum-specific content
- Poor at maintaining conversational context across turns

This agent separates **knowledge**, **reasoning**, **solvers**, **conversation**, **teaching**, and **presentation** into distinct layers. Each layer has a single responsibility and clear contracts.

## Architecture Overview

```
Student message
    → Agent (orchestrator)
    → Intent Engine (what does the student want?)
    → Conversation Engine (what is the session context?)
    → Knowledge Resolver (what knowledge applies?)
    → Reasoning Engine (what is mathematically/logically true?)
    → Teaching Engine (how should we teach this?)
    → Response Builder (structured blocks for the UI)
    → Frontend renders blocks interactively
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for component responsibilities, data flow, and extension points.

See [progress.md](./progress.md) for a concise status of what is implemented so far.

## Layer Separation (Critical Rule)

| Layer | Responsibility | Must NOT do |
|-------|----------------|-------------|
| **Solvers** | Compute correct mathematical results | Generate tutor UI text |
| **Teaching Engine** | Decide pedagogical action | Perform calculations |
| **Response Builder** | Assemble structured blocks | Decide what to teach |
| **Frontend** | Render blocks visually | Parse student intent |

## Adding a Subject

1. Create a folder under `subjects/<subject-id>/`.
2. Export a `SubjectRegistration` from `index.ts` (see `subjects/math/index.ts`).
3. Register topics, solvers, rules, and optional custom intents.
4. Add MongoDB knowledge documents tagged with the subject ID.
5. Register the subject in the agent's subject registry (Phase 1).

Subjects must **self-register** capabilities. Core engines must not contain `if (topic === 'quadratic')` logic.

## Adding a Topic

Under a subject folder, create:

```
subjects/<subject>/<topic>/
├── README.md
├── knowledge/       # Educational content (loaded from MongoDB)
├── rules/           # Deterministic IF/THEN rules
├── solvers/         # Domain algorithms
├── strategies/      # Method selection logic
├── examples/        # Structured worked examples
└── tests/           # Unit tests
```

See `subjects/math/quadratic/` for the reference structure.

## Adding Knowledge

Knowledge is stored in MongoDB (collections: `agentKnowledge`, `agentRules`, `agentExamples`, `agentStrategies`, `agentTopics`). Do **not** hard-code large content bodies in JavaScript.

Use [MODEL_INSTRUCTIONS.md](./MODEL_INSTRUCTIONS.md) when authoring knowledge with an AI assistant. Content must conform to the schemas in `schemas/`.

## Conversation Model

The agent maintains a **TutorSession** per student interaction. Sessions track:

- Current subject, topic, and problem
- Solution progress (current step, completed steps)
- Teaching mode and difficulty
- Conversation history
- Last tutor/student actions

This enables contextual follow-ups like "Why is b 5?" after solving `2x² + 5x - 3 = 0`.

## Solvers

Deterministic solvers live under `subjects/<subject>/<topic>/solvers/`. They answer: *"What is mathematically true?"*

The existing `backend/src/services/math/` utilities (`EquationParser`, `StepSolver`) may be wrapped or adapted by topic solvers — do not duplicate unnecessarily.

## Frontend Consumption

The agent returns **structured tutor responses** (not plain text only). Each response contains typed blocks:

- `explanation`, `formula`, `calculation`, `question`, `hint`, `answer`, `verification`, etc.

The React frontend maps block types to components. See `response/responseTypes.ts` and `response/responseSchema.ts`.

The existing `TeachingResponse` type in `backend/src/types/ai.ts` is the legacy AI API format. The agent's `TutorResponse` is the new contract for interactive tutoring.

## Relationship to Existing AI Services

| Existing | Agent |
|----------|-------|
| `services/ai/TeachingService.ts` | Will eventually delegate to agent for supported topics |
| `services/math/MathEngine.ts` | Solvers may wrap existing math utilities |
| `types/ai.ts` | Legacy; agent defines its own types in `agent/` |

An optional AI API fallback may be added later for unsupported questions — the core engine must remain functional without it.

## Getting Started (Developers)

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Follow the phased roadmap in [TODO.md](./TODO.md)
3. Use [MODEL_INSTRUCTIONS.md](./MODEL_INSTRUCTIONS.md) when creating knowledge content

## Current Status

**Phase 0 — Architecture** (this deliverable): folder structure, contracts, schemas, documentation, and module scaffolding. No full implementation yet.
