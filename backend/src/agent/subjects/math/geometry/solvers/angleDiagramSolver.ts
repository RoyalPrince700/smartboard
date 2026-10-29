/**
 * Angle-diagram solver for scene-derived geometry problems.
 */

import { ParsedGeometryProblem, PartialReasoningTrace } from '../types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return `${round2(n)}°`;
}

export function solveAngleDiagram(problem: ParsedGeometryProblem): PartialReasoningTrace {
  const known = problem.knownAngles[0];
  const unknownCount = problem.unknownAngleCount || 1;
  const hasEqualSides = problem.equalLengthPairs > 0;
  const hasParallelLines = problem.parallelPairs > 0;

  const steps: NonNullable<PartialReasoningTrace['reasoningSteps']> = [
    {
      order: 1,
      action: 'identify_shape',
      description: 'This is an angle diagram, so first mark the known angle and the unknown angle(s).',
    },
    {
      order: 2,
      action: 'list_givens',
      description: `Known angle${known !== undefined ? ` = ${fmt(known)}` : ' is not clear yet'}.`,
    },
  ];

  const recognizedData: Record<string, unknown> = {
    problemType: 'geometry',
    shapeType: problem.shapeType,
    knownAngles: problem.knownAngles,
    unknownAngleCount: unknownCount,
    parallelPairs: problem.parallelPairs,
    equalLengthPairs: problem.equalLengthPairs,
    find: problem.find,
  };

  if (known === undefined) {
    return {
      problemType: 'geometry',
      flags: ['insufficient_data'],
      recognizedData,
      reasoningSteps: [
        ...steps,
        {
          order: 3,
          action: 'choose_formula',
          description: 'I need at least one readable angle label, for example 58°.',
        },
      ],
    };
  }

  if (hasEqualSides || (problem.shapeType === 'triangle' && unknownCount >= 2)) {
    const baseAngle = (180 - known) / 2;
    steps.push({
      order: 3,
      action: 'choose_formula',
      description:
        'The two marked sides/unknown base angles suggest an isosceles triangle, so the two base angles are equal.',
      data: { expression: 'base angles = (180 - vertex angle) / 2' },
    });
    steps.push({
      order: 4,
      action: 'calculate',
      description: `Each base angle = (180° - ${fmt(known)}) ÷ 2 = ${fmt(baseAngle)}.`,
      data: { expression: `(180 - ${known}) / 2 = ${round2(baseAngle)}` },
    });

    const answerDisplay =
      unknownCount > 1
        ? `Each unknown base angle = ${fmt(baseAngle)}`
        : `Unknown angle = ${fmt(baseAngle)}`;

    return {
      problemType: 'geometry',
      recognizedData: {
        ...recognizedData,
        method: 'isosceles_triangle_angle_sum',
        answer: answerDisplay,
        answerDisplay,
        unknownAngle: round2(baseAngle),
      },
      reasoningSteps: steps,
      conclusion: { answer: answerDisplay, answerDisplay },
    };
  }

  if (hasParallelLines) {
    const supplementary = 180 - known;
    steps.push({
      order: 3,
      action: 'choose_formula',
      description:
        'The diagram has parallel-line information. Angles on a straight line add to 180°, while corresponding/alternate angles are equal.',
      data: { expression: 'straight line = 180°' },
    });
    steps.push({
      order: 4,
      action: 'calculate',
      description: `A supplementary angle to ${fmt(known)} is 180° - ${fmt(known)} = ${fmt(supplementary)}.`,
      data: { expression: `180 - ${known} = ${round2(supplementary)}` },
    });

    const answerDisplay = `Related angle is either ${fmt(known)} if corresponding/alternate, or ${fmt(
      supplementary
    )} if it is on a straight line.`;

    return {
      problemType: 'geometry',
      recognizedData: {
        ...recognizedData,
        method: 'parallel_line_angles',
        correspondingAngle: known,
        supplementaryAngle: round2(supplementary),
        answer: answerDisplay,
        answerDisplay,
      },
      reasoningSteps: steps,
      conclusion: { answer: answerDisplay, answerDisplay },
    };
  }

  const remaining = 180 - known;
  steps.push({
    order: 3,
    action: 'choose_formula',
    description: 'Angles inside a triangle add to 180°.',
    data: { expression: 'A + B + C = 180°' },
  });
  steps.push({
    order: 4,
    action: 'calculate',
    description: `The other marked angle(s) together are 180° - ${fmt(known)} = ${fmt(remaining)}.`,
    data: { expression: `180 - ${known} = ${round2(remaining)}` },
  });

  const answerDisplay =
    unknownCount > 1
      ? `The remaining unknown angles add to ${fmt(remaining)}`
      : `Unknown angle = ${fmt(remaining)}`;

  return {
    problemType: 'geometry',
    recognizedData: {
      ...recognizedData,
      method: 'triangle_angle_sum',
      unknownAngle: unknownCount > 1 ? undefined : round2(remaining),
      answer: answerDisplay,
      answerDisplay,
    },
    reasoningSteps: steps,
    conclusion: { answer: answerDisplay, answerDisplay },
  };
}
