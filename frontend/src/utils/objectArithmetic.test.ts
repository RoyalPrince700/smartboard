import { describe, expect, it } from 'vitest';
import { figureLabel, parseCountingScene } from './objectArithmetic';

describe('parseCountingScene', () => {
  it('pictures a small sum with two different objects', () => {
    const scene = parseCountingScene('3 + 2');
    expect(scene).toMatchObject({ left: 3, op: '+', right: 2, result: 5 });
    expect(scene?.leftFigure.id).not.toBe(scene?.rightFigure.id);
  });

  it('keeps the same objects when the spacing or a written answer changes', () => {
    const a = parseCountingScene('3+2');
    const b = parseCountingScene('3 + 2 = 5');
    expect(a?.leftFigure.id).toBe(b?.leftFigure.id);
    expect(a?.rightFigure.id).toBe(b?.rightFigure.id);
  });

  it('pictures take-away, groups, and equal shares', () => {
    expect(parseCountingScene('5 - 3')).toMatchObject({ op: '-', result: 2 });
    expect(parseCountingScene('5 − 3')?.leftFigure.id).toBe(
      parseCountingScene('5-3')?.leftFigure.id
    );
    expect(parseCountingScene('4 × 3')).toMatchObject({ op: '*', result: 12 });
    expect(parseCountingScene('8 ÷ 2')).toMatchObject({ op: '/', result: 4 });
    expect(parseCountingScene('5-3')?.leftFigure.id).toBe(parseCountingScene('5-3')?.rightFigure.id);
  });

  it('skips equations, chains, powers, and counts that are too big to draw', () => {
    expect(parseCountingScene('x + 2 = 5')).toBeNull();
    expect(parseCountingScene('2x + 3 = 7')).toBeNull();
    expect(parseCountingScene('2 + 3 + 1')).toBeNull();
    expect(parseCountingScene('(2+5)*3')).toBeNull();
    expect(parseCountingScene('2^3')).toBeNull();
    expect(parseCountingScene('5 / 2')).toBeNull();
    expect(parseCountingScene('4 * 5')).toBeNull();
    expect(parseCountingScene('20 + 1')).toBeNull();
    expect(parseCountingScene('3 - 8')).toBeNull();
  });

  it('labels one object in the singular', () => {
    const scene = parseCountingScene('1 + 4');
    expect(scene).not.toBeNull();
    if (!scene) return;
    expect(figureLabel(1, scene.leftFigure)).toBe(`1 ${scene.leftFigure.singular}`);
    expect(figureLabel(4, scene.rightFigure)).toBe(`4 ${scene.rightFigure.plural}`);
  });
});
