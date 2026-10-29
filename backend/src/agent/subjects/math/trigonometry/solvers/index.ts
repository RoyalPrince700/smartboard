/**
 * Introductory trigonometry solver for common JSS angle values.
 */

import { AgentContext } from '../../../../core/agentContext';
import { ReasoningTrace } from '../../../../schemas/reasoning.schema';

type TrigFunction = 'sin' | 'cos' | 'tan';

interface ParsedTrigEvaluation {
  task: 'evaluate_known_angle';
  fn: TrigFunction;
  angle: number;
  targetVariable?: string;
}

interface ParsedTrigAngle {
  task: 'find_angle';
  fn: TrigFunction;
  variable: string;
  valueText: string;
}

type ParsedTrigProblem = ParsedTrigEvaluation | ParsedTrigAngle | ParsedTrigTriangle;

interface ParsedTrigTriangle {
  task: 'find_angle_from_sides';
  opposite: number;
  adjacent: number;
  angleLabel: string;
  unit: string;
}

const FUNCTION_ALIASES: Record<string, TrigFunction> = {
  sin: 'sin',
  sine: 'sin',
  cos: 'cos',
  cosine: 'cos',
  tan: 'tan',
  tangent: 'tan',
};

const EXACT_VALUES: Record<TrigFunction, Record<number, string>> = {
  sin: {
    0: '0',
    30: '1/2',
    45: 'sqrt(2)/2',
    60: 'sqrt(3)/2',
    90: '1',
    180: '0',
    270: '-1',
    360: '0',
  },
  cos: {
    0: '1',
    30: 'sqrt(3)/2',
    45: 'sqrt(2)/2',
    60: '1/2',
    90: '0',
    180: '-1',
    270: '0',
    360: '1',
  },
  tan: {
    0: '0',
    30: 'sqrt(3)/3',
    45: '1',
    60: 'sqrt(3)',
    180: '0',
    360: '0',
  },
};

const COMMON_ANGLE_SOLUTIONS: Record<TrigFunction, Record<string, string>> = {
  sin: {
    '0': '0 degrees or 180 degrees',
    '1/2': '30 degrees or 150 degrees',
    'sqrt(2)/2': '45 degrees or 135 degrees',
    'sqrt(3)/2': '60 degrees or 120 degrees',
    '1': '90 degrees',
    '-1': '270 degrees',
  },
  cos: {
    '1': '0 degrees or 360 degrees',
    'sqrt(3)/2': '30 degrees or 330 degrees',
    'sqrt(2)/2': '45 degrees or 315 degrees',
    '1/2': '60 degrees or 300 degrees',
    '0': '90 degrees or 270 degrees',
    '-1': '180 degrees',
  },
  tan: {
    '0': '0 degrees or 180 degrees',
    'sqrt(3)/3': '30 degrees or 210 degrees',
    '1': '45 degrees or 225 degrees',
    'sqrt(3)': '60 degrees or 240 degrees',
  },
};

function canonicalFunction(name: string): TrigFunction | null {
  return FUNCTION_ALIASES[name.toLowerCase()] ?? null;
}

function normalizeValueText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/√/g, 'sqrt')
    .replace(/0\.5/g, '1/2')
    .replace(/0\.7071?0?/g, 'sqrt(2)/2')
    .replace(/0\.8660?3?/g, 'sqrt(3)/2');
}

