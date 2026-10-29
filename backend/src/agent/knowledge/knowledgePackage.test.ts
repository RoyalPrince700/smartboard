/**
 * Validates the full quadratic knowledge seed package (Phase 7).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { validateImportPackage } from './knowledgeValidator';

const SEED_DIR = path.resolve(__dirname, '../../../src/agent/knowledge/seed');

function readJson(filename: string): unknown[] {
  const filePath = path.join(SEED_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown[];
}

describe('quadratic knowledge package', () => {
  const pkg = {
    topics: readJson('topics.json'),
    knowledge: readJson('knowledge.json'),
    rules: readJson('rules.json'),
    examples: readJson('examples.json'),
    strategies: readJson('strategies.json'),
  };

  it('passes validation checklist', () => {
    const result = validateImportPackage(pkg);
    if (!result.valid) {
      console.error(result.errors);
    }
    assert.equal(result.valid, true, result.errors.join('\n'));
  });

  it('includes required knowledge types', () => {
    const types = new Set(
      (pkg.knowledge as { knowledgeType: string }[]).map((d) => d.knowledgeType)
    );
    assert.ok(types.has('definition'));
    assert.ok(types.has('explanation'));
    assert.ok(types.has('hint'));
    assert.ok(types.has('misconception'));
    assert.ok(types.has('formula'));
  });

  it('includes worked examples with verification', () => {
    assert.ok((pkg.examples as unknown[]).length >= 2);
    for (const ex of pkg.examples as { verification: unknown; answer: unknown }[]) {
      assert.ok(ex.verification);
      assert.ok(ex.answer);
    }
  });

  it('includes discriminant rules', () => {
    const ruleIds = (pkg.rules as { ruleId: string }[]).map((r) => r.ruleId);
    assert.ok(ruleIds.includes('discriminant_positive'));
    assert.ok(ruleIds.includes('discriminant_zero'));
    assert.ok(ruleIds.includes('discriminant_negative'));
  });

  it('covers all quadratic subtopics', () => {
    const topic = (pkg.topics as { subtopics: string[] }[])[0];
    const knowledgeSubtopics = new Set(
      (pkg.knowledge as { subtopic?: string }[])
        .map((d) => d.subtopic)
        .filter(Boolean)
    );
    for (const sub of ['standard_form', 'discriminant', 'factorization', 'quadratic_formula']) {
      assert.ok(topic.subtopics.includes(sub));
      assert.ok(knowledgeSubtopics.has(sub), `missing knowledge for ${sub}`);
    }
  });
});

describe('geometry knowledge package', () => {
  const pkg = {
    topics: readJson('topics.json'),
    knowledge: readJson('knowledge.json'),
    rules: readJson('rules.json'),
    examples: readJson('examples.json'),
    strategies: readJson('strategies.json'),
  };

  it('includes a geometry topic', () => {
    const topics = pkg.topics as { topic: string; subtopics: string[] }[];
    const geometry = topics.find((t) => t.topic === 'geometry');
    assert.ok(geometry);
    for (const sub of ['triangle', 'pythagoras', 'circle', 'area']) {
      assert.ok(geometry!.subtopics.includes(sub));
    }
  });

  it('includes Pythagoras and circle rules', () => {
    const ruleIds = (pkg.rules as { topic: string; ruleId: string }[])
      .filter((r) => r.topic === 'geometry')
      .map((r) => r.ruleId);
    assert.ok(ruleIds.includes('right_triangle_pythagoras'));
    assert.ok(ruleIds.includes('circle_pi_measures'));
  });
});
