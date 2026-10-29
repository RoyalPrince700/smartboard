# Model Instructions — Educational Agent Content Authoring

This document is a **topic-agnostic protocol** for creating educational knowledge packages for the Educational Agent. Any AI model (or human author) should follow this guide when producing content for a subject/topic.

**Example usage:** *"Read `backend/src/agent/MODEL_INSTRUCTIONS.md`. Create the knowledge package for Mathematics → Simultaneous Equations."*

---

## 1. Agent Architecture Summary

The agent has six layers. Content you create feeds primarily into **Knowledge** and partially into **Rules**, **Strategies**, and **Examples**.

| Layer | Your role |
|-------|-----------|
| Knowledge | **Primary** — definitions, explanations, hints, misconceptions |
| Rules | **Primary** — IF/THEN deterministic logic |
| Strategies | **Primary** — when to use which method |
| Examples | **Primary** — structured worked examples |
| Solvers | **Do not author** — implemented in code unless asked |
| Conversation | **Reference only** — understand session context |
| Teaching | **Inform** — tag content with difficulty and teaching notes |
| Presentation | **Do not author UI** — content maps to response block types |

Content must be **MongoDB-ready JSON** conforming to schemas in `backend/src/agent/schemas/`.

---

## 2. Subject Structure

A **subject** is a top-level academic domain (e.g. `math`, `english`).

Each subject folder: `backend/src/agent/subjects/<subject-id>/`

Required exports:
- `index.ts` — `SubjectRegistration` object
- `README.md` — scope, planned topics, conventions

Subject ID conventions:
- Lowercase, snake_case or single word: `math`, `english`
- Must match MongoDB `subject` field exactly

---

## 3. Topic Structure

A **topic** is a teachable unit within a subject (e.g. `quadratic`, `parts_of_speech`).

Each topic folder: `backend/src/agent/subjects/<subject>/<topic-id>/`

```
<topic>/
├── README.md           # Topic scope, prerequisites, subtopics
├── knowledge/          # Seed files OR MongoDB import scripts (optional)
├── rules/              # Rule definitions (also stored in MongoDB)
├── solvers/            # Code only — do not fill with content
├── strategies/         # Strategy definitions
├── examples/           # Structured example JSON
└── tests/              # Test fixtures
```

Topic ID must match MongoDB `topic` field.

**Subtopics** are optional finer labels (e.g. `discriminant`, `factorization`). Use the `subtopic` field in documents.

---

## 4. Knowledge Types

Each knowledge document has a `knowledgeType`. Standard types:

| Type | Purpose |
|------|---------|
| `definition` | Formal definition of a concept |
| `concept` | Conceptual explanation (broader than definition) |
| `formula` | Mathematical or grammatical formula |
| `rule` | Descriptive rule (distinct from executable agentRules) |
| `explanation` | Step or concept explanation |
| `hint` | Partial guidance without full answer |
| `misconception` | Common mistake + correction |
| `teaching_note` | Internal tutor guidance |
| `worked_step` | Single step in a solution narrative |
| `vocabulary` | Terms and meanings (especially English) |
| `pattern` | Recurring structure or template |

Add topic-specific types only if necessary; document them in the topic README.

---

## 5. Knowledge Document Schema

Collection: `agentKnowledge`

```json
{
  "subject": "math",
  "topic": "quadratic",
  "subtopic": "discriminant",
  "knowledgeType": "definition",
  "difficulty": "beginner",
  "title": "The discriminant",
  "content": "The discriminant is the expression b² − 4ac ...",
  "contentBlocks": [
    { "type": "text", "value": "..." },
    { "type": "formula", "expression": "b^2 - 4ac", "latex": "b^2 - 4ac" }
  ],
  "tags": ["discriminant", "coefficients"],
  "intents": ["ASK_DEFINITION", "ASK_EXPLANATION"],
  "prerequisites": ["standard_form"],
  "relatedIds": [],
  "language": "en",
  "style": "formal",
  "version": 1,
  "active": true
}
```

### Field rules

- **subject, topic, knowledgeType, title, content** — required
- **difficulty** — `beginner` | `intermediate` | `advanced`
- **intents** — which agent intents this content supports
- **contentBlocks** — optional structured fragments for response builder
- **tags** — for search and deduplication
- **prerequisites** — concept IDs student should know first
- **relatedIds** — links to other knowledge document IDs
- **active** — false to deprecate without deleting

