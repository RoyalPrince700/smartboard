import { create, all } from 'mathjs';
import { formatNumber, formatPrettyMath } from './EquationParser';

const math = create(all);

interface ArithStep {
  title: string;
  content: string;
}

function opSymbol(op: string): string {
  if (op === '*') return '×';
  if (op === '/') return '÷';
  return op;
}

function formatOpLine(a: number, op: string, b: number, result: number): string {
  return `${formatNumber(a)} ${opSymbol(op)} ${formatNumber(b)} = ${formatNumber(result)}`;
}

function findFirstOp(expr: string, operators: string[]): { a: number; op: string; b: number; raw: string } | null {
  for (const op of operators) {
    const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*${escaped}\\s*(-?\\d+(?:\\.\\d+)?)`);
    const match = expr.match(pattern);
    if (match) {
      return { a: Number(match[1]), op, b: Number(match[2]), raw: match[0] };
    }
  }
  return null;
}

function applyOp(a: number, op: string, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b !== 0 ? a / b : NaN;
    default:
      return NaN;
  }
}

function opTitle(op: string): string {
  switch (op) {
    case '*':
      return 'Multiply';
    case '/':
      return 'Divide';
    case '+':
      return 'Add';
    case '-':
      return 'Subtract';
    default:
      return 'Calculate';
  }
}

function opExplanation(op: string): string {
  switch (op) {
    case '*':
      return 'Multiplication comes before addition and subtraction.';
    case '/':
      return 'Division comes before addition and subtraction.';
    case '+':
      return 'Now add the remaining terms.';
    case '-':
      return 'Now subtract the remaining terms.';
    default:
      return '';
  }
}

/** Build BIDMAS-style steps for a numeric expression (no variables). */
export function buildArithmeticEvaluationSteps(normalizedExpr: string): {
  steps: ArithStep[];
  result: number;
} {
  const steps: ArithStep[] = [];
  let expr = normalizedExpr.replace(/\s/g, '');

  steps.push({
    title: 'Identify the expression',
    content: `We need to calculate:\n${formatPrettyMath(expr)}`,
  });

  steps.push({
    title: 'Recall the order of operations',
    content:
      'Follow BIDMAS (Brackets, Indices, Division, Multiplication, Addition, Subtraction).\n' +
      'Work out brackets first, then × and ÷, then + and −.',
  });

  while (/\([^()]+\)/.test(expr)) {
    const match = expr.match(/\(([^()]+)\)/);
    if (!match) break;
    const inner = match[1];
    const innerVal = Number(math.evaluate(inner));
    steps.push({
      title: 'Work out the brackets',
      content:
        `Calculate inside the brackets first.\n` +
        `${formatPrettyMath(inner)} = ${formatNumber(innerVal)}`,
    });
    expr = expr.replace(`(${inner})`, String(innerVal));
    steps.push({
      title: 'Update the expression',
      content: `After the brackets, the expression becomes:\n${formatPrettyMath(expr)}`,
    });
  }

  let prevExpr = '';
  while (/[\*/]/.test(expr) && expr !== prevExpr) {
    prevExpr = expr;
    const found = findFirstOp(expr, ['*', '/']);
    if (!found) break;
    const { a, op, b, raw } = found;
    const result = applyOp(a, op, b);
    steps.push({
      title: `${opTitle(op)} next`,
      content:
        `${opExplanation(op)}\n` +
        `${formatOpLine(a, op, b, result)}\n` +
        `→ ${formatPrettyMath(expr.replace(raw, String(result)))}`,
    });
    expr = expr.replace(raw, String(result));
  }

  prevExpr = '';
  while (/[+\-]/.test(expr) && expr !== prevExpr && !/^-?\d+(?:\.\d+)?$/.test(expr)) {
    prevExpr = expr;
    const found = findFirstOp(expr, ['+', '-']);
    if (!found) break;
    const { a, op, b, raw } = found;
    const result = applyOp(a, op, b);
    steps.push({
      title: `${opTitle(op)} the remaining terms`,
      content:
        `${opExplanation(op)}\n` +
        `${formatOpLine(a, op, b, result)}\n` +
        `→ ${formatPrettyMath(expr.replace(raw, String(result)))}`,
    });
    expr = expr.replace(raw, String(result));
  }

  const result = Number(math.evaluate(normalizedExpr.replace(/\s/g, '')));
  steps.push({
    title: 'Write the answer',
    content: `${formatPrettyMath(normalizedExpr)} = ${formatNumber(result)}`,
  });

  return { steps, result };
}
