/**
 * Educational Agent — public module exports.
 */

export * from './core';
export * from './schemas';
export * from './response';
export * from './knowledge';
export * from './conversation';
export * from './reasoning';
export * from './types';
export { subjectRegistry, registerBuiltinSubjects } from './subjects/registry';
export { topicRegistry } from './subjects/topicRegistry';
export { registerAgentModels, importAgentSchemas } from './registerModels';
export { intentRegistry, detectIntent } from './intent';
