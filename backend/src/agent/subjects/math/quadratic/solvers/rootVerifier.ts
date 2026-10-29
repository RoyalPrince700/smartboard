/**
 * Verifies roots by substitution into ax² + bx + c.
 */

import { roundRoot } from '../../shared/equationAdapter';

export function evaluateQuadratic(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c;
}

export function verifyRoots(
  a: number,
  b: number,
  c: number,
  roots: number[],
  tolerance = 1e-6
): boolean {
  if (roots.length === 0) return false;
  return roots.every((r) => Math.abs(evaluateQuadratic(a, b, c, r)) < tolerance);
}

export function verifyRootsWithDetails(
  a: number,
  b: number,
  c: number,
  roots: number[]
): { valid: boolean; checks: string[] } {
  const checks = roots.map((r) => {
    const value = roundRoot(evaluateQuadratic(a, b, c, r));
    return `f(${r}) = ${value}`;
  });
  return { valid: verifyRoots(a, b, c, roots), checks };
}
