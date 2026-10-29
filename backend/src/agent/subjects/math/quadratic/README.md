# Quadratic Equations

First implemented mathematics topic for the educational agent.

## Scope

Equations of the form **ax² + bx + c = 0** where a ≠ 0.

## Subtopics

| Subtopic | Description |
|----------|-------------|
| `standard_form` | Recognizing ax² + bx + c = 0 |
| `coefficients` | Identifying a, b, c |
| `discriminant` | b² − 4ac and root nature |
| `factorization` | Solving by factoring |
| `quadratic_formula` | x = (−b ± √(b²−4ac)) / 2a |
| `completing_the_square` | Alternative method |
| `roots` | Finding and verifying roots |

## Folder Structure

```
quadratic/
├── knowledge/     # MongoDB seed files (Phase 7)
├── rules/         # Deterministic classification rules
├── solvers/       # Parser, formula, factorization (Phase 5)
├── strategies/    # Method selection
├── examples/      # Structured worked examples (Phase 7)
└── tests/         # Unit tests (Phase 10)
```

## Expected Conversation Flow

1. **START_PROBLEM** → identify coefficients (a, b, c)
2. **ASK_WHY** (about b) → explain coefficient in context
3. **CONTINUE** → advance to discriminant or selected method
4. **REQUEST_SIMPLER_EXPLANATION** → beginner discriminant explanation
5. **ASK_ALTERNATIVE_METHOD** → evaluate factorization vs formula
6. **REQUEST_PRACTICE** → new problem from examples collection

## Integration with Existing Code

Phase 5 will wrap:

- `backend/src/services/math/EquationParser.ts`
- `backend/src/services/math/StepSolver.ts` (`solveQuadratic`)

Do not duplicate parsing logic — adapt and extend.

## Status

Architecture only. Knowledge population in Phase 7.