function formatDecimal(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function evaluateTrig(fn: TrigFunction, angle: number): number | null {
  const radians = (angle * Math.PI) / 180;
  if (fn === 'sin') return Math.sin(radians);
  if (fn === 'cos') return Math.cos(radians);
  if (Math.abs(Math.cos(radians)) < 1e-10) return null;
  return Math.tan(radians);
}

function parseNumberList(raw?: string | null): number[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseTrigTriangle(input: string): ParsedTrigTriangle | null {
  if (!/\[trigonometry\]|shape\s*=\s*triangle/i.test(input)) return null;
  if (!/\bfind\s*=\s*unknown_angle\b/i.test(input) && !/(?:θ|theta|unknownAngles)/i.test(input)) {
    return null;
  }

  const valuesMatch = /values\s*=\s*([0-9.,\s]+)/i.exec(input);
  const values = parseNumberList(valuesMatch?.[1]);
  if (values.length < 2) return null;

  const unitMatch = /unit\s*=\s*([a-z]+)/i.exec(input);
  const angleLabelMatch = /angleLabel\s*=\s*([^\s]+)/i.exec(input);

  return {
    task: 'find_angle_from_sides',
    opposite: values[0],
    adjacent: values[1],
    angleLabel: angleLabelMatch?.[1] ?? 'θ',
    unit: unitMatch?.[1] ?? 'cm',
  };
}

function parseTrigProblem(input: string): ParsedTrigProblem | null {
  const triangle = parseTrigTriangle(input);
  if (triangle) return triangle;

  const normalized = input.replace(/°/g, ' degrees ');

  const unknownAngle = normalized.match(
    /\b(sin|sine|cos|cosine|tan|tangent)\s*\(?\s*([a-zA-Z])\s*\)?\s*=\s*([^\s,;]+)/i
  );
  if (unknownAngle) {
    const fn = canonicalFunction(unknownAngle[1]);
    if (!fn) return null;
    return {
      task: 'find_angle',
      fn,
      variable: unknownAngle[2],
      valueText: normalizeValueText(unknownAngle[3]),
    };
  }

  const evaluation = normalized.match(
    /\b(sin|sine|cos|cosine|tan|tangent)\s*\(?\s*([+-]?\d+(?:\.\d+)?)\s*(?:deg(?:rees?)?)?\s*\)?/i
  );
  if (!evaluation) return null;

  const fn = canonicalFunction(evaluation[1]);
  if (!fn) return null;

  const sides = normalized.split('=').map((side) => side.trim());
  const targetVariable =
    sides.length === 2
      ? sides.find((side) => /^[a-zA-Z]$/.test(side))?.trim()
      : undefined;

  return {
    task: 'evaluate_known_angle',
    fn,
    angle: Number(evaluation[2]),
    targetVariable,
  };
}

function solveEvaluation(problem: ParsedTrigEvaluation): Partial<ReasoningTrace> {
  const exact = EXACT_VALUES[problem.fn][problem.angle];
  const decimal = evaluateTrig(problem.fn, problem.angle);

  if (decimal === null) {
    return {
      problemType: 'trigonometry',
      flags: ['undefined_trig_value'],
      recognizedData: {
        problemType: 'trigonometry',
        trigTask: problem.task,
        trigFunction: problem.fn,
        angleDegrees: problem.angle,
        answer: 'undefined',
        answerDisplay: `${problem.fn}(${problem.angle}) is undefined`,
      },
      reasoningSteps: [
        {
          order: 1,
          action: 'identify_trig_function',
          description: `We need to evaluate ${problem.fn} at ${problem.angle} degrees.`,
        },
        {
          order: 2,
          action: 'check_definition',
          description: `${problem.fn}(${problem.angle}) is undefined because the denominator becomes 0.`,
        },
      ],
    };
  }

  const decimalText = formatDecimal(decimal);
  const answerValue = exact ? `${exact} = ${decimalText}` : decimalText;
  const answerDisplay = problem.targetVariable
    ? `${problem.targetVariable} = ${answerValue}`
    : `${problem.fn}(${problem.angle}) = ${answerValue}`;

  return {
    problemType: 'trigonometry',
    recognizedData: {
      problemType: 'trigonometry',
      trigTask: problem.task,
      trigFunction: problem.fn,
      angleDegrees: problem.angle,
      exactValue: exact,
      decimalValue: decimalText,
      answer: answerValue,
      answerDisplay,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'identify_trig_function',
        description: `The trigonometric function is ${problem.fn}, and the angle is ${problem.angle} degrees.`,
      },
      {
        order: 2,
        action: 'use_known_angle_table',
        description: exact
          ? `From the common angle table, ${problem.fn}(${problem.angle}) = ${exact}.`
          : `This is not one of the exact common angle values, so evaluate it with the calculator.`,
      },
      {
        order: 3,
        action: 'write_answer',
        description: answerDisplay,
      },
    ],
  };
}

function solveUnknownAngle(problem: ParsedTrigAngle): Partial<ReasoningTrace> {
  const angleDisplay = COMMON_ANGLE_SOLUTIONS[problem.fn][problem.valueText];

  if (!angleDisplay) {
    return {
      problemType: 'trigonometry',
      flags: ['unsupported_trig_value'],
      recognizedData: {
        problemType: 'trigonometry',
        trigTask: problem.task,
        trigFunction: problem.fn,
        answerDisplay:
          'I can solve common-angle trig values for now, such as 1/2, sqrt(2)/2, sqrt(3)/2, 1, and 0.',
      },
      reasoningSteps: [
        {
          order: 1,
          action: 'identify_trig_function',
          description: `We need an angle whose ${problem.fn} value is ${problem.valueText}.`,
        },
        {
          order: 2,
          action: 'check_common_angles',
          description:
            'That value is not in the current common-angle table, so ask with a common trig value or use a calculator method.',
        },
      ],
    };
  }

  const answerDisplay = `${problem.variable} = ${angleDisplay}`;
  return {
    problemType: 'trigonometry',
    recognizedData: {
      problemType: 'trigonometry',
      trigTask: problem.task,
      trigFunction: problem.fn,
      trigValue: problem.valueText,
      answer: angleDisplay,
      answerDisplay,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'identify_trig_function',
        description: `We need an angle whose ${problem.fn} value is ${problem.valueText}.`,
      },
      {
        order: 2,
        action: 'use_known_angle_table',
        description: `From the common angle table, ${problem.fn}(${angleDisplay}) gives ${problem.valueText}.`,
      },
      {
        order: 3,
        action: 'write_answer',
        description: answerDisplay,
      },
    ],
  };
}

