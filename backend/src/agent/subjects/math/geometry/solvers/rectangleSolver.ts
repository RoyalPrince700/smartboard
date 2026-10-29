/**
 * Rectangle and square perimeter / area.
 */

import { ParsedGeometryProblem, PartialReasoningTrace } from '../types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function solveRectangle(problem: ParsedGeometryProblem): PartialReasoningTrace {
  const unit = problem.unit || 'cm';
  const isSquare = problem.shapeType === 'square';
  const side = problem.sides[0];
  const length = isSquare ? side : problem.length ?? Math.max(problem.sides[0] ?? 0, problem.sides[1] ?? 0);
  const width = isSquare ? side : problem.width ?? Math.min(problem.sides[0] ?? 0, problem.sides[1] ?? 0);

  const steps: NonNullable<PartialReasoningTrace['reasoningSteps']> = [
    {
      order: 1,
      action: 'identify_shape',
      description: isSquare ? 'The shape is a square.' : 'The shape is a rectangle.',
    },
  ];

  if (!length || !width) {
    return {
      problemType: 'geometry',
      flags: ['insufficient_data'],
      recognizedData: { shapeType: isSquare ? 'square' : 'rectangle', find: problem.find, unit },
      reasoningSteps: [
        ...steps,
        {
          order: 2,
          action: 'list_givens',
          description: isSquare
            ? 'Label the side length of the square (for example 6 cm).'
            : 'Label the length and width (for example 8 cm by 5 cm).',
        },
      ],
    };
  }

  const area = length * width;
  const perimeter = 2 * (length + width);

  steps.push({
    order: 2,
    action: 'list_givens',
    description: isSquare
      ? `Each side = ${round2(length)} ${unit}.`
      : `Length = ${round2(length)} ${unit}, width = ${round2(width)} ${unit}.`,
  });
  steps.push({
    order: 3,
    action: 'choose_formula',
    description: isSquare
      ? 'Area = side². Perimeter = 4 × side.'
      : 'Area = length × width. Perimeter = 2(length + width).',
    data: { expression: isSquare ? 'A = s^2, P = 4s' : 'A = lw, P = 2(l + w)' },
  });
  steps.push({
    order: 4,
    action: 'calculate_area',
    description: `Area = ${round2(length)} × ${round2(width)} = ${round2(area)} ${unit}².`,
    data: { expression: `${length} * ${width} = ${round2(area)}` },
  });
  steps.push({
    order: 5,
    action: 'calculate_perimeter',
    description: `Perimeter = ${round2(perimeter)} ${unit}.`,
    data: { expression: `2(${length} + ${width}) = ${round2(perimeter)}` },
  });

  const answerParts: string[] = [];
  if (problem.find === 'area' || problem.find === 'all') answerParts.push(`Area = ${round2(area)} ${unit}²`);
  if (problem.find === 'perimeter' || problem.find === 'all') {
    answerParts.push(`Perimeter = ${round2(perimeter)} ${unit}`);
  }

  const answerDisplay = answerParts.join('. ');

  return {
    problemType: 'geometry',
    recognizedData: {
      shapeType: isSquare ? 'square' : 'rectangle',
      length,
      width,
      a: length,
      b: width,
      area: round2(area),
      perimeter: round2(perimeter),
      unit,
      find: problem.find,
      method: isSquare ? 'square_measures' : 'rectangle_measures',
      answer: answerParts[0],
      answerDisplay,
    },
    reasoningSteps: steps,
    conclusion: { answer: answerParts[0], answerDisplay },
  };
}