### Writing explanations

- Write for the specified **difficulty** level
- Use short paragraphs; one idea per paragraph
- Prefer concrete references to the **current problem context** using placeholders:
  - `{{a}}`, `{{b}}`, `{{c}}` for coefficients
  - `{{currentStep}}`, `{{currentConcept}}` for session-aware text (resolved at runtime)
- Do not embed solver code or JavaScript
- Do not duplicate content across difficulty levels — create separate documents

---

## 6. Rules Schema

Collection: `agentRules`

Rules are **executable** IF/THEN logic evaluated by the rule engine.

```json
{
  "subject": "math",
  "topic": "quadratic",
  "ruleId": "discriminant_positive_two_roots",
  "priority": 10,
  "conditions": [
    { "field": "discriminant", "operator": "gt", "value": 0 }
  ],
  "actions": [
    { "type": "set", "field": "rootCount", "value": 2 },
    { "type": "set", "field": "rootType", "value": "real_distinct" }
  ],
  "description": "If discriminant > 0, the equation has two distinct real roots",
  "active": true
}
```

### Condition operators

`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`, `matches`

### Action types

`set`, `append`, `selectStrategy`, `selectKnowledge`, `flag`

Rules must be **deterministic**. No probabilistic or AI-generated conditions.

---

## 7. Examples Schema

Collection: `agentExamples`

Examples are **structured**, not plain text paragraphs.

```json
{
  "subject": "math",
  "topic": "quadratic",
  "exampleId": "quad_factor_simple_01",
  "title": "Factorizing x² + 5x + 6 = 0",
  "question": "Solve x² + 5x + 6 = 0",
  "classification": {
    "problemType": "quadratic",
    "coefficients": { "a": 1, "b": 5, "c": 6 }
  },
  "method": "factorization",
  "reasoningSteps": [
    {
      "step": 1,
      "title": "Identify coefficients",
      "description": "a=1, b=5, c=6",
      "conceptRefs": ["standard_form"]
    },
    {
      "step": 2,
      "title": "Find factors",
      "description": "Find two numbers that multiply to 6 and add to 5",
      "calculations": ["2 × 3 = 6", "2 + 3 = 5"]
    }
  ],
  "answer": { "roots": [-2, -3], "display": "x = -2 or x = -3" },
  "verification": {
    "method": "substitution",
    "checks": ["(-2)² + 5(-2) + 6 = 0", "(-3)² + 5(-3) + 6 = 0"]
  },
  "teachingNotes": ["Emphasize factor pair search"],
  "commonMistakes": ["Sign errors when finding factor pairs"],
  "difficulty": "beginner",
  "tags": ["factorization"],
  "active": true
}
```

Every example must include: **question, classification, method, reasoningSteps, answer, verification**.

---

## 8. Strategies Schema

Collection: `agentStrategies`

Strategies define **when** to use a solving or teaching approach.

```json
{
  "subject": "math",
  "topic": "quadratic",
  "strategyId": "prefer_factorization",
  "priority": 20,
  "conditions": [
    { "field": "factorizable", "operator": "eq", "value": true }
  ],
  "method": "factorization",
  "fallback": "quadratic_formula",
  "description": "Use factorization when integer roots are straightforward",
  "active": true
}
```

Strategies are ordered by **priority** (higher first). Always specify a **fallback** when applicable.

---

## 9. Topic Registry Schema

Collection: `agentTopics`

Metadata for subjects and topics (not the full knowledge base).

```json
{
  "subject": "math",
  "topic": "quadratic",
  "label": "Quadratic Equations",
  "description": "Solving equations of the form ax² + bx + c = 0",
  "subtopics": ["standard_form", "discriminant", "factorization", "quadratic_formula", "completing_the_square"],
  "prerequisites": ["linear"],
  "supportedIntents": ["START_PROBLEM", "ASK_WHY", "REQUEST_HINT"],
  "supportedMethods": ["factorization", "quadratic_formula", "completing_the_square"],
  "active": true
}
```

---

## 10. Misconceptions

Document misconceptions as `knowledgeType: "misconception"`:

