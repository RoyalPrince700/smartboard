import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ruleEngine } from './ruleEngine';
import { strategySelector } from './strategySelector';
import { parseSubmittedRoots } from './verifier';
import { buildInputHints, inferDegree } from './normalizer';
import { quadraticRules } from '../subjects/math/quadratic/rules';
import { quadraticStrategies } from '../subjects/math/quadratic/strategies';

describe('ruleEngine', () => {
  it('applies discriminant > 0 rule', () => {
    const { context, appliedRules } = ruleEngine.evaluate(quadraticRules, {
      degree: 2,
      discriminant: 49,
    });

    assert.ok(appliedRules.includes('discriminant_positive'));
    assert.equal(context.rootCount, 2);
    assert.equal(context.rootType, 'real_distinct');
  });

  it('applies discriminant = 0 rule', () => {
    const { context } = ruleEngine.evaluate(quadraticRules, { degree: 2, discriminant: 0 });
    assert.equal(context.rootCount, 1);
    assert.equal(context.rootType, 'real_repeated');
  });

  it('applies discriminant < 0 rule', () => {
    const { context } = ruleEngine.evaluate(quadraticRules, { degree: 2, discriminant: -4 });
    assert.equal(context.rootType, 'complex');
  });
});

describe('strategySelector', () => {
  it('selects factorization when factorizable', () => {
    const result = strategySelector.select(quadraticStrategies, { factorizable: true });
    assert.ok(result);
    assert.equal(result!.method, 'factorization');
    assert.equal(result!.usedFallback, false);
  });

  it('selects default strategy when no conditions match', () => {
    const result = strategySelector.select(quadraticStrategies, { factorizable: false });
    assert.ok(result);
    assert.equal(result!.method, 'quadratic_formula');
    // default strategy has empty conditions — matched directly, not via fallback
    assert.equal(result!.usedFallback, false);
  });
});

describe('verifier — parseSubmittedRoots', () => {
  it('parses x = format', () => {
    const roots = parseSubmittedRoots('x = -3 or x = 0.5');
    assert.deepEqual(roots, [-3, 0.5]);
  });

  it('parses comma-separated roots', () => {
    const roots = parseSubmittedRoots('-3, 0.5');
    assert.deepEqual(roots, [-3, 0.5]);
  });
});

describe('normalizer', () => {
  it('detects quadratic input', () => {
    const hints = buildInputHints('2x^2 + 5x - 3 = 0');
    assert.equal(hints.degree, 2);
    assert.equal(hints.problemType, 'quadratic');
  });

  it('infers degree from input', () => {
    assert.equal(inferDegree('x^2 + 1 = 0'), 2);
    assert.equal(inferDegree('2x + 3 = 0'), 1);
  });
});
