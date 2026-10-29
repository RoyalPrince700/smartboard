import { describe, expect, it } from 'vitest';
import { classifyVoiceIntent } from './voiceIntentDetector';

describe('voice intent detector', () => {
  it('does not confirm so/sol/solv until the result is final', () => {
    for (const fragment of ['so', 'sol', 'solv']) {
      const interim = classifyVoiceIntent(fragment, { isFinal: false });
      expect(interim.confirmed).toBe(false);
      expect(interim.type).toBe('SOLVE_COMMAND');
    }
  });

  it('accepts finalized so/sol/solv as solve', () => {
    for (const fragment of ['so', 'sol', 'solv', 'solve']) {
      const confirmed = classifyVoiceIntent(fragment, { isFinal: true, confidence: 0.9 });
      expect(confirmed.type).toBe('SOLVE_COMMAND');
      expect(confirmed.confirmed).toBe(true);
    }
  });

  it('confirms solve only when final and exact', () => {
    const interim = classifyVoiceIntent('solve', { isFinal: false, confidence: 0.9 });
    expect(interim.type).toBe('SOLVE_COMMAND');
    expect(interim.confirmed).toBe(false);

    const confirmed = classifyVoiceIntent('solve', { isFinal: true, confidence: 0.9 });
    expect(confirmed.type).toBe('SOLVE_COMMAND');
    expect(confirmed.confirmed).toBe(true);
  });

  it('separates trailing solve from equation content', () => {
    const intent = classifyVoiceIntent('2x minus 5 equals x plus 2 solve', {
      isFinal: true,
      confidence: 0.9,
    });
    expect(intent.type).toBe('SOLVE_COMMAND');
    expect(intent.confirmed).toBe(true);
    expect(intent.mathText).toContain('2x');
  });

  it('treats trailing so/sol as a finalized solve command', () => {
    const intent = classifyVoiceIntent('2x minus 5 sol', { isFinal: true, confidence: 0.9 });
    expect(intent.type).toBe('SOLVE_COMMAND');
    expect(intent.confirmed).toBe(true);
  });
});
