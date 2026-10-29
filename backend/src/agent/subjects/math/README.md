# Mathematics Subject

Deterministic mathematical reasoning and tutoring for the educational agent.

## Registered Topics

| Topic | Status |
|-------|--------|
| `quadratic` | Solvers + rules + knowledge + UI |
| `linear` | Solvers + rules + strategies |
| `exponential` | Solvers + rules |
| `absolute_value` | Solvers + rules |
| `simultaneous` | Solvers + rules |
| `arithmetic` | Solvers + rules |
| `geometry` | Plane shapes, Pythagoras, area, perimeter |
| `trigonometry` | Trig ratios and common angles |

## Planned Topics (not implemented)

- fractions
- indices
- logarithms
- statistics
- calculus

## Subject ID

MongoDB and registry use: **`math`**

Note: The legacy frontend uses `mathematics` in `types/ai.ts`. Phase 9 will map between them or align IDs.

## Adding a New Math Topic

1. Create folder under `subjects/math/<topic>/`
2. Export `TopicRegistration` from `index.ts`
3. Add to `mathSubject.topics` in `math/index.ts`
4. Author knowledge per `MODEL_INSTRUCTIONS.md`
5. Implement solvers without AI API dependency
