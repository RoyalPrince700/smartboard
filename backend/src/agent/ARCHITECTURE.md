# Educational Agent — Architecture

## Design Principles

1. **Separation of concerns** — solvers compute, teaching decides pedagogy, response builder formats output.
2. **Subject self-registration** — core engines discover capabilities; no topic-specific logic in core.
3. **MongoDB-first knowledge** — reusable educational content lives in the database, not in code.
4. **Deterministic by default** — mathematics and intent detection use rules; AI is optional fallback.
5. **Structured responses** — the frontend receives typed blocks, not presentation strings.
6. **Conversation continuity** — sessions bind follow-up messages to active problems and steps.

---

## Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         Agent (orchestrator)                     │
│  agent.ts — entry point, wires pipeline, returns TutorResponse   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Intent Engine │     │ Conversation    │     │ Knowledge       │
│               │     │ Engine          │     │ Resolver        │
│ Classify      │     │ Session/context │     │ Load from       │
│ student intent│     │ state           │     │ MongoDB         │
└───────┬───────┘     └────────┬────────┘     └────────┬────────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Reasoning Engine    │
                    │ Rules + strategies  │
                    │ + subject solvers   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌─────────────┐  ┌─────────────┐
       │ Rule Engine│  │ Strategy    │  │ Verifier    │
       │            │  │ Selector    │  │             │
       └────────────┘  └─────────────┘  └─────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Teaching Engine     │
                    │ Pedagogical action  │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Response Builder    │
                    │ Structured blocks   │
                    └─────────────────────┘
```

---

## Component Responsibilities

### `core/agent.ts`
- Public API: `processMessage(sessionId, userId, message)`
- Runs the reasoning pipeline end-to-end
- Returns validated `TutorResponse`

### `core/agentContext.ts`
- Mutable context object passed through the pipeline
- Holds normalized input, identified subject/topic, loaded knowledge, reasoning trace, session snapshot

### `core/intentEngine.ts`
- Detects student intent from message + session context
- Uses rule-based patterns first; subjects may register custom detectors
- Outputs `AgentIntent` enum value + confidence + metadata

### `core/conversationEngine.ts`
- Loads/updates TutorSession
- Resolves contextual references ("b", "continue", "that step")
- Updates session state after each turn

### `core/reasoningEngine.ts`
- Pipeline: normalize → identify subject/topic → load knowledge → select strategy → execute → verify
- Delegates solver execution to registered topic handlers
- Produces `ReasoningTrace`

### `core/teachingEngine.ts`
- Maps reasoning output + intent + session → `TeachingAction`
- Selects mode: DIRECT, GUIDED, SOCRATIC, HINT, EXAM, PRACTICE
- Does not perform calculations

### `core/responseBuilder.ts`
- Converts teaching action + reasoning trace + knowledge → `TutorResponse` blocks
- No business logic; pure formatting

### `knowledge/knowledgeLoader.ts`
- Queries MongoDB collections via Mongoose models
- Uses existing connection from `config/db.ts`

### `knowledge/knowledgeResolver.ts`
- Resolves which knowledge documents apply given subject, topic, intent, difficulty

### `conversation/sessionManager.ts`
- CRUD for TutorSession documents
- Session lifecycle: create, load, update, expire

### `conversation/contextManager.ts`
- Resolves pronouns and references against active problem state
- Example: "Why is b 5?" → links to `currentProblem.coefficients.b`

### `conversation/stateManager.ts`
- Manages solution progress: current step, completed steps, selected method

### `reasoning/ruleEngine.ts`
- Evaluates deterministic IF/THEN rules from MongoDB or topic rule files

### `reasoning/strategySelector.ts`
- Chooses solving/teaching strategy based on problem characteristics

### `reasoning/reasoningTrace.ts`
- Builds and serializes the internal reasoning record

### `reasoning/verifier.ts`
- Validates student answers and solver outputs

---

## Data Flow

### Request lifecycle

```
POST /api/agent/message (future)
  { sessionId?, userId, message, metadata? }
        │
        ▼
  Agent.processMessage()
        │
        ├─► SessionManager.loadOrCreate(sessionId)
        ├─► IntentEngine.detect(message, session)
        ├─► ConversationEngine.resolveContext(message, session, intent)
        ├─► KnowledgeResolver.resolve(subject, topic, intent, difficulty)
        ├─► ReasoningEngine.run(context)
        │     ├─► SubjectRegistry.getTopic(subject, topic)
        │     ├─► RuleEngine.evaluate(rules, context)
        │     ├─► StrategySelector.select(strategies, context)
        │     ├─► TopicSolver.solve(context)  [deterministic]
        │     └─► Verifier.verify(result)
        ├─► TeachingEngine.selectAction(context)
        ├─► ResponseBuilder.build(context)
        └─► SessionManager.save(session)
        │
        ▼
  TutorResponse { sessionId, intent, blocks[], nextAction, ... }
