# OCR / figure mismatch fix

## What was going wrong

A right triangle drawn on the board (vertical side `2`, hypotenuse `6`, a right-angle box, and an angle arc) was recognized as:

```
[geometry] shape=triangle parallelPairs=3 equalLengthPairs=1 unit=cm labels=mmm
```

The figure panel then showed a bare triangle with floating `mmm` text and **no** right-angle square, **no** angle arcs, and **no** side numbers.

That was not an OpenCV contour failure. The vertices were already a right triangle. The pipeline was throwing away teaching marks and then redrawing a clean shape without putting them back.

## Root causes

### 1. Stroke roles were wrong

`classifyStroke` treated every small non-straight stroke as an **angle mark**:

- handwritten `2` and `6`
- the right-angle box
- the angle arc

Those strokes were **not** sent to per-stroke OCR as labels. When they *were* batched into the math OCR model (trained on equations, not isolated digits), it returned garbage such as `mmm`.

`attachLabels` then split `mmm` into letters and parked them on vertices. The renderer drew both `segment.label` and `scene.labels`, so `mmm` appeared twice.

### 2. Relations were geometrically illegal

Parallel detection compared every pair of segments, including sides that **share a vertex**. Fusion also appended extra OpenCV “angle” line shapes on top of the triangle, duplicating sides. Duplicate/collinear sides were then counted as parallel, which produced `parallelPairs=3` on a triangle.

### 3. The renderer did not teach

`renderShape` drew the polygon and returned. Angle arcs were a fixed quarter-circle (east → north), not the interior angle between the two rays. Right-angle marks were axis-aligned rectangles, not squares sitting in the actual corner. Side numbers were not placed on the matching edges.

OpenCV.js is useful for **vertices**. It is the wrong tool for “draw the same figure, but tidy, with textbook arcs and numbers.” That has to be a geometry overlay on the recognized polygon.

## Approach

Keep the existing stack (heuristic strokes + OpenCV.js contours + fusion), but split the job:

```
board strokes
  ├─ shape strokes  → OpenCV / heuristic vertices (the figure)
  ├─ label strokes  → OCR + digit fallback (the numbers)
  └─ angle marks    → right-angle box / arc (optional; computed anyway)
        ↓
  geometry scene (polygon + segments + labels + interior angles)
        ↓
  teaching overlay: square at ~90°, interior arcs, side numbers
        ↓
  SVG figure
```

The figure is **the user’s shape** (same proportions/vertices), plus standard learning marks.

## What changed

| Area | Fix |
| --- | --- |
| `strokeRoles.ts` | Classify long straight strokes as sides, compact digits as labels, small squares as right-angle marks, open squat curves as arcs. Digits are no longer stolen by the angle-mark bucket. |
| `geometryLabelOcr.ts` | Drop garbage (`mmm`, `nnn`, …). Keep real numbers. Map common single-letter confusions (`z`→`2`, `g`→`6`). If math OCR fails, guess a digit from stroke geometry. |
| `localMathOcr.ts` | Per-stroke sanitize + digit fallback. Never attach raw `mmm` as a label. |
| `recognitionFusion.ts` | One primary fused shape. Prefer 3 vertices for a triangle. Do not append extra OpenCV angle/line shapes that duplicate sides. |
| `sceneBuilder.ts` / scene enrich | Sides that share a vertex are not parallel. Triangles never report parallel pairs. Closed-shape segments win over messy stroke fragments. |
| `teachingAnnotations.ts` + SVG renderer | For any triangle/rectangle/polygon: right-angle square **aligned with the two legs**, interior angle arcs with real `startAngle`/`endAngle`, side numbers outside the matching edge. |
| `DiagramPreview.tsx` | Arc paths use those start/end angles instead of a generic quarter-circle. |

## Why this is the right rendering model

- **OCR** should only read labels (digits, `θ`, `cm`). It should not reconstruct the figure.
- **OpenCV.js** should only recover the polygon (or circle/line). Thick-stroke Hough lines are too noisy to be the scene.
- **Teaching marks** (arcs, right-angle squares, numbers) should be computed from the polygon + attached labels so they stay correct even when the student’s marks are messy.

That works for any polygon, not just this triangle: rectangles get four right-angle squares, other polygons get an arc (or square) at each vertex, and whatever numbers were written land on the nearest side.

## How to verify

1. Draw a right triangle.
2. Mark the right angle with a small square.
3. Draw an arc at another vertex.
4. Write `2` on one leg and `6` on another side.
5. Ask Tutor.

Expected figure:

- the same triangle proportions
- a right-angle square in the 90° corner
- interior arcs at the other vertices
- `2` and `6` outside the sides they were written on
- **no** `mmm`, **no** `parallelPairs=3`

Unit tests cover stroke roles, label sanitization, digit fallback, illegal triangle parallels, and the teaching overlay.

## Follow-up (still mismatched after first fix)

A second pass showed new failure modes on the same drawing (`2`, `6`, right-angle box, `θ`):

- Digit fallback invented extra side lengths (`7`, `8`, `0`) from the arc and theta strokes.
- `\\theta` was stripped by the OCR sanitizer, so theta never appeared.
- A lone OCR `0` (how theta is often read) was attached as a side number.
- The right-angle square went on whichever vertex was *closest* to 90°, even if that was the top (~97°) and the student marked the bottom-left.

Fixes in this pass:

- Preserve `\\theta` as `θ`. Map a lone `0`/`o` near a vertex to `θ`, never to a side.
- Drop digit-guesses of `0`, `1`, `7`, and `8` (the usual false positives from arcs and theta).
- Put the right-angle square on the vertex nearest the student's square, not on every near-90° corner.
- Route diagrams with `θ` plus two side lengths as trigonometry.

