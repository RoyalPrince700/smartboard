# Educational Agent — Progress

High-level status of the agent build. See [TODO.md](./TODO.md) for the full phased roadmap.

**Last updated:** Phases 9–10 complete

---

## Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Architecture | Done |
| 1 | Knowledge Infrastructure | Done |
| 2 | Conversation Infrastructure | Done |
| 3 | Intent Engine | Done |
| 4 | Reasoning Engine | Done |
| 5 | Mathematics (solvers) | Done |
| 6 | Teaching Engine | Done |
| 7 | Quadratic Knowledge (MongoDB) | Done |
| 8 | Response System | Done |
| 9 | Frontend Integration | Done |
| 10 | Testing | Done |
| 11 | English Foundation | Scaffold |
| 12 | Scalability | Not started |

---

## What exists today

### Foundation (Phase 0)
- Module at `backend/src/agent/` with layered architecture
- Docs: README, ARCHITECTURE, MODEL_INSTRUCTIONS, TODO
- Mongoose schemas for knowledge, sessions, responses
- Subject registration pattern (math + english scaffold)

### Knowledge (Phase 1)
- MongoDB collections: `agentKnowledge`, `agentRules`, `agentExamples`, `agentStrategies`, `agentTopics`, `agentSessions`
- Knowledge loader, resolver, ranker, validator
- Topic registry (code + DB metadata)
- Seed script: `npm run seed:agent` (math/quadratic topic + 5 knowledge docs)

### Conversation (Phase 2)
- TutorSession persistence with 24h TTL
- Context resolution ("Why is b 5?" → coefficient from active problem)
- Step progression, conversation history, session metadata

### Intent (Phase 3)
- 17 deterministic intents, no AI API required
- Session-aware rules (CONTINUE needs active problem, etc.)
- Math subject intent detectors
- `intentRegistry` for subject extensions

### Reasoning (Phase 4)
- Full pipeline: normalize → identify → solve → rules → strategy → conclude → verify
- Rule engine with applied-rule tracking
- Strategy selector with fallback
- Reasoning trace builder with conclusion
- Basic answer verifier for submitted roots
- Unit + integration tests

### Mathematics (Phase 5)
- `equationAdapter` wraps existing `EquationParser` and `StepSolver`
- Quadratic solvers: parser, coefficients, discriminant, formula, factorization, root verifier
- Linear solver via `StepSolver.solveLinear`
- Unit tests for parsing, solving, and edge cases

### Teaching (Phase 6)
- Six modes: DIRECT, GUIDED, SOCRATIC, HINT, EXAM, PRACTICE
- `teaching/` module: mode handlers, difficulty adapter, content selector
- Teaching engine maps intent + session + reasoning → `TeachingAction` with presentation rules
- Response builder filters blocks by mode (no calculations in teaching layer)
- Unit tests: mode selection, difficulty adaptation, same solver / different modes

### Quadratic Knowledge (Phase 7)
- 18 knowledge documents: definitions, explanations, hints, misconceptions, formulas, worked steps, teaching notes
- 4 deterministic rules + 3 worked examples in seed package
- Seed validation test (`knowledgePackage.test.ts`)
- Run `npm run seed:agent` to load into MongoDB

### Response System (Phase 8)
- `response/` module: placeholderResolver, blockAssembler, statusResolver, responseBuilder
- Enhanced responseValidator: per-block validation, HTML rejection, JSON serialization
- Resolves `{{a}}`, `{{b}}`, `{{c}}`, session and reasoning placeholders in knowledge content
- Maps knowledge `contentBlocks` to typed response blocks
- Unit tests per teaching mode + validator + placeholder tests

### Frontend Integration (Phase 9)
- API routes: `POST /api/agent/message`, `GET /api/agent/status`, `GET/DELETE /api/agent/session/:id`
- Feature flag: `AGENT_ENABLED` (backend), `VITE_USE_AGENT` (frontend)
- Frontend: `agentApi.ts`, `AgentBlockRenderer`, store session persistence
- Board lesson overlay renders agent blocks; tutor actions route to agent when active

### Testing (Phase 10)
- Pipeline e2e tests: math correctness, multi-turn continuity, intents, wrong answers, unsupported input, session isolation
- `agentTestHarness.ts` for in-memory multi-turn simulation (no MongoDB)

---

## Commands

```bash
npm run seed:agent   # seed MongoDB knowledge
npm run test:agent   # run agent unit tests
```

---

## Next up

**Phase 11 — English Foundation:** English subject architecture without full implementation.

---

## Not yet wired

- HTTP routes (`/api/agent/message`) — Phase 9
- Frontend block rendering — Phase 9
- Full teaching modes — Phase 6
- AI API fallback — Phase 12 (optional)
