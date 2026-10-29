/**
 * Circle area and circumference. Uses 22/7 when radius is a multiple of 7 (JSS convention).
 */

import { ParsedGeometryProblem, PartialReasoningTrace } from '../types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function solveCircle(problem: ParsedGeometryProblem): PartialReasoningTrace {
  const unit = problem.unit || 'cm';
  const radius = problem.radius ?? (problem.diameter ? problem.diameter / 2 : problem.sides[0]);

  const steps: NonNullable<PartialReasoningTrace['reasoningSteps']> = [
    {
      order: 1,
      action: 'identify_shape',
      description: 'The shape is a circle.',
    },
  ];

  if (!radius) {
    return {
      problemType: 'geometry',
      flags: ['insufficient_data'],
      recognizedData: { shapeType: 'circle', find: problem.find, unit },
      reasoningSteps: [
        ...steps,
        {
          order: 2,
          action: 'list_givens',
          description: 'Label the radius or diameter (for example r = 7 cm).',
        },
      ],
    };
  }

  const use227 = Number.isInteger(radius) && radius % 7 === 0;
  const piLabel = use227 ? '22/7' : '3.14';
  const area = use227 ? (22 / 7) * radius * radius : 3.14 * radius * radius;
  const circumference = use227 ? 2 * (22 / 7) * radius : 2 * 3.14 * radius;

  steps.push({
    order: 2,
    action: 'list_givens',
    description: `Radius r = ${round2(radius)} ${unit}.`,
  });
  steps.push({
    order: 3,
    action: 'choose_formula',
    description: `Use π = ${piLabel}. Area = πr². Circumference = 2πr.`,
    data: { expression: 'A = πr^2, C = 2πr' },
  });
  steps.push({
    order: 4,
    action: 'calculate_area',
    description: `Area = ${piLabel} × ${radius}² = ${round2(area)} ${unit}².`,
    data: { expression: `${piLabel} * ${radius}^2 = ${round2(area)}` },
  });
  steps.push({
    order: 5,
    action: 'calculate_circumference',
    description: `Circumference = 2 × ${piLabel} × ${radius} = ${round2(circumference)} ${unit}.`,
    data: { expression: `2 * ${piLabel} * ${radius} = ${round2(circumference)}` },
  });

  const answerParts: string[] = [];
  if (problem.find === 'area' || problem.find === 'all') answerParts.push(`Area = ${round2(area)} ${unit}²`);
  if (problem.find === 'circumference' || problem.find === 'perimeter' || problem.find === 'all') {
    answerParts.push(`Circumference = ${round2(circumference)} ${unit}`);
  }

  const answerDisplay = answerParts.join('. ');

  return {
    problemType: 'geometry',
    recognizedData: {
      shapeType: 'circle',
      radius: round2(radius),
      a: round2(radius),
      area: round2(area),
      circumference: round2(circumference),
      perimeter: round2(circumference),
      unit,
      find: problem.find,
      method: 'circle_measures',
      answer: answerParts[0],
      answerDisplay,
    },
    reasoningSteps: steps,
    conclusion: { answer: answerParts[0], answerDisplay },
  };
}
