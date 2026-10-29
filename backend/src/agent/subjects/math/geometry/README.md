# Plane Geometry

JSS plane-shape topic for the educational agent, following the same structure as quadratic equations.

## Scope

Identify a **drawn or described plane shape**, list the given lengths, then compute **area**, **perimeter**, **circumference**, or a **missing side** (Pythagoras).

Supported shapes:

- triangle (including right-angled / Pythagoras)
- rectangle
- square
- circle (π = 22/7 when r is a multiple of 7, otherwise 3.14)

## Subtopics

| Subtopic | Description |
|----------|-------------|
| `plane_shapes` | Naming triangle, rectangle, square, circle |
| `triangle` | Perimeter and area (½bh or Heron) |
| `pythagoras` | a² + b² = c² in a right-angled triangle |
| `rectangle` | A = l × w, P = 2(l + w) |
| `square` | A = s², P = 4s |
| `circle` | A = πr², C = 2πr |
| `area` | Choosing the correct area formula |
| `perimeter` | Distance around a shape |

## Board handwriting

Geometry is **not** sent to the math-equation OCR as a whole diagram. The board splits:

1. Large strokes → shape classifier (triangle / rectangle / circle / line)
2. Small nearby strokes → math OCR (numbers such as `3 cm`, `90°`)
3. Combined text → `[geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse`

## Expected conversation flow

1. **START_PROBLEM** → name the shape
2. **CONTINUE** → list labelled lengths
3. **CONTINUE** → write the formula
4. **CONTINUE** → substitute and calculate
5. **ASK_WHY** → explain why that formula fits the shape
