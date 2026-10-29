# Educational Agent — Implementation Roadmap

Phased plan for building the modular educational agent. Each phase has actionable tasks and acceptance criteria.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` complete

---

## Phase 0 — Architecture

**Goal:** Establish folder structure, contracts, schemas, documentation, and module scaffolding.

### Tasks

- [x] Inspect existing application (backend TypeScript, Mongoose, Express, math services)
- [x] Identify MongoDB connection (`config/db.ts`) for reuse
- [x] Identify API conventions (`/api/*` routes, controller/service pattern)
- [x] Create `backend/src/agent/` folder structure
- [x] Write README.md, ARCHITECTURE.md, MODEL_INSTRUCTIONS.md, TODO.md
- [x] Define TypeScript interfaces and Mongoose schemas
- [x] Scaffold core, knowledge, conversation, reasoning, response modules
- [x] Scaffold math/quadratic and english subject structure
- [ ] Review with team; confirm placement under `backend/src/agent/`

### Acceptance Criteria

- All documented folders and scaffold files exist
- Schemas compile with TypeScript strict mode
- No duplicate MongoDB connection
- Core agent has no topic-specific hard-coded logic
- Documentation explains extension model

---

## Phase 1 — Knowledge Infrastructure

**Goal:** MongoDB models, loaders, resolvers, and subject/topic registry.

### Tasks

- [x] Register Mongoose models from `schemas/` at app startup
- [x] Implement `knowledgeLoader.ts` — query by subject, topic, type, difficulty, intent
- [x] Implement `knowledgeResolver.ts` — rank and filter knowledge for context
- [x] Implement subject registry (`subjects/registry.ts`)
- [x] Implement topic registry (`subjects/topicRegistry.ts`)
- [x] Add MongoDB indexes: `{ subject, topic, knowledgeType }`, `{ subject, topic, active }`
- [x] Create seed script for minimal quadratic topic metadata (`agentTopics`)
- [x] Validate documents against schemas on import
- [x] Unit tests: loader queries, resolver ranking

### Acceptance Criteria

- [x] Can load knowledge from MongoDB by subject/topic/intent
- [x] Subject registry returns topic capabilities without core code changes
- [x] Invalid documents rejected at import/validation
- [x] At least one `agentTopics` document seeded for math/quadratic

---

## Phase 2 — Conversation Infrastructure

**Goal:** TutorSession persistence and context resolution.

### Tasks

- [x] Implement `TutorSession` Mongoose model (conversation.schema.ts)
- [x] Implement `sessionManager.ts` — create, load, update, expire
- [x] Implement `contextManager.ts` — resolve "b", "that step", "continue"
- [x] Implement `stateManager.ts` — step progression, completed steps
- [x] Implement `conversationMemory.ts` — history append, trim, summarize metadata
- [x] Define session TTL / cleanup policy (`sessionConfig.ts`)
- [x] Link session to optional `boardId` and `userId`
- [x] Unit tests: context resolution scenarios

### Acceptance Criteria

- [x] Session persists across multiple messages
- [x] "Why is b 5?" resolves `b` from `currentProblem` when active
- [x] "Continue" reads `currentStep` and advances state
- [x] Sessions isolated by `sessionId`

---

## Phase 3 — Intent Engine

**Goal:** Deterministic intent detection with subject extensions.

### Tasks

- [x] Implement base intent detectors (regex + keyword + session-aware rules)
- [x] Map all initial intents (START_PROBLEM through UNKNOWN)
- [x] Session-aware overrides (CONTINUE only valid when session has active problem)
- [x] Subject intent detector registration hook (`intent/intentRegistry.ts`)
- [x] Return confidence score per detection
- [x] Unit tests: each intent with positive and negative cases

### Acceptance Criteria

- [x] Obvious intents detected without AI API
- [x] Contextual intents use session state
- [x] Subjects can register additional intents
- [x] UNKNOWN returned when confidence below threshold

---

## Phase 4 — Reasoning Engine

**Goal:** Full reasoning pipeline with trace output.

### Tasks

- [x] Implement pipeline stages in `reasoningEngine.ts`
- [x] Implement `ruleEngine.ts` — evaluate conditions, execute actions
- [x] Implement `strategySelector.ts` — priority-ordered strategy selection
- [x] Implement `reasoningTrace.ts` — build trace object
- [x] Implement `verifier.ts` — answer checking interface
- [x] Wire subject/topic solver dispatch via registry
- [x] Input normalization utilities
- [x] Integration test: pipeline runs end-to-end with mock solver

### Acceptance Criteria

- [x] Pipeline produces `ReasoningTrace` for a mocked quadratic problem
- [x] Rules evaluate deterministically
- [x] Strategy selection respects priority and fallback
- [x] No UI text generated in reasoning layer

---

## Phase 5 — Mathematics

**Goal:** Deterministic math solvers for quadratic (and scaffold linear).

### Tasks

- [x] Implement quadratic solvers (parser, coefficients, discriminant, formula, factorization, verifier)
- [x] Wrap/adapt existing `EquationParser` and `StepSolver` where appropriate
- [x] Scaffold linear topic solvers
- [x] Quadratic rules and strategies
- [x] Unit tests: parsing, solving, edge cases

### Acceptance Criteria

- [x] `2x² + 5x - 3 = 0` solved deterministically without AI
- [x] Coefficients correctly extracted
- [x] Discriminant and root count rules fire correctly

---

## Phase 6 — Teaching Engine

**Goal:** Pedagogical action selection separate from solvers.

### Tasks

- [x] Implement teaching modes: DIRECT, GUIDED, SOCRATIC, HINT, EXAM, PRACTICE
- [x] Map intent + session + reasoning to TeachingAction
- [x] Difficulty adaptation
- [x] Unit tests: mode selection per intent

### Acceptance Criteria

- [x] Same solver result produces different teaching actions by mode
- [x] Teaching engine never performs calculations

---

## Phase 7 — Quadratic Knowledge

**Goal:** First real MongoDB knowledge package.

### Tasks

- [x] Author and import definitions, explanations, hints, misconceptions
- [x] Author rules, strategies, examples per MODEL_INSTRUCTIONS
- [x] Verify knowledge resolves in agent

### Acceptance Criteria

- [x] Knowledge package passes validation checklist
- [x] Agent uses MongoDB content in responses

---

## Phase 8 — Response System

**Goal:** Structured tutor responses with validation.

### Tasks

- [x] Implement responseBuilder and responseValidator
- [x] Placeholder resolution in content
- [x] Unit tests per teaching mode

### Acceptance Criteria

- [x] Valid TutorResponse JSON
- [x] Blocks typed; no presentation HTML in backend

---

## Phase 9 — Frontend Integration

**Goal:** Connect agent API to whiteboard tutor UI.

### Tasks

- [x] Add `/api/agent/message` and session routes
- [x] Frontend agentApi and block rendering
- [x] Feature flag for agent vs legacy AI

### Acceptance Criteria

- [x] Full quadratic conversation flow in UI
- [x] Session persists across turns

---

## Phase 10 — Testing

Test mathematical correctness, conversation continuity, intent detection, context retention, wrong answers, ambiguous/unsupported questions, session isolation.

### Tasks

- [x] Pipeline e2e tests (multi-turn harness)
- [x] Mathematical correctness scenarios
- [x] Wrong answer verification
- [x] Session isolation tests

### Acceptance Criteria

- [x] All agent pipeline e2e tests pass
- [x] 150+ total agent unit/e2e tests

---

## Phase 11 — English Foundation

English subject architecture without full implementation. Same registration pattern as math.

---

## Phase 12 — Scalability

Indexes, caching, session storage review, rate limiting, logging, error handling, load testing, optional AI fallback.

---

## Phase Dependencies

```
Phase 0 → 1 → 2 → 3 → 4 → (5 + 6) → (7 + 8) → 9 → 10
                                              ↓
                                    11 ∥ 12
```
