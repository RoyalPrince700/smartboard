/**
 * Triangle solvers: area, perimeter, Pythagoras.
 */

import { ParsedGeometryProblem, PartialReasoningTrace } from '../types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number, unit: string): string {
  return `${round2(n)} ${unit}`.trim();
}

function heronArea(a: number, b: number, c: number): number | null {
  const s = (a + b + c) / 2;
  const value = s * (s - a) * (s - b) * (s - c);
  if (value <= 0) return null;
  return Math.sqrt(value);
}

function isPythagorean(a: number, b: number, c: number): boolean {
  const [x, y, z] = [a, b, c].sort((p, q) => p - q);
  return Math.abs(x * x + y * y - z * z) < 0.05;
}

export function solveTriangle(problem: ParsedGeometryProblem): PartialReasoningTrace {
  const unit = problem.unit || 'cm';
  const steps: NonNullable<PartialReasoningTrace['reasoningSteps']> = [
    {
      order: 1,
      action: 'identify_shape',
      description: 'The shape is a triangle.',
    },
  ];

  const base = problem.base;
  const height = problem.height;
  let sides = [...problem.sides];
  if (base && height && sides.length < 2) {
    sides = [base, height, ...sides];
  }

  const recognizedData: Record<string, unknown> = {
    shapeType: 'triangle',
    unit,
    sides,
    base,
    height,
    isRightTriangle: problem.isRightTriangle,
    find: problem.find,
  };

  if (sides.length >= 3) {
    const [a, b, c] = sides.slice(0, 3);
    const perimeter = a + b + c;
    const area = heronArea(a, b, c);
    const right = problem.isRightTriangle || isPythagorean(a, b, c);
    const sorted = [a, b, c].sort((p, q) => p - q);
    const hypotenuse = sorted[2];

    steps.push({
      order: 2,
      action: 'list_givens',
      description: `The three sides are ${fmt(a, unit)}, ${fmt(b, unit)} and ${fmt(c, unit)}.`,
      data: { expression: `${a}, ${b}, ${c}` },
    });

    if (right) {
      steps.push({
        order: 3,
        action: 'choose_formula',
        description: 'The sides fit Pythagoras: a² + b² = c², so this is a right-angled triangle.',
        data: { expression: `${sorted[0]}^2 + ${sorted[1]}^2 = ${sorted[2]}^2` },
      });
    }

    steps.push({
      order: 4,
      action: 'calculate_perimeter',
      description: `Perimeter = ${a} + ${b} + ${c} = ${round2(perimeter)} ${unit}.`,
      data: { expression: `${a} + ${b} + ${c} = ${round2(perimeter)}` },
    });

    if (area != null) {
      steps.push({
        order: 5,
        action: 'calculate_area',
        description: `Using Heron's formula, s = ${round2((a + b + c) / 2)}, area = ${round2(area)} ${unit}².`,
        data: { expression: `Area = ${round2(area)}` },
      });
    }

    recognizedData.a = a;
    recognizedData.b = b;
    recognizedData.c = c;
    recognizedData.perimeter = round2(perimeter);
    recognizedData.area = area != null ? round2(area) : undefined;
    recognizedData.hypotenuse = hypotenuse;
    recognizedData.isRightTriangle = right;
    recognizedData.method = right ? 'pythagoras' : 'triangle_measures';

    const answerParts: string[] = [];
    if (problem.find === 'hypotenuse') answerParts.push(`Hypotenuse = ${fmt(hypotenuse, unit)}`);
    if (problem.find === 'perimeter' || problem.find === 'all') {
      answerParts.push(`Perimeter = ${fmt(perimeter, unit)}`);
    }
    if ((problem.find === 'area' || problem.find === 'all') && area != null) {
      answerParts.push(`Area = ${round2(area)} ${unit}²`);
    }
    if (problem.find === 'all' && right) {
      answerParts.push(`Hypotenuse = ${fmt(hypotenuse, unit)}`);
    }

    recognizedData.answer = answerParts[0];
    recognizedData.answerDisplay = answerParts.join('. ');

    return {
      problemType: 'geometry',
      recognizedData,
      reasoningSteps: steps,
      conclusion: {
        answer: recognizedData.answer,
        answerDisplay: recognizedData.answerDisplay,
      },
    };
  }

  if (base && height) {
    const area = 0.5 * base * height;
    steps.push({
      order: 2,
      action: 'list_givens',
      description: `Base = ${fmt(base, unit)}, height = ${fmt(height, unit)}.`,
    });
    steps.push({
      order: 3,
      action: 'choose_formula',
      description: 'Area of a triangle = ½ × base × height.',
      data: { expression: 'A = (1/2)bh' },
    });
    steps.push({
      order: 4,
      action: 'calculate_area',
      description: `Area = ½ × ${base} × ${height} = ${round2(area)} ${unit}².`,
      data: { expression: `0.5 * ${base} * ${height} = ${round2(area)}` },
    });

    recognizedData.area = round2(area);
    recognizedData.method = 'triangle_area';
    recognizedData.answer = `Area = ${round2(area)} ${unit}²`;
    recognizedData.answerDisplay = recognizedData.answer;

    return {
      problemType: 'geometry',
      recognizedData,
      reasoningSteps: steps,
      conclusion: { answer: recognizedData.answer, answerDisplay: recognizedData.answerDisplay },
    };
  }

  if (problem.isRightTriangle && sides.length === 2) {
    const [a, b] = sides;
    const hypotenuse = Math.sqrt(a * a + b * b);
    steps.push({
      order: 2,
      action: 'list_givens',
      description: `The two legs are ${fmt(a, unit)} and ${fmt(b, unit)}.`,
    });
    steps.push({
      order: 3,
      action: 'choose_formula',
      description: 'Pythagoras: hypotenuse² = a² + b².',
      data: { expression: 'c^2 = a^2 + b^2' },
    });
    steps.push({
      order: 4,
      action: 'calculate_hypotenuse',
      description: `c = √(${a}² + ${b}²) = ${round2(hypotenuse)} ${unit}.`,
      data: { expression: `sqrt(${a}^2 + ${b}^2) = ${round2(hypotenuse)}` },
    });

    recognizedData.a = a;
    recognizedData.b = b;
    recognizedData.hypotenuse = round2(hypotenuse);
    recognizedData.method = 'pythagoras';
    recognizedData.answer = `Hypotenuse = ${fmt(hypotenuse, unit)}`;
    recognizedData.answerDisplay = recognizedData.answer;

    return {
      problemType: 'geometry',
      recognizedData,
      reasoningSteps: steps,
      conclusion: { answer: recognizedData.answer, answerDisplay: recognizedData.answerDisplay },
    };
  }

  return {
    problemType: 'geometry',
    flags: ['insufficient_data'],
    recognizedData,
    reasoningSteps: [
      ...steps,
      {
        order: 2,
        action: 'list_givens',
        description:
          'I can see a triangle, but I need labelled lengths (for example 3 cm, 4 cm, 5 cm, or base and height) to calculate.',
      },
    ],
  };
}
