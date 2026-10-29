/**
 * Unit tests for geometry parsing and solvers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseGeometryInput } from '../solvers/parser';
import { solveTriangle } from '../solvers/triangleSolver';
import { solveRectangle } from '../solvers/rectangleSolver';
import { solveCircle } from '../solvers/circleSolver';
import { solveAngleDiagram } from '../solvers/angleDiagramSolver';
import { defaultGeometrySolver } from '../solvers/index';
import { geometryRules } from '../rules';
import { ruleEngine } from '../../../../reasoning/ruleEngine';
import { createAgentContext } from '../../../../core/agentContext';
import { TutorSessionData } from '../../../../schemas/conversation.schema';

function makeContext(message: string) {
  const session = {
    sessionId: 'test',
    currentStep: 0,
    completedSteps: [],
    teachingMode: 'GUIDED',
    difficulty: 'beginner',
    conversationHistory: [],
    metadata: {},
    subject: 'math',
    topic: 'geometry',
  } as TutorSessionData;

  return createAgentContext(message, session, { intent: 'START_PROBLEM', confidence: 0.9 });
}

describe('geometry — parser', () => {
  it('parses structured board capture', () => {
    const parsed = parseGeometryInput(
      '[geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse'
    );
    assert.ok(parsed);
    assert.equal(parsed!.shapeType, 'triangle');
    assert.deepEqual(parsed!.sides, [3, 4, 5]);
    assert.equal(parsed!.find, 'hypotenuse');
    assert.equal(parsed!.isRightTriangle, true);
  });

  it('parses triangle base and height', () => {
    const parsed = parseGeometryInput('Find the area of a triangle with base 6cm and height 4cm');
    assert.ok(parsed);
    assert.equal(parsed!.shapeType, 'triangle');
    assert.equal(parsed!.base, 6);
    assert.equal(parsed!.height, 4);
    assert.equal(parsed!.find, 'area');
  });

  it('parses rectangle 8 by 5', () => {
    const parsed = parseGeometryInput('A rectangle is 8cm by 5cm. Find the perimeter');
    assert.ok(parsed);
    assert.equal(parsed!.shapeType, 'rectangle');
    assert.equal(parsed!.length, 8);
    assert.equal(parsed!.width, 5);
    assert.equal(parsed!.find, 'perimeter');
  });

  it('returns null for quadratic input', () => {
    assert.equal(parseGeometryInput('2x^2 + 5x - 3 = 0'), null);
  });

  it('parses scene-derived unknown angle metadata', () => {
    const parsed = parseGeometryInput(
      '[geometry] shape=angle_diagram angles=58 unknownAngles=2 equalLengthPairs=1 find=unknown_angle'
    );
    assert.ok(parsed);
    assert.equal(parsed!.shapeType, 'angle_diagram');
    assert.deepEqual(parsed!.knownAngles, [58]);
    assert.equal(parsed!.unknownAngleCount, 2);
    assert.equal(parsed!.equalLengthPairs, 1);
    assert.equal(parsed!.find, 'unknown_angle');
  });
});

describe('geometry — triangle', () => {
  it('uses Pythagoras for 3-4-5', () => {
    const parsed = parseGeometryInput(
      '[geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse'
    )!;
    const trace = solveTriangle(parsed);
    assert.equal(trace.recognizedData?.hypotenuse, 5);
    assert.equal(trace.recognizedData?.isRightTriangle, true);
    assert.match(String(trace.recognizedData?.answerDisplay), /5 cm/);
  });

  it('computes area from base and height', () => {
    const parsed = parseGeometryInput('Find the area of a triangle with base 6cm and height 4cm')!;
    const trace = solveTriangle(parsed);
    assert.equal(trace.recognizedData?.area, 12);
  });
});

describe('geometry — rectangle and circle', () => {
  it('computes rectangle perimeter', () => {
    const parsed = parseGeometryInput('A rectangle is 8cm by 5cm. Find the perimeter')!;
    const trace = solveRectangle(parsed);
    assert.equal(trace.recognizedData?.perimeter, 26);
    assert.equal(trace.recognizedData?.area, 40);
  });

  it('uses 22/7 for circle radius 7', () => {
    const parsed = parseGeometryInput('Circle radius 7cm find the area')!;
    const trace = solveCircle(parsed);
    assert.equal(trace.recognizedData?.area, 154);
  });
});

describe('geometry — angle diagrams', () => {
  it('uses isosceles angle sum when equal side marks are present', () => {
    const parsed = parseGeometryInput(
      '[geometry] shape=angle_diagram angles=58 unknownAngles=2 equalLengthPairs=1 find=unknown_angle'
    )!;
    const trace = solveAngleDiagram(parsed);
    assert.equal(trace.recognizedData?.unknownAngle, 61);
    assert.match(String(trace.recognizedData?.answerDisplay), /61°/);
  });

  it('uses parallel-line angle facts when parallel pairs are present', () => {
    const parsed = parseGeometryInput(
      '[geometry] shape=angle_diagram angles=58 unknownAngles=1 parallelPairs=1 find=unknown_angle'
    )!;
    const trace = solveAngleDiagram(parsed);
    assert.equal(trace.recognizedData?.supplementaryAngle, 122);
    assert.match(String(trace.recognizedData?.answerDisplay), /58°/);
  });
});

describe('geometry — solver orchestration', () => {
  it('defaultGeometrySolver solves a 3-4-5 triangle', () => {
    const context = makeContext('[geometry] shape=triangle values=3,4,5 unit=cm find=hypotenuse');
    const trace = defaultGeometrySolver(context);
    assert.equal(trace.problemType, 'geometry');
    assert.equal(trace.recognizedData?.hypotenuse, 5);
  });

  it('defaultGeometrySolver solves scene-derived angle diagrams', () => {
    const context = makeContext(
      '[geometry] shape=angle_diagram angles=58 unknownAngles=2 equalLengthPairs=1 find=unknown_angle'
    );
    const trace = defaultGeometrySolver(context);
    assert.equal(trace.problemType, 'geometry');
    assert.equal(trace.recognizedData?.unknownAngle, 61);
  });
});

describe('geometry — rules', () => {
  it('flags Pythagoras for a right triangle', () => {
    const { context, appliedRules } = ruleEngine.evaluate(geometryRules, {
      problemType: 'geometry',
      shapeType: 'triangle',
      isRightTriangle: true,
    });
    assert.ok(appliedRules.includes('right_triangle_pythagoras'));
    assert.equal(context.preferredMethod, 'pythagoras');
  });

  it('flags angle theorem strategy for unknown angle diagrams', () => {
    const { context, appliedRules } = ruleEngine.evaluate(geometryRules, {
      problemType: 'geometry',
      shapeType: 'angle_diagram',
      find: 'unknown_angle',
      equalLengthPairs: 1,
    });
    assert.ok(appliedRules.includes('angle_diagram_unknown_angle'));
    assert.ok(appliedRules.includes('isosceles_angle_sum'));
    assert.equal(context.preferredMethod, 'isosceles_triangle_angle_sum');
  });
});
