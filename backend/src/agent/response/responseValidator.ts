/**
 * Validates TutorResponse structure before sending to frontend.
 * Ensures typed blocks with no presentation HTML in backend output.
 */

import { AGENT_INTENTS } from '../core/intentEngine';
import { TutorResponse } from '../schemas/response.schema';
import {
  RESPONSE_BLOCK_TYPES,
  ResponseBlock,
  ResponseStatus,
  NextAction,
} from './responseTypes';

export class ResponseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseValidationError';
  }
}

const HTML_PATTERN = /<\/?[a-z][\s\S]*?>/i;

const VALID_STATUSES: ResponseStatus[] = [
  'ok',
  'partial',
  'error',
  'unsupported',
  'not_implemented',
];

const VALID_NEXT_ACTIONS: NextAction[] = [
  'await_input',
  'await_student_step',
  'await_answer',
  'await_verification',
  'await_problem',
  'session_complete',
];

export function containsHtml(text: string): boolean {
  return HTML_PATTERN.test(text);
}

export function validateResponseBlock(block: ResponseBlock, index = 0): void {
  const prefix = `blocks[${index}]`;

  if (!RESPONSE_BLOCK_TYPES.includes(block.type)) {
    throw new ResponseValidationError(`${prefix}: invalid block type "${block.type}"`);
  }

  const textFields: string[] = [];

  switch (block.type) {
    case 'explanation':
      if (!block.content?.trim()) {
        throw new ResponseValidationError(`${prefix}: explanation requires content`);
      }
      textFields.push(block.content);
      break;
    case 'formula':
      if (!block.expression?.trim()) {
        throw new ResponseValidationError(`${prefix}: formula requires expression`);
      }
      textFields.push(block.expression);
      break;
    case 'calculation':
      if (!block.expression?.trim()) {
        throw new ResponseValidationError(`${prefix}: calculation requires expression`);
      }
      textFields.push(block.expression);
      if (block.label) textFields.push(block.label);
      break;
    case 'question':
      if (!block.prompt?.trim()) {
        throw new ResponseValidationError(`${prefix}: question requires prompt`);
      }
      textFields.push(block.prompt);
      break;
    case 'hint':
      if (!block.content?.trim()) {
        throw new ResponseValidationError(`${prefix}: hint requires content`);
      }
      textFields.push(block.content);
      break;
    case 'answer':
      if (!block.value?.trim()) {
        throw new ResponseValidationError(`${prefix}: answer requires value`);
      }
      textFields.push(block.value);
      break;
    case 'verification':
      if (!['correct', 'incorrect', 'partial'].includes(block.status)) {
        throw new ResponseValidationError(`${prefix}: invalid verification status`);
      }
      if (block.feedback) textFields.push(block.feedback);
      break;
    case 'example':
      if (!block.question?.trim()) {
        throw new ResponseValidationError(`${prefix}: example requires question`);
      }
      textFields.push(block.question);
      if (block.content) textFields.push(block.content);
      break;
    case 'callout':
      if (!block.content?.trim()) {
        throw new ResponseValidationError(`${prefix}: callout requires content`);
      }
      textFields.push(block.content);
      break;
    case 'diagram':
      if (!block.spec || typeof block.spec !== 'object') {
        throw new ResponseValidationError(`${prefix}: diagram requires spec object`);
      }
      break;
  }

  for (const text of textFields) {
    if (containsHtml(text)) {
      throw new ResponseValidationError(
        `${prefix}: block content must not contain HTML (found in ${block.type})`
      );
    }
  }
}

export function validateTutorResponse(response: TutorResponse): void {
  if (!response.sessionId) {
    throw new ResponseValidationError('sessionId is required');
  }
  if (!AGENT_INTENTS.includes(response.intent)) {
    throw new ResponseValidationError(`Invalid intent: ${response.intent}`);
  }
  if (!VALID_STATUSES.includes(response.status)) {
    throw new ResponseValidationError(`Invalid status: ${response.status}`);
  }
  if (!Array.isArray(response.blocks)) {
    throw new ResponseValidationError('blocks must be an array');
  }
  if (response.blocks.length === 0) {
    throw new ResponseValidationError('blocks must not be empty');
  }
  for (let i = 0; i < response.blocks.length; i++) {
    validateResponseBlock(response.blocks[i], i);
  }
  if (!response.nextAction) {
    throw new ResponseValidationError('nextAction is required');
  }
  if (!VALID_NEXT_ACTIONS.includes(response.nextAction)) {
    throw new ResponseValidationError(`Invalid nextAction: ${response.nextAction}`);
  }
}

/** Serialize to JSON-safe object (for API responses and tests) */
export function serializeTutorResponse(response: TutorResponse): Record<string, unknown> {
  validateTutorResponse(response);
  return JSON.parse(JSON.stringify(response)) as Record<string, unknown>;
}
