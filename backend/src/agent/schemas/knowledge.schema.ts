/**
 * MongoDB schemas and TypeScript types for agent knowledge collections.
 * Collections: agentKnowledge, agentRules, agentExamples, agentStrategies, agentTopics
 */

import { Schema, model, Document } from 'mongoose';
import { AgentIntent } from '../core/intentEngine';
import { DifficultyLevel, KnowledgeType, RuleAction, RuleCondition } from '../types';

// ─── Content blocks (embedded in knowledge documents) ─────────────────────────

export interface ContentBlock {
  type: 'text' | 'formula' | 'calculation' | 'hint' | 'question' | 'example' | 'callout';
  value?: string;
  expression?: string;
  latex?: string;
}

// ─── agentKnowledge ───────────────────────────────────────────────────────────

export interface IAgentKnowledge extends Document {
  subject: string;
  topic: string;
  subtopic?: string;
  knowledgeType: KnowledgeType;
  difficulty: DifficultyLevel;
  title: string;
  content: string;
  contentBlocks?: ContentBlock[];
  tags: string[];
  intents: AgentIntent[];
  prerequisites: string[];
  relatedIds: string[];
  correction?: string;
  triggerPatterns?: string[];
  language: string;
  style?: string;
  version: number;
  active: boolean;
}

const ContentBlockSchema = new Schema<ContentBlock>(
  {
    type: { type: String, required: true },
    value: String,
    expression: String,
    latex: String,
  },
  { _id: false }
);

const AgentKnowledgeSchema = new Schema<IAgentKnowledge>(
  {
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    subtopic: String,
    knowledgeType: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    contentBlocks: [ContentBlockSchema],
    tags: { type: [String], default: [] },
    intents: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    relatedIds: { type: [String], default: [] },
    correction: String,
    triggerPatterns: [String],
    language: { type: String, default: 'en' },
    style: String,
    version: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agentKnowledge' }
);

AgentKnowledgeSchema.index({ subject: 1, topic: 1, knowledgeType: 1, active: 1 });
AgentKnowledgeSchema.index({ subject: 1, topic: 1, active: 1 });
AgentKnowledgeSchema.index({ subject: 1, topic: 1, intents: 1 });

export const AgentKnowledge = model<IAgentKnowledge>('AgentKnowledge', AgentKnowledgeSchema);

// ─── agentRules ───────────────────────────────────────────────────────────────

export interface IAgentRule extends Document {
  subject: string;
  topic: string;
  ruleId: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  description: string;
  active: boolean;
}

const RuleConditionSchema = new Schema<RuleCondition>(
  { field: String, operator: String, value: Schema.Types.Mixed },
  { _id: false }
);

const RuleActionSchema = new Schema<RuleAction>(
  { type: String, field: String, value: Schema.Types.Mixed },
  { _id: false }
);

const AgentRuleSchema = new Schema<IAgentRule>(
  {
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    ruleId: { type: String, required: true },
    priority: { type: Number, default: 0 },
    conditions: [RuleConditionSchema],
    actions: [RuleActionSchema],
    description: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agentRules' }
);

AgentRuleSchema.index({ subject: 1, topic: 1, active: 1 });
AgentRuleSchema.index({ subject: 1, topic: 1, ruleId: 1 }, { unique: true });

export const AgentRule = model<IAgentRule>('AgentRule', AgentRuleSchema);

// ─── agentExamples ────────────────────────────────────────────────────────────

export interface ExampleReasoningStep {
  step: number;
  title: string;
  description: string;
  conceptRefs?: string[];
  calculations?: string[];
}

export interface IAgentExample extends Document {
  subject: string;
  topic: string;
  exampleId: string;
  title: string;
  question: string;
  classification: Record<string, unknown>;
  method: string;
  reasoningSteps: ExampleReasoningStep[];
  answer: Record<string, unknown>;
  verification: Record<string, unknown>;
  teachingNotes: string[];
  commonMistakes: string[];
  difficulty: DifficultyLevel;
  tags: string[];
  active: boolean;
}

const ExampleStepSchema = new Schema<ExampleReasoningStep>(
  {
    step: Number,
    title: String,
    description: String,
    conceptRefs: [String],
    calculations: [String],
  },
  { _id: false }
);

const AgentExampleSchema = new Schema<IAgentExample>(
  {
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    exampleId: { type: String, required: true },
    title: String,
    question: { type: String, required: true },
    classification: { type: Schema.Types.Mixed, default: {} },
    method: String,
    reasoningSteps: [ExampleStepSchema],
    answer: { type: Schema.Types.Mixed, default: {} },
    verification: { type: Schema.Types.Mixed, default: {} },
    teachingNotes: { type: [String], default: [] },
    commonMistakes: { type: [String], default: [] },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agentExamples' }
);

AgentExampleSchema.index({ subject: 1, topic: 1, active: 1 });
AgentExampleSchema.index({ subject: 1, topic: 1, exampleId: 1 }, { unique: true });

export const AgentExample = model<IAgentExample>('AgentExample', AgentExampleSchema);

// ─── agentStrategies ──────────────────────────────────────────────────────────

export interface IAgentStrategy extends Document {
  subject: string;
  topic: string;
  strategyId: string;
  priority: number;
  conditions: RuleCondition[];
  method: string;
  fallback?: string;
  description: string;
  active: boolean;
}

const AgentStrategySchema = new Schema<IAgentStrategy>(
  {
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true, index: true },
    strategyId: { type: String, required: true },
    priority: { type: Number, default: 0 },
    conditions: [RuleConditionSchema],
    method: { type: String, required: true },
    fallback: String,
    description: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agentStrategies' }
);

AgentStrategySchema.index({ subject: 1, topic: 1, active: 1 });
AgentStrategySchema.index({ subject: 1, topic: 1, strategyId: 1 }, { unique: true });

export const AgentStrategy = model<IAgentStrategy>('AgentStrategy', AgentStrategySchema);

// ─── agentTopics ──────────────────────────────────────────────────────────────

export interface IAgentTopic extends Document {
  subject: string;
  topic: string;
  label: string;
  description?: string;
  subtopics: string[];
  prerequisites: string[];
  supportedIntents: AgentIntent[];
  supportedMethods: string[];
  active: boolean;
}

const AgentTopicSchema = new Schema<IAgentTopic>(
  {
    subject: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    label: { type: String, required: true },
    description: String,
    subtopics: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    supportedIntents: { type: [String], default: [] },
    supportedMethods: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'agentTopics' }
);

AgentTopicSchema.index({ subject: 1, topic: 1 }, { unique: true });
AgentTopicSchema.index({ subject: 1, active: 1 });

export const AgentTopic = model<IAgentTopic>('AgentTopic', AgentTopicSchema);