```

### Conversation lifecycle

```
[New session]
  START_PROBLEM → set currentProblem, topic, step=0
        │
        ▼
[Guided solving]
  CONTINUE / SUBMIT_ANSWER → advance step, verify
  ASK_WHY / ASK_EXPLANATION → explain current concept, stay on step
  REQUEST_HINT → partial reveal
        │
        ▼
[Completion]
  CHECK_ANSWER → verification block
  REQUEST_PRACTICE → new problem, reset steps
```

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `agentTopics` | Subject/topic registry metadata |
| `agentKnowledge` | Definitions, explanations, hints, misconceptions |
| `agentRules` | Deterministic IF/THEN rules |
| `agentExamples` | Structured worked examples |
| `agentStrategies` | Method selection strategies |
| `agentSessions` | TutorSession persistence |

All schemas defined in `schemas/`. Indexes to be added in Phase 12.

### Query resolution dimensions

Knowledge is resolved using:

- `subject`, `topic`, `subtopic`
- `knowledgeType` (definition, explanation, hint, misconception, …)
- `difficulty` (beginner, intermediate, advanced)
- `intent` (maps to relevant content)
- `language` / `style` (where applicable)

---

## Subject Registration Pattern

```typescript
interface SubjectRegistration {
  id: string;
  label: string;
  topics: TopicRegistration[];
  intentDetectors?: IntentDetector[];
}

interface TopicRegistration {
  id: string;
  label: string;
  subtopics?: string[];
  solvers: Record<string, TopicSolver>;
  rules: RuleDefinition[];
  strategies: StrategyDefinition[];
  knowledgeTypes: string[];
}
```

Core engines call `SubjectRegistry.get(subjectId)` — never hard-code topic logic.

---

## Reasoning Lifecycle

1. **Normalize** — trim, unicode math symbols, standardize equation format
2. **Identify subject** — registry lookup or session default
3. **Identify topic** — topic classifier or session context
4. **Identify intent** — intent engine
5. **Load context** — session + contextual resolution
6. **Load knowledge** — MongoDB queries
7. **Select strategy** — strategy selector
8. **Execute reasoning** — rules + solver
9. **Verify** — answer/check correctness
10. **Determine teaching action** — teaching engine
11. **Build response** — response builder

Output: `ReasoningTrace` (internal) + `TutorResponse` (external).

---

## Response Lifecycle

1. Teaching engine outputs `TeachingAction` with mode and content keys
2. Response builder maps action to block types
3. Response validator checks schema conformance
4. Frontend receives JSON; React components render per `block.type`

Block types defined in `response/responseTypes.ts`.

---

## Extension Points

| Extension | How |
|-----------|-----|
| New subject | Add folder + `SubjectRegistration`, register in registry |
| New topic | Add under subject, register solvers/rules/strategies |
| New intent | Add to enum + detector; subjects can extend |
| New block type | Add to `ResponseBlockType` + frontend component |
| New teaching mode | Add to `TeachingMode` + teaching engine handler |
| AI fallback | Optional adapter in agent.ts for UNKNOWN / low confidence |

---

## Future AI Fallback Architecture

```
Intent confidence < threshold OR intent === UNKNOWN OR unsupported topic
        │
        ▼
  Optional AIFallbackAdapter (not implemented in Phase 0)
        │
        ├─► Uses existing AIService / providers
        ├─► Returns TutorResponse (converted from TeachingResponse)
        └─► Logs fallback usage for unsupported topic tracking
```

Core pipeline remains unchanged. Fallback is a last resort, not the primary path.

---

## Integration with Existing Code

| Existing module | Integration plan |
|-----------------|-------------------|
| `config/db.ts` | Agent models use same Mongoose connection |
| `services/math/EquationParser.ts` | Wrapped by `subjects/math/quadratic/solvers/parser.ts` |
| `services/math/StepSolver.ts` | Wrapped by quadratic/linear solvers |
| `services/ai/TeachingService.ts` | Eventually routes supported topics to agent |
| `types/math.ts` | Agent solvers may import `MathStep`, `SolveResult` types |
| Frontend tutor components | Consume `TutorResponse.blocks` (Phase 9) |

---

## Testing Strategy

- **Unit tests** per solver, rule engine, intent detector
- **Integration tests** for full conversation flows (see TODO Phase 10)
- **Fixtures** in `subjects/math/quadratic/tests/`

Tests are not wired in Phase 0; directories are scaffolded.
