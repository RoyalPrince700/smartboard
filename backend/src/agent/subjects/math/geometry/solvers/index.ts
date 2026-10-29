/**
 * Geometry solvers — parse the board/text problem, then dispatch by shape.
 */

import { AgentContext } from '../../../../core/agentContext';
import { ParsedGeometryProblem, PartialReasoningTrace } from '../types';
import { parseGeometryInput } from './parser';
import { solveTriangle } from './triangleSolver';
import { solveRectangle } from './rectangleSolver';
import { solveCircle } from './circleSolver';
import { solveAngleDiagram } from './angleDiagramSolver';

function resolveGeometryInput(context: AgentContext): string {
  const fromMessage = context.normalizedInput || context.rawInput;
  if (parseGeometryInput(fromMessage)) return fromMessage;

  const stored = context.session.currentProblem?.rawInput;
  if (stored && parseGeometryInput(stored)) {
    return `${stored} ${fromMessage}`.trim();
  }

  return fromMessage;
}

function parseToTrace(problem: ParsedGeometryProblem): PartialReasoningTrace {
  return {
    problemType: 'geometry',
    recognizedData: {
      problemType: 'geometry',
      shapeType: problem.shapeType,
      find: problem.find,
      unit: problem.unit,
      sides: problem.sides,
      base: problem.base,
      height: problem.height,
      length: problem.length,
      width: problem.width,
      radius: problem.radius,
      diameter: problem.diameter,
      isRightTriangle: problem.isRightTriangle,
    },
    reasoningSteps: [
      {
        order: 1,
        action: 'parse',
        description: `Read the geometry problem: ${problem.shapeType === 'unknown' ? 'plane shape' : problem.shapeType}.`,
      },
    ],
  };
}

function dispatch(problem: ParsedGeometryProblem): PartialReasoningTrace {
  switch (problem.shapeType) {
    case 'angle_diagram':
      return solveAngleDiagram(problem);
    case 'triangle':
      if (problem.knownAngles.length > 0 && problem.find === 'unknown_angle') {
        return solveAngleDiagram(problem);
      }
      return solveTriangle(problem);
    case 'square':
    case 'rectangle':
      return solveRectangle(problem);
    case 'circle':
      return solveCircle(problem);
    default: {
      if (problem.radius || problem.diameter) return solveCircle(problem);
      if (problem.length && problem.width) return solveRectangle({ ...problem, shapeType: 'rectangle' });
      if (problem.knownAngles.length > 0 || problem.unknownAngleCount > 0) {
        return solveAngleDiagram({ ...problem, shapeType: 'angle_diagram' });
      }
      if (problem.sides.length >= 2 || (problem.base && problem.height)) {
        return solveTriangle({ ...problem, shapeType: 'triangle' });
      }
      return {
        problemType: 'geometry',
        flags: ['parse_failed'],
        reasoningSteps: [
          {
            order: 1,
            action: 'parse',
            description:
              'Could not tell which plane shape this is. Draw a triangle, rectangle, square, or circle and label the lengths.',
          },
        ],
      };
    }
  }
}

export function defaultGeometrySolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveGeometryInput(context);
  const parsed = parseGeometryInput(input);

  if (!parsed) {
    return {
      problemType: 'geometry',
      flags: ['parse_failed'],
      reasoningSteps: [
        {
          order: 1,
          action: 'parse',
          description:
            'Could not parse a geometry problem. Draw a shape and write the lengths beside it, for example 3 cm, 4 cm, 5 cm.',
        },
      ],
    };
  }

  const parseTrace = parseToTrace(parsed);
  const solved = dispatch(parsed);

  return {
    ...solved,
    recognizedData: { ...parseTrace.recognizedData, ...solved.recognizedData },
    reasoningSteps: [
      ...(parseTrace.reasoningSteps ?? []).slice(0, 1),
      ...(solved.reasoningSteps ?? []).filter((step) => step.action !== 'identify_shape' && step.action !== 'parse'),
    ],
  };
}

export function pythagorasSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveGeometryInput(context);
  const parsed = parseGeometryInput(input);
  if (!parsed) return defaultGeometrySolver(context);
  return solveTriangle({ ...parsed, shapeType: 'triangle', isRightTriangle: true, find: parsed.find === 'all' ? 'hypotenuse' : parsed.find });
}

export function areaSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveGeometryInput(context);
  const parsed = parseGeometryInput(input);
  if (!parsed) return defaultGeometrySolver(context);
  return dispatch({ ...parsed, find: 'area' });
}

export function perimeterSolver(context: AgentContext): PartialReasoningTrace {
  const input = resolveGeometryInput(context);
  const parsed = parseGeometryInput(input);
  if (!parsed) return defaultGeometrySolver(context);
  const find = parsed.shapeType === 'circle' ? 'circumference' : 'perimeter';
  return dispatch({ ...parsed, find });
}
