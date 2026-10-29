import type { SolveResponse } from '../types/math';
import { formatSolvedArithmeticDisplay } from './voiceMathParser';

export function formatLessonQuestion(input: {
  solution: SolveResponse | null;
  agentProblemEquation: string | null;
  historyRawInput?: string;
  inputText: string;
}): string {
  const questionFallback =
    input.agentProblemEquation ||
    input.historyRawInput ||
    input.inputText.trim() ||
    'Let’s explore this together';
  const { solution } = input;

  if (solution?.problemType === 'arithmetic' && solution.answer) {
    return formatSolvedArithmeticDisplay(
      solution.recognizedInput || solution.equation || questionFallback,
      solution.answer
    );
  }

  return solution?.recognizedInput || solution?.equation || questionFallback;
}
