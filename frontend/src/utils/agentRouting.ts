import { classifyEquationInput, looksLikeProbability } from './equationClassifier';
import { EducationLevel } from '../types/ai';

export function isAgentFeatureEnabled(): boolean {
  return import.meta.env.VITE_USE_AGENT === 'true';
}

export function looksLikeGeometry(input: string): boolean {
  const text = input.toLowerCase();
  return /\[geometry\]|\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b|\bhypotenuse\b|\bpythagoras\b|\bpythagorean\b|\bperimeter\b|\bperimetre\b|\bcircumference\b|\bradius\b|\bdiameter\b|\bright[-\s]?angl|\barea of\b/.test(
    text
  );
}

export function looksLikeTrigonometry(input: string): boolean {
  const text = input.toLowerCase();
  return (
    /\[trigonometry\]/i.test(input) ||
    /(?:θ|theta)/i.test(input) ||
    /\b(?:sin|sine|cos|cosine|tan|tangent|trigonometry)\b/.test(text) ||
    (/\bshape\s*=\s*triangle\b/i.test(input) &&
      /\bfind\s*=\s*unknown_angle\b/i.test(input) &&
      /\bvalues\s*=/i.test(input)) ||
    /(?:^|[^a-z])(?:sin|cos|tan)(?=\d|\()/i.test(text)
  );
}

export function looksLikeProbabilityInput(input: string): boolean {
  return looksLikeProbability(input);
}

export function shouldRouteToAgent(input: string, agentEnabled: boolean): boolean {
  if (!agentEnabled || !isAgentFeatureEnabled()) return false;
  const text = input.toLowerCase();
  const classification = classifyEquationInput(input);
  if (classification.topic) return true;
  return (
    looksLikeGeometry(text) ||
    looksLikeTrigonometry(text) ||
    looksLikeProbability(input) ||
    /[=^²]|(solve|equation|x\^|x²|quadratic|linear|exponential|simultaneous|absolute|arithmetic|probability|trigonometry|sine|cosine|tangent|\bsin\b|\bcos\b|\btan\b)|y\s*=/.test(text) ||
    /\|[^|]+\|/.test(input) ||
    /(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(input) ||
    /continue|hint|why is|what is|explain/.test(text)
  );
}

export function mapEducationToAgentDifficulty(
  level: EducationLevel
): 'beginner' | 'intermediate' | 'advanced' {
  if (level === 'university') return 'advanced';
  if (level === 'senior_secondary') return 'intermediate';
  return 'beginner';
}

export function tutorActionToAgentMessage(action: string): string | null {
  const map: Record<string, string> = {
    'explain-more': 'Explain more about this step',
    simplify: 'Explain that simpler',
    'give-example': 'Give me a worked example',
    'quiz-me': 'Quiz me on this topic',
  };
  return map[action] ?? null;
}
