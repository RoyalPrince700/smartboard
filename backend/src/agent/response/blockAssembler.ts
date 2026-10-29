/**
 * Assembles typed ResponseBlocks from knowledge, reasoning, and teaching context.
 * Pure formatting — no calculations.
 */

import { AgentContext } from '../core/agentContext';
import { KnowledgeDocument } from '../knowledge/knowledgeLoader';
import { ReasoningStep } from '../schemas/reasoning.schema';
import { ResponseBlock } from './responseTypes';
import { buildPlaceholderMap, resolvePlaceholders } from './placeholderResolver';
import { getSocraticPrompt } from '../teaching';
import { stateManager } from '../conversation/stateManager';
import { diagramEngine } from '../../services/geometry/DiagramEngine';

export function assembleCoefficientBlock(context: AgentContext): ResponseBlock | null {
  const data = context.reasoningTrace.recognizedData;
  if (!data) return null;

  if (data.shapeType) {
    const parts: string[] = [`Shape: ${data.shapeType}`];
    if (data.sides && Array.isArray(data.sides) && data.sides.length) {
      parts.push(`sides = ${(data.sides as number[]).join(', ')}`);
    }
    if (data.base !== undefined) parts.push(`base = ${data.base}`);
    if (data.height !== undefined) parts.push(`height = ${data.height}`);
    if (data.length !== undefined) parts.push(`length = ${data.length}`);
    if (data.width !== undefined) parts.push(`width = ${data.width}`);
    if (data.radius !== undefined) parts.push(`radius = ${data.radius}`);
    if (data.unit) parts.push(`unit = ${data.unit}`);
    return {
      type: 'explanation',
      title: 'Given values',
      content: parts.join(', '),
    };
  }

  if (data.a === undefined && data.b === undefined && data.c === undefined) return null;

  return {
    type: 'explanation',
    title: 'Coefficients',
    content: `a = ${data.a}, b = ${data.b}, c = ${data.c}`,
  };
}

export function assembleDiagramBlock(context: AgentContext): ResponseBlock | null {
  const spec = diagramEngine.generateFromRecognizedData(context.reasoningTrace.recognizedData);
  if (!spec) return null;

  return {
    type: 'diagram',
    title: spec.title || 'Diagram',
    spec: spec as unknown as Record<string, unknown>,
  };
}

export function assembleSocraticBlock(context: AgentContext): ResponseBlock | null {
  const stepId = context.resolvedReferences.stepId as string | undefined;
  return {
    type: 'question',
    title: 'Think about this',
    prompt: getSocraticPrompt(stepId),
  };
}

export function assembleGuidedStepBlock(context: AgentContext): ResponseBlock | null {
  const stepInfo = stateManager.getCurrentStepInfo(context.session);
  if (!stepInfo) return null;

  return {
    type: 'question',
    title: stepInfo.title,
    prompt: `Let's work on step ${stepInfo.index + 1}: ${stepInfo.title}`,
  };
}

export function assembleReasoningStepBlock(step: ReasoningStep): ResponseBlock | null {
  if (step.data?.expression) {
    return {
      type: 'calculation',
      expression: String(step.data.expression),
      label: step.description,
    };
  }
  if (step.description) {
    return {
      type: 'explanation',
      title: step.action,
      content: step.description,
    };
  }
  return null;
}

export function assembleAnswerBlock(context: AgentContext): ResponseBlock | null {
  const display = context.reasoningTrace.conclusion?.answerDisplay;
  if (!display) return null;

  return {
    type: 'answer',
    title: 'Solution',
    value: String(display),
  };
}

export function assembleVerificationBlock(context: AgentContext): ResponseBlock | null {
  const v = context.reasoningTrace.verification;
  if (!v) return null;

  const status =
    v.status === 'correct' || v.status === 'incorrect' || v.status === 'partial'
      ? v.status
      : 'partial';

  return {
    type: 'verification',
    title: 'Answer check',
    status,
    feedback: v.feedback,
    expected: v.expected !== undefined ? String(v.expected) : undefined,
    received: v.received !== undefined ? String(v.received) : undefined,
  };
}

export function knowledgeDocToBlock(doc: KnowledgeDocument, context: AgentContext): ResponseBlock[] {
  const map = buildPlaceholderMap(context);

  if (doc.contentBlocks && Array.isArray(doc.contentBlocks) && doc.contentBlocks.length > 0) {
    return (doc.contentBlocks as Array<Record<string, unknown>>)
      .map((block) => contentBlockToResponseBlock(block, doc, map))
      .filter((b): b is ResponseBlock => b !== null);
  }

  const content = resolvePlaceholders(doc.content, map);
  return [singleKnowledgeBlock(doc, content)];
}

function singleKnowledgeBlock(doc: KnowledgeDocument, content: string): ResponseBlock {
  switch (doc.knowledgeType) {
    case 'formula':
      return { type: 'formula', title: doc.title, expression: content };
    case 'hint':
      return { type: 'hint', title: doc.title, content };
    case 'misconception':
      return {
        type: 'callout',
        title: doc.title,
        content: doc.correction ? String(doc.correction) : content,
        variant: 'misconception',
      };
    case 'worked_step':
      return { type: 'example', title: doc.title, question: content };
    default:
      return { type: 'explanation', title: doc.title, content };
  }
}

function contentBlockToResponseBlock(
  block: Record<string, unknown>,
  doc: KnowledgeDocument,
  map: ReturnType<typeof buildPlaceholderMap>
): ResponseBlock | null {
  const type = String(block.type ?? 'text');
  const raw = String(block.value ?? block.expression ?? block.content ?? doc.content);
  const resolved = resolvePlaceholders(raw, map);

  switch (type) {
    case 'formula':
      return {
        type: 'formula',
        title: doc.title,
        expression: resolved,
        latex: block.latex ? String(block.latex) : undefined,
      };
    case 'calculation':
      return {
        type: 'calculation',
        expression: resolved,
        latex: block.latex ? String(block.latex) : undefined,
        label: doc.title,
      };
    case 'hint':
      return { type: 'hint', title: doc.title, content: resolved };
    case 'question':
      return { type: 'question', title: doc.title, prompt: resolved };
    case 'example':
      return { type: 'example', title: doc.title, question: resolved };
    case 'callout':
      return {
        type: 'callout',
        title: doc.title,
        content: resolved,
        variant: 'tip',
      };
    default:
      return { type: 'explanation', title: doc.title, content: resolved };
  }
}

export function assembleFallbackBlock(context: AgentContext): ResponseBlock {
  const mode = context.teachingAction?.mode;
  let content = 'Processing your request.';

  if (mode === 'HINT') content = 'Try breaking the problem into smaller steps.';
  else if (mode === 'SOCRATIC') content = 'What approach would you try first?';
  else if (mode === 'PRACTICE') content = 'Ready for a practice problem? Submit one when you are.';

  return { type: 'explanation', title: 'Tutor', content };
}

export function resolveNextAction(context: AgentContext): import('./responseTypes').NextAction {
  const intent = context.intent.intent;
  if (intent === 'START_PROBLEM' || intent === 'CONTINUE') return 'await_student_step';
  if (intent === 'REQUEST_PRACTICE') return 'await_problem';
  if (intent === 'SUBMIT_ANSWER' || intent === 'CHECK_ANSWER') return 'await_verification';
  return 'await_input';
}
