import { describe, expect, it } from 'vitest';
import { classifyPolygon } from './opencvGeometryUtils';

describe('classifyPolygon', () => {
  it('classifies three vertices as triangle', () => {
    const result = classifyPolygon([
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 100, y: 0 },
      { id: 'C', x: 50, y: 80 },
    ]);
    expect(result.type).toBe('triangle');
  });

  it('classifies four equal sides as rectangle', () => {
    const result = classifyPolygon([
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 100, y: 0 },
      { id: 'C', x: 100, y: 60 },
      { id: 'D', x: 0, y: 60 },
    ]);
    expect(result.type).toBe('rectangle');
  });
});
