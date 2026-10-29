import { env } from '../../config/env';
import { AIContext } from '../../types/ai';
import { GraphSpec, MathStep, ProblemType, SolveResult } from '../../types/math';
import { createOpenAIProvider } from '../ai/providers/OpenAIProvider';
import { extractGraphExpression, parseEquation } from './EquationParser';
import {
  evaluateExpression,
  generateGraph,
  solveLinear,
  solveQuadratic,
  solveExponential,
  solveAbsoluteValue,
  solveSimultaneous,
} from './StepSolver';
import { looksLikeProbability, solveProbability } from './ProbabilitySolver';

export class MathEngine {
  async solve(input: string, options?: { includeGraph?: boolean; context?: AIContext }): Promise<SolveResult> {
    const trimmed = input.trim();
    const normalizedInput = trimmed.replace(/²/g, '^2').replace(/×/g, '*');

    if (looksLikeProbability(trimmed)) {
      try {
        const result = solveProbability(trimmed);
        const explanation = await this.generateExplanation(trimmed, result.steps, result.answers, options?.context);
        return {
          recognizedInput: trimmed,
          normalizedInput: trimmed,
          problemType: 'probability',
          equation: trimmed,
          steps: result.steps,
          answer: result.answers.join(', '),
          answers: result.answers,
          graphable: false,
          explanation,
        };
      } catch {
        // fall through to equation parser
      }
    }

    const graphExpr = extractGraphExpression(trimmed);
    if (graphExpr) {
      return this.solveGraph(graphExpr, trimmed, options);
    }

    const parsed = parseEquation(trimmed);
    if (!parsed) {
      return this.tryEvaluate(trimmed, normalizedInput);
    }

    let steps: MathStep[] = [];
    let answers: string[] = [];
    let graphable = false;
    let problemType: ProblemType = parsed.problemType;

    try {
      switch (parsed.problemType) {
        case 'quadratic': {
          const result = solveQuadratic(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          break;
        }
        case 'linear': {
          const result = solveLinear(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          break;
        }
        case 'exponential': {
          const result = solveExponential(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          break;
        }
        case 'absolute_value': {
          const result = solveAbsoluteValue(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          break;
        }
        case 'simultaneous': {
          const result = solveSimultaneous(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          break;
        }
        case 'arithmetic':
        case 'expression': {
          const result = evaluateExpression(trimmed);
          steps = result.steps;
          answers = result.answers;
          graphable = result.graphable;
          problemType = 'arithmetic';
          break;
        }
        default: {
          return this.tryEvaluate(trimmed, normalizedInput);
        }
      }
    } catch {
      return this.tryEvaluate(trimmed, normalizedInput);
    }

    let graph: GraphSpec | undefined;
    if (options?.includeGraph !== false && graphable) {
      try {
        const coeffs = parsed.problemType === 'quadratic';
        if (coeffs || parsed.problemType === 'linear') {
          const expr = buildGraphExpressionFromEquation(parsed.left, parsed.right);
          if (expr) graph = generateGraph(expr);
        }
      } catch {
        // graph optional
      }
    }

    const explanation = await this.generateExplanation(trimmed, steps, answers, options?.context);

    return {
      recognizedInput: trimmed,
      normalizedInput,
      problemType,
      equation: parsed.normalized,
      steps,
      answer: answers.join(', '),
      answers,
      graph,
      graphable,
      explanation,
    };
  }

  solveGraph(expression: string, originalInput: string, options?: { context?: AIContext }): SolveResult {
    const graph = generateGraph(expression);
    const steps: MathStep[] = [
      {
        step: 1,
        title: 'Identify function',
        content: `Graph the function ${graph.displayExpression}`,
        latex: graph.displayExpression.replace('y = ', 'y = '),
      },
      {
        step: 2,
        title: 'Plot key points',
        content: `Sampled ${graph.points.length} points from x = ${graph.xMin} to x = ${graph.xMax}`,
      },
    ];

    if (graph.roots?.length) {
      steps.push({
        step: 3,
        title: 'X-intercepts (approximate)',
        content: `Roots near: ${graph.roots.map((r) => `x ≈ ${r}`).join(', ')}`,
      });
    }

    return {
      recognizedInput: originalInput,
      normalizedInput: graph.displayExpression,
      problemType: 'graph',
      equation: graph.displayExpression,
      steps,
      answer: graph.displayExpression,
      answers: [graph.displayExpression],
      graph,
      graphable: true,
    };
  }

  visualize(expression: string, xMin?: number, xMax?: number): GraphSpec {
    return generateGraph(expression, xMin ?? -10, xMax ?? 10);
  }

  private tryEvaluate(input: string, normalizedInput: string): SolveResult {
    try {
      const result = evaluateExpression(input);
      return {
        recognizedInput: input,
        normalizedInput,
        problemType: 'arithmetic',
        steps: result.steps,
        answer: result.answers[0],
        answers: result.answers,
        graphable: false,
      };
    } catch {
      return {
        recognizedInput: input,
        normalizedInput,
        problemType: 'unknown',
        steps: [
          {
            step: 1,
            title: 'Could not parse',
            content: 'Unable to parse this as a standard equation. Try formats like: 2x^2 + 5x - 3 = 0, or Graph y = x^2 - 4x + 3',
          },
        ],
        answer: 'Unable to solve',
        answers: [],
        graphable: false,
      };
    }
  }

  private async generateExplanation(
    input: string,
    steps: MathStep[],
    answers: string[],
    context?: AIContext
  ): Promise<string | undefined> {
    if (env.aiProvider !== 'openai' || !env.openaiApiKey) return undefined;

    const openai = createOpenAIProvider();
    if (!openai) return undefined;

    try {
      const stepSummary = steps.map((s) => `${s.step}. ${s.title}: ${s.content}`).join('\n');
      const result = await openai.explainConcept(
        `Briefly explain these math solution steps to a student (2-3 sentences):\n\nProblem: ${input}\n\nSteps:\n${stepSummary}\n\nAnswer: ${answers.join(', ')}`,
        context
      );
      return result.text;
    } catch {
      return undefined;
    }
  }
}

function buildGraphExpressionFromEquation(left: string, right: string): string | null {
  if (right === '0' && left.includes('x')) {
    return left;
  }
  return null;
}

export const mathEngine = new MathEngine();
