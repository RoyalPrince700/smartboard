/**
 * Base deterministic intent patterns ordered by priority.
 */

import { IntentPattern } from './types';

export const BASE_INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'CONTINUE',
    priority: 100,
    patterns: [/^(continue|next|go on|proceed|yes|ok(ay)?|sure|yep|yeah)\.?$/i],
    keywords: ['continue', 'next', 'proceed'],
    requiresActiveProblem: true,
    baseConfidence: 0.92,
  },
  {
    intent: 'GO_BACK',
    priority: 95,
    patterns: [/^(go back|previous step|previous|back up)\.?$/i, /^back\.?$/i],
    keywords: ['go back', 'previous'],
    requiresActiveProblem: true,
    baseConfidence: 0.88,
  },
  {
    intent: 'SUBMIT_ANSWER',
    priority: 90,
    patterns: [
      /\b(x|y)\s*=\s*[-+]?\d/,
      /^x\s*=\s*[-+]?\d+\s*(,|or|\band\b)\s*x\s*=\s*[-+]?\d+/i,
      /^[-+]?\d+(\.\d+)?\s*(,|or|\band\b)\s*[-+]?\d+/,
      /^roots?\s*(are|:)\s*[-+]?\d/i,
    ],
    requiresActiveProblem: true,
    baseConfidence: 0.85,
  },
  {
    intent: 'CHECK_ANSWER',
    priority: 88,
    patterns: [
      /\b(check|verify)\b.*\b(answer|correct|right)\b/i,
      /\bis (this|my answer|it) (correct|right)\b/i,
    ],
    keywords: ['check my answer', 'is this correct'],
    baseConfidence: 0.85,
  },
  {
    intent: 'REQUEST_HINT',
    priority: 85,
    patterns: [/\b(give me a )?hint\b/i, /\bclue\b/i, /\bhelp me (with|on)\b/i],
    keywords: ['hint'],
    requiresActiveProblem: true,
    baseConfidence: 0.88,
  },
  {
    intent: 'ASK_ALTERNATIVE_METHOD',
    priority: 80,
    patterns: [
      /\banother (way|method|approach)\b/i,
      /\bcan i use\b/i,
      /\balternative (way|method)\b/i,
      /\b(use|try) factori(s|z)(e|ation)\b/i,
    ],
    keywords: ['another way', 'alternative'],
    requiresActiveProblem: true,
    baseConfidence: 0.82,
  },
  {
    intent: 'REPEAT',
    priority: 75,
    patterns: [/^(repeat|again|say that again|one more time)\.?$/i],
    keywords: ['repeat', 'again'],
    baseConfidence: 0.86,
  },
  {
    intent: 'REQUEST_SIMPLER_EXPLANATION',
    priority: 70,
    patterns: [
      /\b(i )?(don'?t|do not) understand\b/i,
      /\b(simpler|easier|explain (it )?(more )?simply)\b/i,
      /\btoo (hard|difficult|complex|confusing)\b/i,
      /\bcan you simplify\b/i,
    ],
    keywords: ['confused', 'simpler', "don't understand"],
    baseConfidence: 0.84,
  },
  {
    intent: 'ASK_WHY',
    priority: 65,
    patterns: [/\bwhy\b/i, /\bhow come\b/i],
    keywords: ['why'],
    baseConfidence: 0.8,
  },
  {
    intent: 'ASK_HOW',
    priority: 60,
    patterns: [/\bhow (do|can|should|would|did)\b/i, /\bhow to\b/i],
    keywords: ['how do', 'how to'],
    baseConfidence: 0.75,
  },
  {
    intent: 'ASK_DEFINITION',
    priority: 55,
    patterns: [
      /\bwhat is\b/i,
      /\bwhat are\b/i,
      /\bwhat does\b/i,
      /\bdefine\b/i,
      /\bmeaning of\b/i,
    ],
    keywords: ['define', 'definition', 'what is'],
    baseConfidence: 0.78,
  },
  {
    intent: 'ASK_EXPLANATION',
    priority: 50,
    patterns: [/\bexplain\b/i, /\btell me about\b/i, /\bhelp me understand\b/i],
    keywords: ['explain'],
    baseConfidence: 0.72,
  },
  {
    intent: 'REQUEST_EXAMPLE',
    priority: 45,
    patterns: [/\b(example|show me an example|worked example)\b/i, /\bshow me how\b/i],
    keywords: ['example'],
    baseConfidence: 0.78,
  },
  {
    intent: 'REQUEST_PRACTICE',
    priority: 40,
    patterns: [
      /\b(practice|another question|give me (a )?(question|problem))\b/i,
      /\bmore (questions|problems)\b/i,
      /\banother (one|problem|question)\b/i,
    ],
    keywords: ['practice', 'another question'],
    baseConfidence: 0.82,
  },
  {
    intent: 'CHANGE_TOPIC',
    priority: 35,
    patterns: [
      /\b(change topic|switch to|let'?s (do|study|learn))\b/i,
      /\bmove on to\b/i,
    ],
    keywords: ['change topic', 'switch to'],
    baseConfidence: 0.75,
  },
  {
    intent: 'START_PROBLEM',
    priority: 30,
    patterns: [
      /\bsolve\b/i,
      /\bcalculate\b/i,
      /\bfind\b.*\b(x|y|roots?|area|perimeter|perimetre|hypotenuse|circumference)\b/i,
      /[=²^]/,
      /\d+\s*x\s*\^?\s*2/i,
      /x\s*\^?\s*2\s*[+\-]/i,
      /\[geometry\]/i,
      /\b(triangle|rectangle|circle|square)\b/i,
      /\bpythagoras\b/i,
    ],
    keywords: ['solve'],
    requiresNoActiveProblem: true,
    baseConfidence: 0.7,
  },
];

/** Patterns sorted highest priority first */
export const SORTED_INTENT_PATTERNS = [...BASE_INTENT_PATTERNS].sort(
  (a, b) => b.priority - a.priority
);
