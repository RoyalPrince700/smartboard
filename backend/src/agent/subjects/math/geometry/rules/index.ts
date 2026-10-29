/**
 * Deterministic rules for plane geometry.
 * Also stored in MongoDB (agentRules) for content authoring.
 */

import { RuleDefinition } from '../../../../types';

export const geometryRules: RuleDefinition[] = [
  {
    ruleId: 'geometry_shape_detected',
    priority: 100,
    conditions: [
      { field: 'shapeType', operator: 'in', value: ['triangle', 'rectangle', 'square', 'circle'] },
    ],
    actions: [{ type: 'set', field: 'problemType', value: 'geometry' }],
    description: 'IF a plane shape is recognised THEN problem type = geometry',
  },
  {
    ruleId: 'geometry_jss_step_breakdown',
    priority: 95,
    conditions: [{ field: 'problemType', operator: 'eq', value: 'geometry' }],
    actions: [
      { type: 'set', field: 'solutionBreakdown', value: 'jss_step_by_step' },
      {
        type: 'set',
        field: 'breakdownSequence',
        value: [
          'identify_shape',
          'list_givens',
          'choose_formula',
          'substitute_values',
          'calculate',
          'state_answer',
        ],
      },
    ],
    description:
      'For JSS-friendly geometry teaching, name the shape, list the given lengths, write the formula, then substitute before stating the answer.',
  },
  {
    ruleId: 'right_triangle_pythagoras',
    priority: 90,
    conditions: [{ field: 'isRightTriangle', operator: 'eq', value: true }],
    actions: [
      { type: 'set', field: 'triangleType', value: 'right_angled' },
      { type: 'set', field: 'preferredMethod', value: 'pythagoras' },
    ],
    description: 'IF the triangle is right-angled THEN use Pythagoras a² + b² = c²',
  },
  {
    ruleId: 'angle_diagram_unknown_angle',
    priority: 88,
    conditions: [{ field: 'find', operator: 'eq', value: 'unknown_angle' }],
    actions: [
      { type: 'set', field: 'problemType', value: 'geometry' },
      { type: 'set', field: 'preferredMethod', value: 'angle_theorems' },
    ],
    description: 'IF the diagram asks for an unknown angle THEN use angle facts and theorem rules',
  },
  {
    ruleId: 'isosceles_angle_sum',
    priority: 87,
    conditions: [{ field: 'equalLengthPairs', operator: 'gt', value: 0 }],
    actions: [
      { type: 'set', field: 'triangleType', value: 'isosceles' },
      { type: 'set', field: 'preferredMethod', value: 'isosceles_triangle_angle_sum' },
    ],
    description: 'IF two sides are equal THEN base angles are equal and triangle angles sum to 180°',
  },
  {
    ruleId: 'triangle_three_sides',
    priority: 85,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'triangle' }],
    actions: [{ type: 'set', field: 'canUseHeron', value: true }],
    description: 'IF the shape is a triangle THEN area can be found from base × height or from three sides',
  },
  {
    ruleId: 'rectangle_area_perimeter',
    priority: 85,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'rectangle' }],
    actions: [{ type: 'set', field: 'measures', value: 'area_and_perimeter' }],
    description: 'IF the shape is a rectangle THEN Area = l × w and Perimeter = 2(l + w)',
  },
  {
    ruleId: 'square_area_perimeter',
    priority: 85,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'square' }],
    actions: [{ type: 'set', field: 'measures', value: 'area_and_perimeter' }],
    description: 'IF the shape is a square THEN Area = side² and Perimeter = 4 × side',
  },
  {
    ruleId: 'circle_pi_measures',
    priority: 85,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'circle' }],
    actions: [{ type: 'set', field: 'measures', value: 'area_and_circumference' }],
    description: 'IF the shape is a circle THEN Area = πr² and Circumference = 2πr',
  },
];
