/**
 * Geometry topic registration.
 */

import { TopicRegistration } from '../../../types';
import { AgentContext } from '../../../core/agentContext';
import { geometryRules } from './rules';
import { geometryStrategies } from './strategies';
import {
  areaSolver,
  defaultGeometrySolver,
  perimeterSolver,
} from './solvers';

const GEOMETRY_PATTERN =
  /\[geometry\]|\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b|\bhypotenuse\b|\bpythagoras\b|\bpythagorean\b|\bperimeter\b|\bperimetre\b|\bcircumference\b|\bradius\b|\bdiameter\b|\bright[-\s]?angl|\barea of\b/i;

function classifyGeometry(input: string, context: AgentContext) {
  const matches = GEOMETRY_PATTERN.test(input) || context.session.topic === 'geometry';
  return { matches, confidence: matches ? (/\[geometry\]/i.test(input) ? 0.95 : 0.82) : 0 };
}

export const geometryTopic: TopicRegistration = {
  id: 'geometry',
  label: 'Plane Geometry',
  subtopics: [
    'plane_shapes',
    'triangle',
    'pythagoras',
    'rectangle',
    'square',
    'circle',
    'area',
    'perimeter',
  ],
  solvers: {
    default: defaultGeometrySolver,
    angle_theorems: defaultGeometrySolver,
    area: areaSolver,
    perimeter: perimeterSolver,
  },
  rules: geometryRules,
  strategies: geometryStrategies,
  knowledgeTypes: [
    'definition',
    'formula',
    'explanation',
    'hint',
    'misconception',
    'worked_step',
  ],
  topicClassifier: classifyGeometry,
};
