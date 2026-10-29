# Smart Board

Smart Board is an AI-powered interactive classroom platform for educators. Phase 1 delivers a full-screen touchscreen whiteboard with structured stroke storage.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Zustand, Canvas 2D
- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Runs at `http://localhost:5173`

## Phase 1 Features

- Full-screen interactive whiteboard
- Pointer Events (finger, stylus, mouse, touch TV)
- Tools: Pen, Highlighter, Eraser, Shapes, Text
- Undo, Redo, Clear
- Structured stroke storage (not screenshots)
- Save/load boards via REST API

## Phase 2 Features

- Text question input with education level selector
- AI explanation panel (subject + intent badges)
- `POST /api/ai/explain` — explain any topic (all subjects, not math-only)
- Mock provider works without API key; OpenAI when configured

## Phase 7 Features

- Voice input via browser microphone (**MIC** button) — speech-to-text for hands-free questions
- Voice output — **Read Aloud** and **Auto-speak** for AI responses
- Google Gemini AI provider (`AI_PROVIDER=google`, `GOOGLE_API_KEY`)
- Real AI explanations, handwriting recognition, and board interpretation via Gemini

## Phase 6 Features

- Geometry recognition from board strokes (lines, rectangles, circles, triangles)
- Scientific diagram engine (water cycle, photosynthesis, plant cell, food chain, atom, etc.)
- Diagram overlay on the whiteboard (alongside function graphs)
- **ANALYZE** — detect shapes, measurements, and labels on the board
- **VISUALIZE** — generate topic diagrams or graphs from text or board content
- `POST /api/ai/analyze-diagram` — geometry analysis with optional AI explanation
- `POST /api/ai/visualize` — extended: function graphs, topic diagrams, or board geometry

## Phase 5 Features

- Multi-subject AI routing (12 subjects)
- Subject auto-detection from question content
- Manual subject selector (Auto, Math, English, Biology, etc.)
- Specialized response formats: explanation, comparison, quiz, examples, summary
- Subject-colored badges in AI panel
- `POST /api/ai/classify` — classify subject and intent

## Phase 4 Features

- Mathematical equation recognition (via text or board handwriting)
- Deterministic math engine (quadratic, linear, arithmetic) using mathjs
- Step-by-step solutions with numbered steps
- Function graphing overlay on the board
- `POST /api/ai/solve` — solve equations with steps + optional graph
- `POST /api/ai/visualize` — graph `y = f(x)` expressions
- Auto-routes math input from ASK/EXPLAIN to the solver

## Phase 3 Features

- Handwriting recognition from board strokes
- `POST /api/ai/recognize` — convert board content to text
- `POST /api/ai/interpret` — recognize + classify + explain in one step
- **Explain Board** and **Read Board** toolbar actions

## AI Configuration

In `backend/.env`:

```
AI_PROVIDER=google          # or "openai" or "mock"
GOOGLE_API_KEY=...          # Gemini API key from Google AI Studio
GOOGLE_MODEL=gemini-3.6-flash
GOOGLE_VISION_MODEL=gemini-3.6-flash
OPENAI_API_KEY=sk-...       # optional, when AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
```

When `GOOGLE_API_KEY` is set, the backend auto-selects Google even if `AI_PROVIDER` is not set.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/ai/status` | AI provider status |
| POST | `/api/ai/solve` | Solve equations with step-by-step solution |
| POST | `/api/ai/visualize` | Graph functions, generate topic diagrams, or visualize board geometry |
| POST | `/api/ai/analyze-diagram` | Analyze shapes and geometry on the board |
| POST | `/api/ai/explain` | Explain a topic or question |
| POST | `/api/ai/recognize` | Recognize handwriting from strokes/image |
| POST | `/api/ai/interpret` | Recognize, classify, and explain board content |
| POST | `/api/boards` | Create board |
| GET | `/api/boards` | List boards |
| GET | `/api/boards/:id` | Get board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |

## Development Phases

1. **Phase 1** — Touchscreen whiteboard ✓
2. **Phase 2** — Text input + AI ✓
3. **Phase 3** — Handwriting recognition ✓
4. **Phase 4** — Mathematics ✓
5. **Phase 5** — Multi-subject AI ✓
6. **Phase 6** — Geometry & visualization ✓
7. **Phase 7** — Voice ✓
8. Phase 8 — Classroom mode