```json
{
  "knowledgeType": "misconception",
  "title": "Confusing b with c",
  "content": "Students often swap the coefficient of x with the constant term.",
  "correction": "In ax² + bx + c, b is always the coefficient of x, c is the constant.",
  "triggerPatterns": ["why is b", "what is c"],
  "relatedConcepts": ["standard_form", "coefficients"]
}
```

Include **correction** and optional **triggerPatterns** for intent/knowledge matching.

---

## 11. Conversation Patterns

Conversation patterns are **not** stored as chat logs. Instead:

- Tag knowledge with **intents** it supports
- Use **teaching_note** knowledge for tutor behavior guidance
- Document expected flows in the topic README

Example flow documentation (in README, not MongoDB):

```
START_PROBLEM → identify coefficients → GUIDED step 1
ASK_WHY (about coefficient) → load definition knowledge for that coefficient
CONTINUE → advance to next reasoning step
REQUEST_HINT → load hint knowledge for current step
```

---

## 12. Avoiding Duplication

Before creating content:

1. Query existing documents: same `subject + topic + knowledgeType + title`
2. Check **tags** and **subtopic** overlap
3. Prefer **extending** an existing document (new difficulty level) over copy-paste
4. Use **relatedIds** to link instead of repeating definitions
5. Set `active: false` on superseded documents; do not delete without review

---

## 13. Validation Checklist

Before submitting a knowledge package:

- [ ] All documents match schema in `schemas/knowledge.schema.ts` (or relevant schema)
- [ ] `subject` and `topic` IDs match folder structure
- [ ] No JavaScript code in content fields
- [ ] Examples include verification
- [ ] Rules have priority and are deterministic
- [ ] Strategies have fallback where needed
- [ ] Difficulty levels are consistent
- [ ] Intents arrays are populated for retrievable content
- [ ] Tags enable search without redundancy
- [ ] Placeholders use `{{name}}` syntax consistently

---

## 14. Creating a New Subject

