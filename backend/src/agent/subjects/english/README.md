# English Subject

English language tutoring — **architecture only**. No solvers or knowledge implemented yet.

## Purpose

Demonstrates that the same agent framework applies to non-mathematical subjects. English will use:

- **Rules** — grammar patterns, part-of-speech classification
- **Knowledge** — definitions, examples, misconceptions
- **Strategies** — explanation depth, Socratic questioning paths
- **No numeric solvers** — analysis engines instead of equation solvers

## Subject ID

MongoDB and registry use: **`english`**

## Planned Topics (`topics/`)

| Topic | Folder | Status |
|-------|--------|--------|
| Parts of Speech | `topics/parts_of_speech/` | Scaffold |
| Sentence Structure | `topics/sentence_structure/` | Planned |
| Punctuation | `topics/punctuation/` | Planned |
| Tenses | `topics/tenses/` | Planned |

## Differences from Math

| Aspect | Math | English |
|--------|------|---------|
| Solvers | Equation parsers, formula | Sentence parser, grammar checker |
| Verification | Numeric answer check | Rule-based grammar check |
| Knowledge types | formula, calculation | vocabulary, pattern |
| Examples | Step calculations | Annotated sentences |

## Registration

Registered in `subjects/registry.ts` with empty topic list until Phase 11.

See `MODEL_INSTRUCTIONS.md` — the same content authoring protocol applies.