function solveTrigTriangle(problem: ParsedTrigTriangle): Partial<ReasoningTrace> {
  const { opposite, adjacent, angleLabel, unit } = problem;
  const ratio = opposite / adjacent;
  const angleRad = Math.atan(ratio);
  const angleDeg = (angleRad * 180) / Math.PI;
  const rounded = formatDecimal(angleDeg);
  const answerDisplay = `${angleLabel} = ${rounded}°`;

  return {
    problemType: 'trigonometry',
    recognizedData: {
      problemType: 'trigonometry',
      trigTask: problem.task,
      shapeType: 'triangle',
      trigFunction: 'tan',
      opposite,
      adjacent,
      unit,
      angleLabel,
      answer: `${rounded}°`,
      answerDisplay,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'identify_triangle',
        description:
          `This is a right-angled triangle. The side opposite ${angleLabel} is ${opposite} ${unit}, and the side adjacent to ${angleLabel} is ${adjacent} ${unit}.`,
      },
      {
        order: 2,
        action: 'choose_formula',
        description: `Use tangent because we know the opposite and adjacent sides:\ntan(${angleLabel}) = opposite ÷ adjacent`,
        data: { expression: `tan(${angleLabel}) = opposite/adjacent` },
      },
      {
        order: 3,
        action: 'substitute_values',
        description: `Substitute the lengths:\ntan(${angleLabel}) = ${opposite} ÷ ${adjacent} = ${formatDecimal(ratio)}`,
        data: { expression: `tan(${angleLabel}) = ${formatDecimal(ratio)}` },
      },
      {
        order: 4,
        action: 'find_angle',
        description: `${angleLabel} = tan⁻¹(${formatDecimal(ratio)}) = ${rounded}°`,
        data: { expression: `${angleLabel} = ${rounded}°` },
      },
    ],
    conclusion: {
      answer: `${rounded}°`,
      answerDisplay,
    },
  };
}

export function defaultTrigonometrySolver(context: AgentContext): Partial<ReasoningTrace> {
  const input = context.normalizedInput || context.rawInput;
  const parsed = parseTrigProblem(input);

  if (!parsed) {
    return {
      problemType: 'trigonometry',
      flags: ['parse_failed'],
      reasoningSteps: [
        {
          order: 1,
          action: 'parse',
          description:
            'Could not parse a trigonometry question. Try examples like sin 30, cos 60, tan 45, sin x = 1/2, or draw a triangle with side lengths and θ.',
        },
      ],
    };
  }

  if (parsed.task === 'find_angle_from_sides') {
    return solveTrigTriangle(parsed);
  }

  return parsed.task === 'evaluate_known_angle'
    ? solveEvaluation(parsed)
    : solveUnknownAngle(parsed);
}