1. Create `subjects/<subject-id>/README.md` — scope, conventions, planned topics
2. Create `subjects/<subject-id>/index.ts` — empty `SubjectRegistration` scaffold
3. Create `agentTopics` entry for the subject
4. Define subject-specific **knowledge types** if standard types are insufficient
5. Define subject-specific **intents** (register in subject's `intentDetectors`)
6. Create first topic using section 15 below

---

## 15. Creating a New Topic

1. Create topic folder structure (see section 3)
2. Write topic `README.md`:
   - Learning objectives
   - Prerequisites
   - Subtopics list
   - Supported problem types
   - Expected conversation flows
3. Add `agentTopics` document
4. Produce knowledge documents in order:
   - Definitions and standard form / foundational concepts
   - Formulas and rules
   - Beginner explanations → intermediate → advanced
   - Hints (per major step)
   - Misconceptions
   - Teaching notes
5. Produce rules (classification + branching)
6. Produce strategies (method selection)
7. Produce 3–5 examples per method (beginner → advanced)
8. List prerequisite links to other topics

**Do not implement solvers** unless explicitly asked — solvers are code.

---

## 16. Content Package Deliverable Format

When asked to create a knowledge package, deliver:

```
<subject>/<topic>/
├── README.md                    # Topic overview (updated)
├── import/
│   ├── knowledge.json           # Array of agentKnowledge docs
│   ├── rules.json               # Array of agentRules docs
│   ├── strategies.json          # Array of agentStrategies docs
│   ├── examples.json            # Array of agentExamples docs
│   └── topic.json               # Single agentTopics doc
└── VALIDATION.md                # Checklist results, known gaps
```

JSON arrays ready for MongoDB import (`mongoimport` or seed script).

---

## 17. Response Block Mapping

Knowledge `contentBlocks` may use these types (maps to frontend):

| Block type | Use for |
|------------|---------|
| `text` | Plain explanation |
| `formula` | Mathematical expression |
| `calculation` | Step arithmetic |
| `hint` | Partial reveal |
| `question` | Socratic prompt |
| `example` | Embedded mini-example |
| `callout` | Warning, tip, misconception |

The response builder assembles final `TutorResponse.blocks` — authors supply **content**, not final response JSON.

---

## 18. Language and Style

- Default language: `en`
- Style options: `formal`, `conversational`, `socratic`, `exam`
- Match style to difficulty and teaching mode where tagged
- English subjects may need `language` variants later — design for it now

---

## 19. Versioning

- Increment `version` on substantive content changes
- Keep `active: true` on current version; deactivate old versions
- Document changes in topic README changelog section

---

## 20. Quick Reference — Collections

| Collection | Schema file | Primary content |
|------------|-------------|-----------------|
| `agentKnowledge` | `knowledge.schema.ts` | Definitions, explanations, hints |
| `agentRules` | `knowledge.schema.ts` | IF/THEN rules |
| `agentExamples` | `knowledge.schema.ts` | Worked examples |
| `agentStrategies` | `knowledge.schema.ts` | Method selection |
| `agentTopics` | `knowledge.schema.ts` | Topic metadata |
| `agentSessions` | `conversation.schema.ts` | Runtime — do not pre-populate |

---

## 21. Whiteboard Content Identification (Runtime)

When students draw or type on the whiteboard, the agent must **identify content type before applying topic rules**. Do not assume geometry from pen strokes alone.

### Identification pipeline

1. **Capture signals in parallel**
   - Handwriting OCR (`recognizeMathFromStrokes`) → equation text candidate
   - Geometry recognition (`captureBoardGeometryAsync`) → shapes, segments, labels

2. **Classify content** (`identifyBoardContent` in `frontend/src/utils/boardContentIdentifier.ts`)
   - Score **equation**, **geometry**, and **trigonometry** independently
   - Pick the highest score above threshold (≥ 0.55)
   - **Prefer equation** when scores are close (±0.08) — equation strokes often produce incidental line segments

3. **Apply topic rules only after identification**
   - `equation` → classify topic, then apply matching rules:
     - **quadratic** — degree 2, discriminant, factorization / formula
     - **linear** — degree 1, one-step / two-step / variables on both sides
     - **exponential** — variable in exponent (e.g. `2^x = 16`)
     - **absolute_value** — `\|...\| = k`, split into two cases
     - **simultaneous** — two equations, two unknowns (e.g. `2x+y=7; x-y=1`)
     - **arithmetic** — numeric expression with `=` (order of operations)
   - `geometry` → geometry parser + geometry rules (Pythagoras, area, etc.)
   - `trigonometry` → trig parser + trig rules

### Identification signals

| Signal | Equation topic | Geometry | Trigonometry |
|--------|----------------|----------|--------------|
| Typed text with `=` and variable | Strong (linear / quadratic / exponential / absolute / simultaneous) | — | — |
| OCR reads `x^2 + ... = 0` with confidence | quadratic | — | — |
| OCR reads `2x + 3 = 7` | linear | — | — |
| OCR reads `2^x = 16` | exponential | — | — |
| OCR reads `\|2x - 3\| = 7` | absolute_value | — | — |
| OCR reads `2x+y=7; x-y=1` | simultaneous | — | — |
| OCR reads `3 + 5 × 2 =` | arithmetic | — | — |
| Recognized shape (triangle, circle, …) confidence ≥ 0.55 | — | Strong | — |
| Typed "area of triangle", "hypotenuse", etc. | — | Strong | — |
| Triangle + angle labels + sin/cos/tan | — | — | Strong |
| Two line segments alone (no closed shape) | Weak noise | **Do not classify** | — |

### Rules authoring implication

- **Quadratic rules** assume `recognizedData.degree === 2` and coefficients from the equation parser
- **Linear rules** assume `recognizedData.degree === 1` and `equationType` from the linear analyzer
- **Exponential / absolute_value / simultaneous / arithmetic rules** assume `recognizedData.problemType` from the equation parser after OCR transcription
- **Geometry rules** assume `recognizedData.shapeType` from the geometry parser (`[geometry] shape=...` payload)
- Never add geometry rules that trigger on raw stroke counts — use structured parser output only
- If adding a new board-drawn topic, extend the identification model first, then add topic classifiers and rules

### Frontend entry point

`solveBoard` in `frontend/src/hooks/useAIActions.ts` calls identification before routing to geometry OCR or equation OCR paths.

---

*This guide is intentionally topic-agnostic. Replace `<subject>`, `<topic>`, and examples with your target domain when authoring.*
