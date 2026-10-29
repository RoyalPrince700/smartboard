/**
 * Validates knowledge package documents before MongoDB import.
 */

import { AGENT_INTENTS, AgentIntent } from '../core/intentEngine';
import { DIFFICULTY_LEVELS, KNOWLEDGE_TYPES } from './knowledgeTypes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface KnowledgeImportDocument {
  subject: string;
  topic: string;
  knowledgeType: string;
  title: string;
  content: string;
  difficulty?: string;
  intents?: string[];
  [key: string]: unknown;
}

export interface TopicImportDocument {
  subject: string;
  topic: string;
  label: string;
  subtopics?: string[];
  supportedIntents?: string[];
  [key: string]: unknown;
}

export interface RuleImportDocument {
  subject: string;
  topic: string;
  ruleId: string;
  conditions: unknown[];
  actions: unknown[];
  [key: string]: unknown;
}

export interface ExampleImportDocument {
  subject: string;
  topic: string;
  exampleId: string;
  question: string;
  reasoningSteps: unknown[];
  answer: unknown;
  verification: unknown;
  [key: string]: unknown;
}

export interface StrategyImportDocument {
  subject: string;
  topic: string;
  strategyId: string;
  method: string;
  conditions?: unknown[];
  [key: string]: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateIntent(value: string, path: string, errors: string[]): void {
  if (!AGENT_INTENTS.includes(value as AgentIntent)) {
    errors.push(`${path}: invalid intent "${value}"`);
  }
}

export function validateKnowledgeDocument(doc: unknown, index = 0): ValidationResult {
  const errors: string[] = [];
  const prefix = `knowledge[${index}]`;

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${prefix}: must be an object`] };
  }

  const d = doc as KnowledgeImportDocument;

  if (!isNonEmptyString(d.subject)) errors.push(`${prefix}: subject is required`);
  if (!isNonEmptyString(d.topic)) errors.push(`${prefix}: topic is required`);
  if (!isNonEmptyString(d.knowledgeType)) {
    errors.push(`${prefix}: knowledgeType is required`);
  } else if (!KNOWLEDGE_TYPES.includes(d.knowledgeType as (typeof KNOWLEDGE_TYPES)[number])) {
    errors.push(`${prefix}: unknown knowledgeType "${d.knowledgeType}"`);
  }
  if (!isNonEmptyString(d.title)) errors.push(`${prefix}: title is required`);
  if (!isNonEmptyString(d.content)) errors.push(`${prefix}: content is required`);

  if (d.difficulty && !DIFFICULTY_LEVELS.includes(d.difficulty as (typeof DIFFICULTY_LEVELS)[number])) {
    errors.push(`${prefix}: invalid difficulty "${d.difficulty}"`);
  }

  if (d.intents) {
    if (!Array.isArray(d.intents)) {
      errors.push(`${prefix}: intents must be an array`);
    } else {
      d.intents.forEach((intent, i) => validateIntent(intent, `${prefix}.intents[${i}]`, errors));
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTopicDocument(doc: unknown, index = 0): ValidationResult {
  const errors: string[] = [];
  const prefix = `topic[${index}]`;

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${prefix}: must be an object`] };
  }

  const d = doc as TopicImportDocument;

  if (!isNonEmptyString(d.subject)) errors.push(`${prefix}: subject is required`);
  if (!isNonEmptyString(d.topic)) errors.push(`${prefix}: topic is required`);
  if (!isNonEmptyString(d.label)) errors.push(`${prefix}: label is required`);

  if (d.supportedIntents && Array.isArray(d.supportedIntents)) {
    d.supportedIntents.forEach((intent, i) =>
      validateIntent(intent, `${prefix}.supportedIntents[${i}]`, errors)
    );
  }

  return { valid: errors.length === 0, errors };
}

export function validateRuleDocument(doc: unknown, index = 0): ValidationResult {
  const errors: string[] = [];
  const prefix = `rule[${index}]`;

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${prefix}: must be an object`] };
  }

  const d = doc as RuleImportDocument;

  if (!isNonEmptyString(d.subject)) errors.push(`${prefix}: subject is required`);
  if (!isNonEmptyString(d.topic)) errors.push(`${prefix}: topic is required`);
  if (!isNonEmptyString(d.ruleId)) errors.push(`${prefix}: ruleId is required`);
  if (!Array.isArray(d.conditions)) errors.push(`${prefix}: conditions must be an array`);
  if (!Array.isArray(d.actions)) errors.push(`${prefix}: actions must be an array`);

  return { valid: errors.length === 0, errors };
}

export function validateExampleDocument(doc: unknown, index = 0): ValidationResult {
  const errors: string[] = [];
  const prefix = `example[${index}]`;

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${prefix}: must be an object`] };
  }

  const d = doc as ExampleImportDocument;

  if (!isNonEmptyString(d.subject)) errors.push(`${prefix}: subject is required`);
  if (!isNonEmptyString(d.topic)) errors.push(`${prefix}: topic is required`);
  if (!isNonEmptyString(d.exampleId)) errors.push(`${prefix}: exampleId is required`);
  if (!isNonEmptyString(d.question)) errors.push(`${prefix}: question is required`);
  if (!Array.isArray(d.reasoningSteps)) errors.push(`${prefix}: reasoningSteps must be an array`);
  if (d.answer === undefined || d.answer === null) errors.push(`${prefix}: answer is required`);
  if (d.verification === undefined || d.verification === null) {
    errors.push(`${prefix}: verification is required`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateStrategyDocument(doc: unknown, index = 0): ValidationResult {
  const errors: string[] = [];
  const prefix = `strategy[${index}]`;

  if (!doc || typeof doc !== 'object') {
    return { valid: false, errors: [`${prefix}: must be an object`] };
  }

  const d = doc as StrategyImportDocument;

  if (!isNonEmptyString(d.subject)) errors.push(`${prefix}: subject is required`);
  if (!isNonEmptyString(d.topic)) errors.push(`${prefix}: topic is required`);
  if (!isNonEmptyString(d.strategyId)) errors.push(`${prefix}: strategyId is required`);
  if (!isNonEmptyString(d.method)) errors.push(`${prefix}: method is required`);

  return { valid: errors.length === 0, errors };
}

export function validateKnowledgeBatch(docs: unknown[]): ValidationResult {
  const allErrors: string[] = [];
  docs.forEach((doc, i) => {
    const result = validateKnowledgeDocument(doc, i);
    allErrors.push(...result.errors);
  });
  return { valid: allErrors.length === 0, errors: allErrors };
}

export function validateImportPackage(pkg: {
  topics?: unknown[];
  knowledge?: unknown[];
  rules?: unknown[];
  examples?: unknown[];
  strategies?: unknown[];
}): ValidationResult {
  const allErrors: string[] = [];

  pkg.topics?.forEach((doc, i) => allErrors.push(...validateTopicDocument(doc, i).errors));
  pkg.knowledge?.forEach((doc, i) => allErrors.push(...validateKnowledgeDocument(doc, i).errors));
  pkg.rules?.forEach((doc, i) => allErrors.push(...validateRuleDocument(doc, i).errors));
  pkg.examples?.forEach((doc, i) => allErrors.push(...validateExampleDocument(doc, i).errors));
  pkg.strategies?.forEach((doc, i) => allErrors.push(...validateStrategyDocument(doc, i).errors));

  return { valid: allErrors.length === 0, errors: allErrors };
}
