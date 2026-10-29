import { create, all } from 'mathjs';
import { GraphPoint, GraphSpec, MathStep, AnnotatedEquation, TermCancellation } from '../../types/math';
import {
  formatNumber,
  formatFraction,
  formatPrettyMath,
  formatPrettyEquation,
  moveToStandardForm,
  parseEquation,
  parseQuadraticCoeffs,
  parseLinearCoeffs,
  parseSimultaneousInput,
  normalizeMathInput,
} from './EquationParser';
import { buildArithmeticEvaluationSteps } from './ArithmeticSteps';

const math = create(all);

function round(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

function formatVarTerm(m: number, v: string): string {
  if (m === 1) return v;
  if (m === -1) return `-${v}`;
  return `${formatNumber(m)}${v}`;
}

function formatLeftSide(m: number, v: string, cLeft: number): string {
  const varPart = formatVarTerm(m, v);
  if (cLeft === 0) return varPart;
  if (cLeft > 0) return `${varPart} + ${formatNumber(cLeft)}`;
  return `${varPart} - ${formatNumber(Math.abs(cLeft))}`;
}

function formatLinearEquation(m: number, v: string, cLeft: number, rhs: number): string {
  return `${formatLeftSide(m, v, cLeft)} = ${formatNumber(rhs)}`;
}

function formatConstantEquation(cLeft: number, rhs: number): string {
  return `${formatNumber(cLeft)} = ${formatNumber(rhs)}`;
}

function formatConstantSuffix(c: number): string {
  if (c === 0) return '';
  if (c > 0) return ` + ${formatNumber(c)}`;
  return ` - ${formatNumber(Math.abs(c))}`;
}

interface StepLine {
  text: string;
  cancellations?: TermCancellation[];
}

function makeLinearStep(
  step: number,
  title: string,
  prose: string,
  lines: StepLine[],
  extra?: Partial<MathStep>
): MathStep {
  const annotatedEquations: AnnotatedEquation[] = lines.map(({ text, cancellations }) => ({
    text,
    cancellations,
  }));
  return {
    step,
    title,
    content: [prose, ...lines.map((line) => line.text)].join('\n'),
    annotatedEquations,
    ...extra,
  };
}

function buildCollectVariableTermsLines(
  leftM: number,
  cLeft: number,
  rightM: number,
  rhs: number,
  v: string,
  prettyEquation: string
): StepLine[] {
  const subTerm = formatVarTerm(rightM, v);
  const leftSide = formatLeftSide(leftM, v, cLeft);
  const rightSide = formatLeftSide(rightM, v, rhs);
  const newM = leftM - rightM;
  const subtractToken = `- ${subTerm}`;
  const originalVarTerm = formatVarTerm(rightM, v);
  const after =
    newM === 0
      ? formatConstantEquation(cLeft, rhs)
      : formatLinearEquation(newM, v, cLeft, rhs);

  // Cancel the variable pair that sums to zero on each side.
  const cancellations: TermCancellation[] = [
    { side: 'right', term: originalVarTerm, match: 'first' },
    { side: 'right', term: subtractToken, match: 'last' },
  ];
  if (leftM === rightM) {
    cancellations.unshift(
      { side: 'left', term: formatVarTerm(leftM, v), match: 'first' },
      { side: 'left', term: subtractToken, match: 'last' }
    );
  }

  return [
    { text: prettyEquation },
    {
      text: `${leftSide} - ${subTerm} = ${rightSide} - ${subTerm}`,
      cancellations,
    },
    { text: `→ ${after}` },
  ];
}

function buildConstantMoveLines(m: number, cLeft: number, rhs: number, v: string): StepLine[] {
  const move = constantMoveInstruction(cLeft);
  const isolatedRhs = rhs - cLeft;
  const amount = move.amount;
  const leftSide = formatLeftSide(m, v, cLeft);
  const op = cLeft > 0 ? '-' : '+';
  const varPart = formatVarTerm(m, v);
  const originalTerm = cLeft > 0 ? `+ ${amount}` : `- ${amount}`;
  const operationTerm = `${op} ${amount}`;

  return [
    { text: `${leftSide} = ${formatNumber(rhs)}` },
    {
      text: `${varPart}${formatConstantSuffix(cLeft)} ${operationTerm} = ${formatNumber(rhs)} ${operationTerm}`,
      cancellations: [
        { side: 'left', term: originalTerm, match: 'first' },
        { side: 'left', term: operationTerm, match: 'last' },
      ],
    },
    { text: `→ ${varPart} = ${formatNumber(isolatedRhs)}` },
  ];
}

function formatAddedTerm(value: number, suffix = ''): string {
  const term = `${formatNumber(value)}${suffix}`;
  return value < 0 ? `+ (${term})` : `+ ${term}`;
}

function formatUnsignedTerm(value: number, suffix = ''): string {
  const abs = Math.abs(value);
  if (suffix && abs === 1) return suffix;
  return `${formatNumber(abs)}${suffix}`;
}

function formatSignedTerm(value: number, suffix = ''): string {
  const term = formatUnsignedTerm(value, suffix);
  return value < 0 ? `- ${term}` : `+ ${term}`;
}

function formatLeadingQuadraticTerm(a: number, variable: string): string {
  if (a === 1) return `${variable}²`;
  if (a === -1) return `-${variable}²`;
  return `${formatNumber(a)}${variable}²`;
}

function formatQuadraticStandard(a: number, b: number, c: number, variable: string): string {
  return `${formatLeadingQuadraticTerm(a, variable)} ${formatSignedTerm(
    b,
    variable
  )} ${formatSignedTerm(c)} = 0`;
}

function squareRootBreakdown(value: number): {
  display: string;
  line: string;
} {
  const root = Math.sqrt(value);
  if (!Number.isInteger(value)) {
    return {
      display: formatNumber(root),
      line: `√${formatNumber(value)} ≈ ${formatNumber(root)}`,
    };
  }

  if (Number.isInteger(root)) {
    return {
      display: formatNumber(root),
      line: `√${formatNumber(value)} = ${formatNumber(root)}`,
    };
  }

  for (let factor = Math.floor(root); factor >= 2; factor -= 1) {
    const square = factor * factor;
    if (value % square === 0) {
      const remaining = value / square;
      return {
        display: `${formatNumber(factor)}√${formatNumber(remaining)}`,
        line: `√${formatNumber(value)} = √(${formatNumber(square)} × ${formatNumber(
          remaining
        )}) = ${formatNumber(factor)}√${formatNumber(remaining)}`,
      };
    }
  }

  return {
    display: `√${formatNumber(value)}`,
    line: `√${formatNumber(value)} cannot be simplified exactly, so we use its decimal value: ${formatNumber(root)}`,
  };
}

function evalNumericSide(side: string): number | null {
  try {
    const result = math.evaluate(normalizeMathInput(side));
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function parseSideLinear(side: string, variable: string): { m: number; c: number } | null {
  const coeffs = parseLinearCoeffs(side, variable);
  if (coeffs) return coeffs;
  const numeric = evalNumericSide(side);
  if (numeric !== null) return { m: 0, c: numeric };
  return null;
}

function constantMoveInstruction(cLeft: number): { verb: string; amount: string } {
  const amount = formatNumber(Math.abs(cLeft));
  if (cLeft > 0) {
    return { verb: `Subtract ${amount} from both sides`, amount };
  }
  return { verb: `Add ${amount} to both sides`, amount };
}

function formatExponentDisplay(base: string, exponent: string): string {
  const compactExp = exponent.replace(/\s+/g, '');

  if (/^\d+$/.test(compactExp)) {
    return `${base}^${compactExp}`;
  }

  if (/^[a-zA-Z](?:[+\-]\d+)?$/.test(compactExp)) {
    return compactExp.length === 1 ? `${base}^${compactExp}` : `${base}^(${compactExp})`;
  }

  const prettyExp = formatPrettyMath(exponent);
  return `${base}^(${prettyExp})`;
}

export function solveLinear(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const parsed = parseEquation(input);
  if (!parsed) throw new Error('Could not parse equation');

  const hasVariable = new RegExp(parsed.variable, 'i').test(`${parsed.left}${parsed.right}`);
  if (!hasVariable) {
    return evaluateExpression(input);
  }

  const v = parsed.variable;
  const leftLin = parseSideLinear(parsed.left, v);
  if (!leftLin) throw new Error('Could not parse linear coefficients');

  const rightHasVariable = new RegExp(v, 'i').test(parsed.right);
  const rightLin = rightHasVariable
    ? parseSideLinear(parsed.right, v)
    : { m: 0, c: evalNumericSide(parsed.right) ?? 0 };

  if (!rightLin) throw new Error('Could not parse linear coefficients');

  const m = leftLin.m - rightLin.m;
  const cLeft = leftLin.c;
  const rhs = rightLin.c;

  if (!Number.isFinite(m) || !Number.isFinite(cLeft) || !Number.isFinite(rhs)) {
    throw new Error('Could not parse linear coefficients');
  }

  const steps: MathStep[] = [];
  let stepNum = 1;
  const prettyEquation = formatPrettyEquation(parsed.left, parsed.right);

  steps.push({
    step: stepNum++,
    title: 'Identify the equation',
    content:
      `This is a linear equation — the highest power of ${v} is 1.\n` +
      `Your equation is:\n${prettyEquation}`,
    annotatedEquations: [{ text: prettyEquation }],
  });

  if (rightLin.m !== 0) {
    const subTerm = formatVarTerm(rightLin.m, v);
    steps.push(
      makeLinearStep(
        stepNum++,
        'Collect the variable terms on one side',
        `Subtract ${subTerm} from both sides so all ${v} terms are on the left.`,
        buildCollectVariableTermsLines(leftLin.m, cLeft, rightLin.m, rhs, v, prettyEquation)
      )
    );
  }

  if (m === 0) {
    steps.push({
      step: stepNum++,
      title: cLeft === rhs ? 'The equation is always true' : 'Check what remains',
      content:
        cLeft === rhs
          ? `The ${v} terms cancel out and both sides are equal:\n${formatConstantEquation(cLeft, rhs)}\n` +
            `This is always true, so every value of ${v} works.`
          : `The ${v} terms cancel out, leaving:\n${formatConstantEquation(cLeft, rhs)}\n` +
            `${formatNumber(cLeft)} is not equal to ${formatNumber(rhs)}, so this is a contradiction.\n` +
            `No value of ${v} can make both sides equal.`,
    });
    return {
      steps,
      answers: [cLeft === rhs ? 'All real numbers' : 'No solution'],
      graphable: false,
    };
  }

  const root = round((rhs - cLeft) / m);
  let currentM = leftLin.m;
  let currentC = cLeft;
  let currentRhs = rhs;
  let isolatedInPreviousStep = false;

  if (rightLin.m !== 0) {
    currentM = leftLin.m - rightLin.m;
  }

  if (currentC !== 0) {
    const move = constantMoveInstruction(currentC);
    steps.push(
      makeLinearStep(
        stepNum++,
        'Move the constant to the other side',
        `${move.verb} so the ${v} term is alone on the left.`,
        buildConstantMoveLines(currentM, currentC, currentRhs, v)
      )
    );
    currentRhs = currentRhs - currentC;
    currentC = 0;
    isolatedInPreviousStep = Math.abs(currentM) === 1;
  } else if (rightLin.m === 0 && currentC === 0 && Math.abs(currentM) !== 1) {
    steps.push({
      step: stepNum++,
      title: 'Variable term is already isolated',
      content:
        `${formatVarTerm(currentM, v)} is already alone on the left side.\n` +
        `${formatVarTerm(currentM, v)} = ${formatNumber(currentRhs)}`,
    });
  }

  if (Math.abs(currentM) === 1) {
    if (!isolatedInPreviousStep) {
      steps.push({
        step: stepNum++,
        title: 'Write the answer',
        content: `${v} = ${formatNumber(root)}`,
        latex: `${v} = ${formatNumber(root)}`,
      });
    }
  } else {
    const divideLines: StepLine[] = [
      { text: `${formatVarTerm(currentM, v)} = ${formatNumber(currentRhs)}` },
      {
        text: `${formatFraction(formatVarTerm(currentM, v), formatNumber(currentM))} = ${formatFraction(formatNumber(currentRhs), formatNumber(currentM))}`,
      },
      { text: `→ ${v} = ${formatFraction(formatNumber(currentRhs), formatNumber(currentM))} = ${formatNumber(root)}` },
    ];
    steps.push(
      makeLinearStep(
        stepNum++,
        `Divide both sides by ${formatNumber(currentM)}`,
        `Divide both sides by ${formatNumber(currentM)} to isolate ${v}.`,
        divideLines,
        {
          latex: `${v} = \\frac{${formatNumber(currentRhs)}}{${formatNumber(currentM)}} = ${formatNumber(root)}`,
        }
      )
    );
  }

  const answerFraction =
    Math.abs(root - Math.round(root)) < 1e-8
      ? formatNumber(root)
      : formatFraction(formatNumber(currentRhs), formatNumber(currentM));

  return {
    steps,
    answers: [`${parsed.variable} = ${answerFraction}`],
    graphable: true,
  };
}

export function solveQuadratic(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const parsed = parseEquation(input);
  if (!parsed) throw new Error('Could not parse equation');

  const standard = moveToStandardForm(parsed.left, parsed.right, parsed.variable);
  const coeffs = parseQuadraticCoeffs(standard, parsed.variable);

  if (!coeffs || coeffs.a === 0) {
    return solveLinear(input);
  }

  const { a, b, c } = coeffs;
  const steps: MathStep[] = [];
  let stepNum = 1;
  const standardForm = formatQuadraticStandard(a, b, c, parsed.variable);
  const denominator = 2 * a;

  steps.push({
    step: stepNum++,
    title: 'Put the equation in standard form',
    content:
      'A quadratic equation should look like ax² + bx + c = 0.\n' +
      `Your equation becomes:\n${standardForm}`,
    latex:
      `${formatNumber(a)}${parsed.variable}^2 ` +
      `${formatAddedTerm(b, parsed.variable)} ${formatAddedTerm(c)} = 0`,
  });

  steps.push({
    step: stepNum++,
    title: 'Identify a, b, and c',
    content:
      `Compare ${standardForm} with ax² + bx + c = 0.\n` +
      `a = ${formatNumber(a)} because it multiplies ${parsed.variable}².\n` +
      `b = ${formatNumber(b)} because it multiplies ${parsed.variable}.\n` +
      `c = ${formatNumber(c)} because it is the constant term.`,
  });

  const discriminant = b * b - 4 * a * c;
  steps.push({
    step: stepNum++,
    title: 'Write the discriminant formula',
    content:
      'The discriminant tells us what kind of roots to expect.\n' +
      'Δ = b² - 4ac',
    latex: '\\Delta = b^2 - 4ac',
  });

  steps.push({
    step: stepNum++,
    title: 'Substitute a, b, and c into the discriminant',
    content:
      `Replace a with ${formatNumber(a)}, b with ${formatNumber(b)}, and c with ${formatNumber(c)}.\n` +
      `Δ = (${formatNumber(b)})² - 4(${formatNumber(a)})(${formatNumber(c)})`,
    latex: `\\Delta = (${formatNumber(b)})^2 - 4(${formatNumber(a)})(${formatNumber(c)})`,
  });

  const bSquared = b * b;
  const fourAC = 4 * a * c;
  steps.push({
    step: stepNum++,
    title: 'Square b',
    content:
      `First calculate b².\n` +
      `(${formatNumber(b)})² = ${formatNumber(bSquared)}\n` +
      `Δ = ${formatNumber(bSquared)} - 4(${formatNumber(a)})(${formatNumber(c)})`,
  });

  steps.push({
    step: stepNum++,
    title: 'Multiply 4ac',
    content:
      `Now calculate 4 × a × c.\n` +
      `4(${formatNumber(a)})(${formatNumber(c)}) = ${formatNumber(fourAC)}\n` +
      `Δ = ${formatNumber(bSquared)} - (${formatNumber(fourAC)})`,
  });

  steps.push({
    step: stepNum++,
    title: 'Finish the discriminant',
    content:
      fourAC < 0
        ? `Subtracting a negative means add.\nΔ = ${formatNumber(bSquared)} - (${formatNumber(
            fourAC
          )})\nΔ = ${formatNumber(bSquared)} + ${formatNumber(Math.abs(fourAC))} = ${formatNumber(
            discriminant
          )}`
        : `Now subtract.\nΔ = ${formatNumber(bSquared)} - ${formatNumber(fourAC)} = ${formatNumber(
            discriminant
          )}`,
  });

  const answers: string[] = [];

  if (discriminant < 0) {
    steps.push({
      step: stepNum++,
      title: 'Interpret the discriminant',
      content:
        `Δ = ${formatNumber(discriminant)}, which is less than 0.\n` +
        'That means the graph does not cross the x-axis, so there are no real roots.',
    });
    return { steps, answers: ['No real solutions'], graphable: true };
  }

  if (discriminant === 0) {
    const root = round(-b / (2 * a));
    const fraction = formatFraction(formatNumber(-b), formatNumber(2 * a));
    steps.push({
      step: stepNum++,
      title: 'Interpret the discriminant',
      content:
        'Δ = 0.\n' +
        'That means the equation has one repeated real root.',
    });
    steps.push({
      step: stepNum++,
      title: 'Write the quadratic formula',
      content: `${parsed.variable} = [FRAC:-b ± √Δ:2a]`,
      latex: `${parsed.variable} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}`,
    });
    steps.push({
      step: stepNum++,
      title: 'Substitute into the formula',
      content:
        `Use b = ${formatNumber(b)}, Δ = 0, and a = ${formatNumber(a)}.\n` +
        `${parsed.variable} = [FRAC:${formatNumber(-b)} ± √0:2(${formatNumber(a)})]`,
    });
    steps.push({
      step: stepNum++,
      title: 'Simplify the denominator',
      content:
        `Calculate 2a.\n2(${formatNumber(a)}) = ${formatNumber(denominator)}\n` +
        `${parsed.variable} = ${fraction}`,
    });
    steps.push({
      step: stepNum++,
      title: 'Find the repeated root',
      content: `${parsed.variable} = ${fraction} = ${formatNumber(root)}`,
      latex: `${parsed.variable} = \\frac{${formatNumber(-b)}}{${formatNumber(denominator)}} = ${formatNumber(root)}`,
    });
    answers.push(`${parsed.variable} = ${formatNumber(root)}`);
    return { steps, answers, graphable: true };
  }

  const sqrtD = Math.sqrt(discriminant);
  const x1 = round((-b + sqrtD) / (2 * a));
  const x2 = round((-b - sqrtD) / (2 * a));
  const sqrtInfo = squareRootBreakdown(discriminant);
  const plusNumerator = -b + sqrtD;
  const minusNumerator = -b - sqrtD;

  steps.push({
    step: stepNum++,
    title: 'Interpret the discriminant',
    content:
      `Δ = ${formatNumber(discriminant)}, which is greater than 0.\n` +
      'That means there are two real roots.',
  });

  steps.push({
    step: stepNum++,
    title: 'Write the quadratic formula',
    content: `${parsed.variable} = [FRAC:-b ± √Δ:2a]`,
    latex: `${parsed.variable} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}`,
  });

  steps.push({
    step: stepNum++,
    title: 'Substitute into the formula',
    content:
      `Use b = ${formatNumber(b)}, Δ = ${formatNumber(discriminant)}, and a = ${formatNumber(a)}.\n` +
      `${parsed.variable} = [FRAC:${formatNumber(-b)} ± √${formatNumber(discriminant)}:2(${formatNumber(a)})]`,
  });

  steps.push({
    step: stepNum++,
    title: 'Simplify the denominator',
    content:
      `Calculate 2a.\n2(${formatNumber(a)}) = ${formatNumber(denominator)}\n` +
      `${parsed.variable} = [FRAC:${formatNumber(-b)} ± √${formatNumber(discriminant)}:${formatNumber(denominator)}]`,
  });

  steps.push({
    step: stepNum++,
    title: 'Simplify the square root',
    content:
      `${sqrtInfo.line}\n` +
      `${parsed.variable} = [FRAC:${formatNumber(-b)} ± ${sqrtInfo.display}:${formatNumber(denominator)}]`,
  });

  steps.push({
    step: stepNum++,
    title: 'Use the plus sign for the first root',
    content:
      `First use + before the square root.\n` +
      `${parsed.variable}₁ = [FRAC:${formatNumber(-b)} + ${formatNumber(sqrtD)}:${formatNumber(denominator)}]\n` +
      `${parsed.variable}₁ = [FRAC:${formatNumber(plusNumerator)}:${formatNumber(denominator)}] = ${formatNumber(x1)}`,
    latex: `${parsed.variable}_1 = ${formatNumber(x1)}`,
  });

  steps.push({
    step: stepNum++,
    title: 'Use the minus sign for the second root',
    content:
      `Now use - before the square root.\n` +
      `${parsed.variable}₂ = [FRAC:${formatNumber(-b)} - ${formatNumber(sqrtD)}:${formatNumber(denominator)}]\n` +
      `${parsed.variable}₂ = [FRAC:${formatNumber(minusNumerator)}:${formatNumber(denominator)}] = ${formatNumber(x2)}`,
    latex: `${parsed.variable}_2 = ${formatNumber(x2)}`,
  });

  answers.push(`${parsed.variable} = ${formatNumber(x1)}`, `${parsed.variable} = ${formatNumber(x2)}`);
  return { steps, answers, graphable: true };
}

export function evaluateExpression(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const normalized = normalizeMathInput(input);

  try {
    if (normalized.endsWith('=')) {
      const expr = normalized.slice(0, -1);
      if (!expr) throw new Error('Could not evaluate expression');
      const { steps: arithSteps, result } = buildArithmeticEvaluationSteps(expr);
      return {
        steps: arithSteps.map((s, i) => ({ step: i + 1, title: s.title, content: s.content })),
        answers: [formatNumber(result)],
        graphable: false,
      };
    }

    const eqIndex = normalized.indexOf('=');
    if (eqIndex !== -1) {
      const left = normalized.slice(0, eqIndex);
      const right = normalized.slice(eqIndex + 1);
      if (left && right && !/[a-zA-Z]/.test(left + right)) {
        const { steps: arithSteps, result: leftVal } = buildArithmeticEvaluationSteps(left);
        const rightVal = Number(math.evaluate(right));
        const equal = Math.abs(leftVal - rightVal) < 1e-8;
        const steps: MathStep[] = arithSteps.map((s, i) => ({
          step: i + 1,
          title: s.title,
          content: s.content,
        }));
        let stepNum = steps.length + 1;
        steps.push({
          step: stepNum++,
          title: 'Compare both sides',
          content:
            `The left side equals ${formatNumber(leftVal)}.\n` +
            `The right side is ${formatPrettyMath(right)} = ${formatNumber(rightVal)}.`,
        });
        steps.push({
          step: stepNum++,
          title: equal ? 'The equation is true' : 'The equation is not true',
          content: equal
            ? `${formatPrettyEquation(left, right)}\nBoth sides are equal, so the statement is true.`
            : `${formatPrettyEquation(left, right)}\n` +
              `${formatPrettyMath(left)} = ${formatNumber(leftVal)}, not ${formatNumber(rightVal)}.\n` +
              'The two sides are different, so this equation is not true.',
        });
        return {
          steps,
          answers: [formatNumber(leftVal)],
          graphable: false,
        };
      }
    }

    const expr = normalized.replace(/=$/, '');
    const { steps: arithSteps, result } = buildArithmeticEvaluationSteps(expr);
    return {
      steps: arithSteps.map((s, i) => ({ step: i + 1, title: s.title, content: s.content })),
      answers: [formatNumber(result)],
      graphable: false,
    };
  } catch {
    throw new Error('Could not evaluate expression');
  }
}

function isPowerOf(base: number, value: number): number | null {
  if (value <= 0 || base <= 0 || base === 1) return null;
  const exact = Math.log(value) / Math.log(base);
  if (Math.abs(exact - Math.round(exact)) < 1e-8) return Math.round(exact);
  return null;
}

function extractAbsoluteExpression(input: string): { inner: string; rhs: number } | null {
  const normalized = normalizeMathInput(input);
  const match = normalized.match(/^\|([^|]+)\|=(.+)$/);
  if (!match) return null;
  try {
    const rhs = Number(math.evaluate(match[2]));
    if (!Number.isFinite(rhs)) return null;
    return { inner: match[1], rhs };
  } catch {
    return null;
  }
}

export function solveExponential(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const parsed = parseEquation(input);
  if (!parsed) throw new Error('Could not parse equation');

  const normalized = parsed.normalized;
  const pretty = formatPrettyEquation(parsed.left, parsed.right);
  const steps: MathStep[] = [];
  let stepNum = 1;

  steps.push({
    step: stepNum++,
    title: 'Identify the exponential equation',
    content:
      `${pretty}\n` +
      'This is an exponential equation — the variable appears in the exponent, not the base.',
  });

  // Same base already on both sides: 2^x = 2^4 or 3^(x+1) = 3^4
  const sameBaseMatch = normalized.match(/^(\d+|e)\^(\(?[a-zA-Z][^=]*\)?)=(\1)\^(.+)$/i);
  if (sameBaseMatch) {
    const baseStr = sameBaseMatch[1];
    const leftExp = sameBaseMatch[2].replace(/^\(|\)$/g, '');
    const rightExpRaw = sameBaseMatch[4].replace(/^\(|\)$/g, '');
    const variable = leftExp.match(/[a-zA-Z]/)?.[0] ?? parsed.variable;

    steps.push({
      step: stepNum++,
      title: 'Identify the base and exponent',
      content:
        `Both sides already use the same base.\n` +
        `Base (a) = ${baseStr}\n` +
        `Left exponent = ${formatPrettyMath(leftExp)}\n` +
        `Right exponent = ${formatPrettyMath(rightExpRaw)}`,
    });

    steps.push({
      step: stepNum++,
      title: 'Equate the exponents',
      content:
        `When the bases are the same, the exponents must be equal.\n` +
        `${formatPrettyMath(leftExp)} = ${formatPrettyMath(rightExpRaw)}`,
    });

    let answer: number;
    const rightNumeric = Number(math.evaluate(rightExpRaw));
    if (!Number.isFinite(rightNumeric)) {
      throw new Error('Could not evaluate right-hand exponent');
    }

    if (leftExp === variable) {
      answer = rightNumeric;
    } else {
      const innerMatch = leftExp.match(/^([a-zA-Z])([\+\-]\d+)?$/);
      if (!innerMatch) throw new Error('Could not parse exponential exponent');
      const offset = innerMatch[2] ? Number(innerMatch[2]) : 0;
      answer = rightNumeric - offset;
      if (offset !== 0) {
        steps.push({
          step: stepNum++,
          title: 'Solve for the variable',
          content:
            `${formatPrettyMath(leftExp)} = ${formatNumber(rightNumeric)}\n` +
            `${variable} ${offset >= 0 ? '-' : '+'} ${formatNumber(Math.abs(offset))} = ${formatNumber(rightNumeric)}\n` +
            `→ ${variable} = ${formatNumber(answer)}`,
        });
      }
    }

    steps.push({
      step: stepNum++,
      title: 'Write the answer',
      content: `${variable} = ${formatNumber(answer)}`,
      latex: `${variable} = ${formatNumber(answer)}`,
    });

    return {
      steps,
      answers: [`${variable} = ${formatNumber(answer)}`],
      graphable: false,
    };
  }

  const expMatch = normalized.match(/^(\d+|e)\^(\(?[a-zA-Z][^=]*\)?)=(.+)$/i);
  if (!expMatch) throw new Error('Could not parse exponential equation');

  const baseStr = expMatch[1];
  const exponent = expMatch[2].replace(/^\(|\)$/g, '');
  const rhsVal = Number(math.evaluate(expMatch[3]));
  const base = baseStr === 'e' ? Math.E : Number(baseStr);
  const variable = exponent.match(/[a-zA-Z]/)?.[0] ?? parsed.variable;

  steps.push({
    step: stepNum++,
    title: 'Identify the base and exponent',
    content:
      `Compare with a^exponent = result.\n` +
      `Base (a) = ${baseStr}\n` +
      `Exponent = ${formatPrettyMath(exponent)}\n` +
      `Right-hand side = ${formatNumber(rhsVal)}`,
  });

  const integerPower = isPowerOf(base, rhsVal);
  let answer: number;
  const baseDisplay = formatExponentDisplay(baseStr, exponent);

  if (integerPower !== null && exponent === variable) {
    steps.push({
      step: stepNum++,
      title: 'Rewrite with the same base',
      content:
        `Write ${formatNumber(rhsVal)} as a power of ${baseStr}.\n` +
        `${formatNumber(rhsVal)} = ${formatExponentDisplay(baseStr, String(integerPower))}\n` +
        `So ${baseDisplay} = ${formatExponentDisplay(baseStr, String(integerPower))}`,
    });
    steps.push({
      step: stepNum++,
      title: 'Equate the exponents',
      content:
        `When the bases are the same, the exponents must be equal.\n` +
        `${formatPrettyMath(exponent)} = ${formatNumber(integerPower)}`,
    });
    answer = integerPower;
  } else if (exponent === variable) {
    const logBase = baseStr === 'e' ? 'ln' : `log`;
    answer = round(Math.log(rhsVal) / Math.log(base));
    steps.push({
      step: stepNum++,
      title: 'Take the logarithm of both sides',
      content:
        `${baseDisplay} = ${formatNumber(rhsVal)}\n` +
        `${logBase}(${baseDisplay}) = ${logBase}(${formatNumber(rhsVal)})`,
    });
    steps.push({
      step: stepNum++,
      title: 'Apply the power rule',
      content:
        `The power rule moves the exponent down in front:\n` +
        `${variable} × ${logBase}(${baseStr}) = ${logBase}(${formatNumber(rhsVal)})`,
    });
    steps.push({
      step: stepNum++,
      title: 'Solve for the variable',
      content: `${variable} = ${formatNumber(answer)}`,
    });
  } else {
    const innerMatch = exponent.match(/^([a-zA-Z])([\+\-]\d+)?$/);
    if (!innerMatch) throw new Error('Could not parse exponential exponent');

    const offset = innerMatch[2] ? Number(innerMatch[2]) : 0;
    const innerPower = isPowerOf(base, rhsVal);
    if (innerPower === null) throw new Error('Could not solve exponential equation');

    steps.push({
      step: stepNum++,
      title: 'Rewrite with the same base',
      content:
        `${formatNumber(rhsVal)} = ${formatExponentDisplay(baseStr, String(innerPower))}\n` +
        `So ${formatPrettyMath(exponent)} = ${formatNumber(innerPower)}`,
    });
    steps.push({
      step: stepNum++,
      title: 'Equate the exponents',
      content:
        `When the bases match, set the exponents equal:\n` +
        `${formatPrettyMath(exponent)} = ${formatNumber(innerPower)}`,
    });

    answer = innerPower - offset;
    if (offset !== 0) {
      steps.push({
        step: stepNum++,
        title: 'Solve for the variable',
        content:
          `${formatPrettyMath(exponent)} = ${formatNumber(innerPower)}\n` +
          `${variable} ${offset >= 0 ? '-' : '+'} ${formatNumber(Math.abs(offset))} = ${formatNumber(innerPower)}\n` +
          `→ ${variable} = ${formatNumber(answer)}`,
      });
    }
  }

  steps.push({
    step: stepNum++,
    title: 'Write the answer',
    content: `${variable} = ${formatNumber(answer)}`,
    latex: `${variable} = ${formatNumber(answer)}`,
  });

  return {
    steps,
    answers: [`${variable} = ${formatNumber(answer)}`],
    graphable: false,
  };
}

export function solveAbsoluteValue(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const extracted = extractAbsoluteExpression(input);
  if (!extracted) throw new Error('Could not parse absolute value equation');

  const { inner, rhs } = extracted;
  const prettyInner = formatPrettyMath(inner);
  const pretty = formatPrettyMath(input.trim());
  const steps: MathStep[] = [];
  let stepNum = 1;

  steps.push({
    step: stepNum++,
    title: 'Identify the absolute value equation',
    content:
      `${pretty}\n` +
      'An absolute value |A| measures distance from zero, so |A| = k has two cases.',
  });

  steps.push({
    step: stepNum++,
    title: 'Split into two cases',
    content:
      `|${prettyInner}| = ${formatNumber(rhs)} means the expression inside can be ${formatNumber(rhs)} or ${formatNumber(-rhs)}:\n` +
      `Case 1: ${prettyInner} = ${formatNumber(rhs)}\n` +
      `Case 2: ${prettyInner} = ${formatNumber(-rhs)}`,
  });

  const case1 = solveLinear(`${inner}=${rhs}`);
  const case2 = solveLinear(`${inner}=${-rhs}`);

  steps.push({
    step: stepNum++,
    title: 'Solve Case 1',
    content:
      `Case 1: ${formatPrettyEquation(inner, String(rhs))}\n` +
      case1.steps.map((s) => `${s.title}\n${s.content}`).join('\n\n'),
  });

  steps.push({
    step: stepNum++,
    title: 'Solve Case 2',
    content:
      `Case 2: ${formatPrettyEquation(inner, String(-rhs))}\n` +
      case2.steps.map((s) => `${s.title}\n${s.content}`).join('\n\n'),
  });

  const answers = [...new Set([...case1.answers, ...case2.answers])];

  steps.push({
    step: stepNum++,
    title: 'Combine the solutions',
    content: `Both cases give:\n${answers.join('\n')}`,
  });

  return { steps, answers, graphable: false };
}

function parseLinearSideCoeffs(side: string, variables: string[]): Record<string, number> {
  const coeffs: Record<string, number> = { constant: 0 };
  for (const v of variables) coeffs[v] = 0;

  const normalized = side.replace(/\s/g, '').replace(/\*/g, '');
  const terms = normalized.match(/[+-]?[^+-]+/g) ?? [];

  for (const term of terms) {
    const t = term.trim();
    if (!t) continue;

    let matched = false;
    for (const v of variables) {
      if (new RegExp(`${v}(?!\\^|\\d)`, 'i').test(t)) {
        const raw = t.replace(new RegExp(v, 'i'), '');
        if (raw === '' || raw === '+') coeffs[v] += 1;
        else if (raw === '-') coeffs[v] -= 1;
        else coeffs[v] += Number(raw);
        matched = true;
        break;
      }
    }
    if (!matched) {
      coeffs.constant += Number(t);
    }
  }

  return coeffs;
}

function formatTwoVarLinear(a: number, b: number, d: number, v1: string, v2: string): string {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-8) parts.push(formatVarTerm(a, v1));
  if (Math.abs(b) > 1e-8) {
    if (parts.length === 0) parts.push(formatVarTerm(b, v2));
    else parts.push(formatSignedTerm(b, v2));
  }
  if (parts.length === 0) parts.push('0');
  return `${parts.join(' ')} = ${formatNumber(d)}`;
}

function describeEliminationChoice(
  elimVar: string,
  c1: number,
  c2: number,
  v1: string,
  v2: string
): string {
  const otherVar = elimVar === v1 ? v2 : v1;

  if (Math.abs(Math.abs(c1) - Math.abs(c2)) < 1e-8 && Math.abs(c1) > 1e-8) {
    if (c1 * c2 < 0) {
      return (
        `Eliminate ${elimVar} — its coefficients (${formatNumber(c1)} and ${formatNumber(c2)}) ` +
        `are equal but opposite. Adding the equations cancels ${elimVar}.`
      );
    }
    return (
      `Eliminate ${elimVar} — its coefficients (${formatNumber(c1)} and ${formatNumber(c2)}) ` +
      `match. Subtract one equation from the other to cancel ${elimVar}.`
    );
  }

  return (
    `Eliminate ${elimVar} by matching its coefficients, then add or subtract to get one equation in ${otherVar}.`
  );
}

export function solveSimultaneous(input: string): { steps: MathStep[]; answers: string[]; graphable: boolean } {
  const parsed = parseSimultaneousInput(input);
  if (!parsed || parsed.equations.length < 2) throw new Error('Could not parse simultaneous equations');

  const [eq1, eq2] = parsed.equations;
  const combined = `${eq1.left}${eq1.right}${eq2.left}${eq2.right}`;
  const variables = [...new Set([...combined.matchAll(/[a-zA-Z]/g)].map((m) => m[0].toLowerCase()))];
  if (variables.length !== 2) throw new Error('Need exactly two variables');

  const [v1, v2] = variables;
  const c1Left = parseLinearSideCoeffs(eq1.left, variables);
  const c1Right = parseLinearSideCoeffs(eq1.right, variables);
  const c2Left = parseLinearSideCoeffs(eq2.left, variables);
  const c2Right = parseLinearSideCoeffs(eq2.right, variables);

  const a1 = c1Left[v1] - c1Right[v1];
  const b1 = c1Left[v2] - c1Right[v2];
  const d1 = c1Right.constant - c1Left.constant;
  const a2 = c2Left[v1] - c2Right[v1];
  const b2 = c2Left[v2] - c2Right[v2];
  const d2 = c2Right.constant - c2Left.constant;

  const steps: MathStep[] = [];
  let stepNum = 1;
  const pretty1 = formatPrettyEquation(eq1.left, eq1.right);
  const pretty2 = formatPrettyEquation(eq2.left, eq2.right);
  const std1 = formatTwoVarLinear(a1, b1, d1, v1, v2);
  const std2 = formatTwoVarLinear(a2, b2, d2, v1, v2);

  steps.push({
    step: stepNum++,
    title: 'Identify the simultaneous equations',
    content:
      `We have two linear equations with two unknowns (${v1} and ${v2}).\n` +
      `Equation 1: ${pretty1}\n` +
      `Equation 2: ${pretty2}`,
  });

  if (pretty1 !== std1 || pretty2 !== std2) {
    steps.push({
      step: stepNum++,
      title: 'Write in standard form',
      content:
        `Put each equation in the form a${v1} + b${v2} = c.\n` +
        `Equation 1: ${std1}\n` +
        `Equation 2: ${std2}`,
    });
  }

  steps.push({
    step: stepNum++,
    title: 'Identify the coefficients',
    content:
      `From each equation, read off a, b, and c.\n\n` +
      `From ${std1}:\n` +
      `a = ${formatNumber(a1)}\n` +
      `b = ${formatNumber(b1)}\n` +
      `c = ${formatNumber(d1)}\n\n` +
      `From ${std2}:\n` +
      `a = ${formatNumber(a2)}\n` +
      `b = ${formatNumber(b2)}\n` +
      `c = ${formatNumber(d2)}`,
  });

  const elimVar = Math.abs(b1) === Math.abs(b2) && Math.abs(b1) > 1e-8 ? v2 : v1;
  const useSecondVar = elimVar === v2;
  const c1 = useSecondVar ? b1 : a1;
  const c2 = useSecondVar ? b2 : a2;

  steps.push({
    step: stepNum++,
    title: 'Choose the elimination method',
    content: describeEliminationChoice(elimVar, c1, c2, v1, v2),
  });

  let workingA1 = a1;
  let workingB1 = b1;
  let workingD1 = d1;
  let workingA2 = a2;
  let workingB2 = b2;
  let workingD2 = d2;
  let sumA: number;
  let sumB: number;
  let sumD: number;
  let operation: 'Add' | 'Subtract';

  if (c1 * c2 < 0) {
    operation = 'Add';
  } else {
    const multiplier = c2 / c1;
    operation = 'Subtract';
    workingA1 = a1 * multiplier;
    workingB1 = b1 * multiplier;
    workingD1 = d1 * multiplier;

    if (Math.abs(multiplier - 1) > 1e-8) {
      steps.push({
        step: stepNum++,
        title: 'Make coefficients match',
        content:
          `Multiply equation 1 by ${formatNumber(multiplier)} so the ${elimVar} coefficients match.\n` +
          `Equation 1: ${formatTwoVarLinear(workingA1, workingB1, workingD1, v1, v2)}`,
      });
    }
  }

  const leftEq = formatTwoVarLinear(workingA1, workingB1, workingD1, v1, v2);
  const rightEq = formatTwoVarLinear(workingA2, workingB2, workingD2, v1, v2);
  const sign = operation === 'Add' ? 1 : -1;
  sumA = workingA1 + sign * workingA2;
  sumB = workingB1 + sign * workingB2;
  sumD = workingD1 + sign * workingD2;

  const formatCombinedTerm = (left: number, right: number, v: string): string => {
    if (operation === 'Add') {
      if (right < 0) return `${formatVarTerm(left, v)} − ${formatUnsignedTerm(Math.abs(right), v)}`;
      return `${formatVarTerm(left, v)} + ${formatVarTerm(right, v)}`;
    }
    return `${formatVarTerm(left, v)} − ${formatVarTerm(right, v)}`;
  };

  const v1Combine =
    Math.abs(sumA) < 1e-8
      ? `${formatCombinedTerm(workingA1, sign * workingA2, v1)} = 0`
      : `${formatCombinedTerm(workingA1, sign * workingA2, v1)} = ${formatVarTerm(sumA, v1)}`;
  const v2Combine =
    Math.abs(sumB) < 1e-8
      ? `${formatCombinedTerm(workingB1, sign * workingB2, v2)} = 0`
      : `${formatCombinedTerm(workingB1, sign * workingB2, v2)} = ${formatVarTerm(sumB, v2)}`;
  const constCombine =
    operation === 'Add'
      ? `${formatNumber(workingD1)} + ${formatNumber(workingD2)} = ${formatNumber(sumD)}`
      : `${formatNumber(workingD1)} − ${formatNumber(Math.abs(workingD2))} = ${formatNumber(sumD)}`;
  const resultEq = formatTwoVarLinear(sumA, sumB, sumD, v1, v2);

  steps.push({
    step: stepNum++,
    title: `${operation} the equations`,
    content:
      `${operation} equation 1 and equation 2 term by term.\n` +
      `Equation 1: ${leftEq}\n` +
      `Equation 2: ${rightEq}\n\n` +
      `${v1Combine}\n` +
      `${v2Combine}\n` +
      `${constCombine}\n\n` +
      `→ ${resultEq}`,
  });

  let elimTarget: string;
  let keepTarget: string;
  let elimCoeff: number;

  if (Math.abs(sumB) < 1e-8 && Math.abs(sumA) > 1e-8) {
    elimTarget = v1;
    keepTarget = v2;
    elimCoeff = sumA;
  } else if (Math.abs(sumA) < 1e-8 && Math.abs(sumB) > 1e-8) {
    elimTarget = v2;
    keepTarget = v1;
    elimCoeff = sumB;
  } else {
    throw new Error('Could not eliminate variable');
  }

  const elimValue = round(sumD / elimCoeff);

  steps.push({
    step: stepNum++,
    title: `Solve for ${elimTarget}`,
    content:
      `Divide both sides by ${formatNumber(elimCoeff)}.\n` +
      `${resultEq}\n` +
      `${elimTarget} = ${formatFraction(formatNumber(sumD), formatNumber(elimCoeff))}\n` +
      `${elimTarget} = ${formatNumber(elimValue)}`,
    latex: `${elimTarget} = ${formatNumber(elimValue)}`,
  });

  const elimCoeffEq1 = elimTarget === v1 ? a1 : b1;
  const keepCoeffEq1 = keepTarget === v1 ? a1 : b1;
  const elimContribution = round(elimCoeffEq1 * elimValue);
  const remainder = round(d1 - elimContribution);
  const keepValue = round(remainder / keepCoeffEq1);
  const substitutionEq = formatTwoVarLinear(a1, b1, d1, v1, v2);
  const substitutedLine =
    elimTarget === v1
      ? `${formatNumber(a1)}(${formatNumber(elimValue)}) ${formatSignedTerm(b1, v2)} = ${formatNumber(d1)}`
      : `${formatNumber(a1)}${v1} ${formatSignedTerm(b1, v2)}(${formatNumber(elimValue)}) = ${formatNumber(d1)}`;

  steps.push({
    step: stepNum++,
    title: `Substitute ${elimTarget} into equation 1`,
    content:
      `Replace ${elimTarget} with ${formatNumber(elimValue)} in equation 1.\n` +
      `Equation 1: ${substitutionEq}\n` +
      `${substitutedLine}`,
  });

  steps.push({
    step: stepNum++,
    title: `Solve for ${keepTarget}`,
    content:
      `Simplify and solve for ${keepTarget}.\n` +
      `${formatNumber(elimCoeffEq1)} × ${formatNumber(elimValue)} = ${formatNumber(elimContribution)}\n` +
      `${formatNumber(elimContribution)} ${formatSignedTerm(keepCoeffEq1, keepTarget)} = ${formatNumber(d1)}\n` +
      `${formatVarTerm(keepCoeffEq1, keepTarget)} = ${formatNumber(d1)} − ${formatNumber(elimContribution)}\n` +
      (Math.abs(keepCoeffEq1 - 1) < 1e-8
        ? `${keepTarget} = ${formatNumber(keepValue)}`
        : `${keepTarget} = ${formatFraction(formatNumber(remainder), formatNumber(keepCoeffEq1))} = ${formatNumber(keepValue)}`),
    latex: `${keepTarget} = ${formatNumber(keepValue)}`,
  });

  const finalV1 = v1 === elimTarget ? elimValue : keepValue;
  const finalV2 = v2 === elimTarget ? elimValue : keepValue;
  const checkLeft = round(a1 * finalV1 + b1 * finalV2);
  const checkBreakdown =
    `${formatNumber(a1)}(${formatNumber(finalV1)}) ${formatSignedTerm(b1, v2)}(${formatNumber(finalV2)})\n` +
    `= ${formatNumber(a1 * finalV1)} ${formatSignedTerm(b1 * finalV2, '')} = ${formatNumber(checkLeft)}`;

  steps.push({
    step: stepNum++,
    title: 'Check in equation 1',
    content:
      `Substitute both values back into equation 1.\n` +
      `Equation 1: ${substitutionEq}\n` +
      `${checkBreakdown}\n` +
      (Math.abs(checkLeft - d1) < 1e-6
        ? `Both sides equal ${formatNumber(d1)} ✓`
        : `${formatNumber(checkLeft)} = ${formatNumber(d1)}`),
  });

  steps.push({
    step: stepNum++,
    title: 'Write the answer',
    content: `${v1} = ${formatNumber(finalV1)}, ${v2} = ${formatNumber(finalV2)}`,
  });

  return {
    steps,
    answers: [`${v1} = ${formatNumber(finalV1)}`, `${v2} = ${formatNumber(finalV2)}`],
    graphable: false,
  };
}

export function generateGraph(expression: string, xMin = -10, xMax = 10): GraphSpec {
  let expr = normalizeMathInput(expression);
  if (expr.startsWith('y=')) expr = expr.slice(2);

  const displayExpression = `y = ${formatPrettyMath(expr.replace(/\^2/g, '²'))}`;
  const compiled = math.compile(expr.replace(/\^/g, '^'));

  const points: GraphPoint[] = [];
  const step = (xMax - xMin) / 200;

  for (let x = xMin; x <= xMax; x += step) {
    try {
      const y = compiled.evaluate({ x });
      if (typeof y === 'number' && isFinite(y)) {
        points.push({ x: round(x), y: round(y) });
      }
    } catch {
      // skip invalid points
    }
  }

  const ys = points.map((p) => p.y);
  const yMin = ys.length ? Math.min(...ys) : -10;
  const yMax = ys.length ? Math.max(...ys) : 10;

  const roots: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].y * points[i + 1].y <= 0 && Math.abs(points[i + 1].x - points[i].x) < step * 2) {
      roots.push(round((points[i].x + points[i + 1].x) / 2));
    }
  }

  return {
    expression: expr,
    displayExpression,
    xMin,
    xMax,
    yMin: round(yMin - 1),
    yMax: round(yMax + 1),
    points,
    roots: roots.length ? roots : undefined,
  };
}
