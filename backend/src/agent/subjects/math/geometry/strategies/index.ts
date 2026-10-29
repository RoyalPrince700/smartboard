/**
 * Strategy definitions for geometry method selection.
 */

import { StrategyDefinition } from '../../../../types';

export const geometryStrategies: StrategyDefinition[] = [
  {
    strategyId: 'angle_theorems',
    priority: 35,
    conditions: [{ field: 'find', operator: 'eq', value: 'unknown_angle' }],
    method: 'angle_theorems',
    fallback: 'triangle_measures',
    description: 'Use angle facts for unknown angles in diagrams',
  },
  {
    strategyId: 'prefer_pythagoras',
    priority: 30,
    conditions: [{ field: 'isRightTriangle', operator: 'eq', value: true }],
    method: 'pythagoras',
    fallback: 'triangle_measures',
    description: 'If the triangle is right-angled, use Pythagoras to find a missing side',
  },
  {
    strategyId: 'circle_measures',
    priority: 20,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'circle' }],
    method: 'circle_measures',
    description: 'Use πr² and 2πr for a circle',
  },
  {
    strategyId: 'rectangle_measures',
    priority: 20,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'rectangle' }],
    method: 'rectangle_measures',
    description: 'Use length × width for a rectangle',
  },
  {
    strategyId: 'square_measures',
    priority: 20,
    conditions: [{ field: 'shapeType', operator: 'eq', value: 'square' }],
    method: 'square_measures',
    fallback: 'rectangle_measures',
    description: 'Use side² for a square',
  },
  {
    strategyId: 'default_geometry_measures',
    priority: 10,
    conditions: [],
    method: 'triangle_measures',
    description: 'Default to triangle perimeter and area when the shape is not specialised',
  },
];
