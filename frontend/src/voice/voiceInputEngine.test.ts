import { describe, expect, it } from 'vitest';
import { RecognitionResultItem, RecognitionResultPayload } from './types';
import { createVoiceInputEngine } from './voiceInputEngine';

function alt(transcript: string, confidence = 0.9): RecognitionResultItem['alternatives'][number] {
  return { transcript, confidence };
}

function item(isFinal: boolean, transcript: string, extra: string[] = []): RecognitionResultItem {
  return {
    isFinal,
    alternatives: [alt(transcript), ...extra.map((text) => alt(text, 0.4))],
  };
}

function payload(
  sessionId: number,
  resultIndex: number,
  results: RecognitionResultItem[]
): RecognitionResultPayload {
  return { sessionId, resultIndex, results };
}

function speakPaused(engine: ReturnType<typeof createVoiceInputEngine>, phrases: string[]) {
  engine.startListening();
  phrases.forEach((phrase, index) => {
    const sessionId = index + 1;
    engine.beginSession(sessionId);
    engine.handleResult(payload(sessionId, 0, [item(true, phrase)]));
    engine.handleSessionEnd(sessionId);
  });
}

describe('voice input engine — teacher dictation', () => {
  it('TEST 1: continuous "2x minus 5 equals x plus 2"', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    expect(engine.getState().parsedEquation).toBe('2x - 5 = x + 2');
  });

  it('TEST 2: paused digits, variable, minus, five', () => {
    const engine = createVoiceInputEngine();
    speakPaused(engine, ['2', 'x', 'minus', '5']);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
  });

  it('TEST 3: two / pause / x', () => {
    const engine = createVoiceInputEngine();
    speakPaused(engine, ['two', 'x']);
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('TEST 4: two ex', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, 'two ex')]));
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('TEST 5: 2x, long pause, minus, pause, 5', () => {
    const engine = createVoiceInputEngine();
    speakPaused(engine, ['2x', 'minus', '5']);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
  });

  it('TEST 6: confirmed solve executes once', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(true, 'solve')]));
    expect(engine.getState().parsedEquation).toBe('2x - 5 = x + 2');
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('TEST 7: interim "so" does not solve', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, 'so')]));
    expect(commands).toEqual([]);
    expect(engine.getState().parsedEquation).toBe('');
  });

  it('TEST 8: finalized "sol" is accepted as solve', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(true, 'sol')]));
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('TEST 9: interim "solv" does not solve; final "solv" does', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(false, 'solv')]));
    expect(commands).toEqual([]);
    engine.handleResult(payload(2, 0, [item(true, 'solv')]));
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('TEST 10: interim solv then final solve executes exactly once', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(false, 'solv')]));
    expect(commands).toEqual([]);
    engine.handleResult(payload(2, 0, [item(true, 'solve')]));
    engine.handleResult(payload(2, 0, [item(true, 'solve')]));
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('TEST 11: interim 2x then weaker final 2 keeps 2x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2x')]));
    expect(engine.getDisplayEquation()).toBe('2x');
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    expect(engine.getState().parsedEquation).toBe('2x');
    expect(engine.getDisplayEquation()).toBe('2x');
  });

  it('TEST 12: buffer survives recognition session end', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5')]));
    engine.handleSessionEnd(1);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
    expect(engine.getDisplayEquation()).toBe('2x - 5');
    engine.markRestarting();
    engine.beginSession(2);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
    expect(engine.getDisplayEquation()).toBe('2x - 5');
  });

  it('TEST 13: multiple restarts never drop characters', () => {
    const engine = createVoiceInputEngine();
    speakPaused(engine, ['2', 'x', 'minus', '5', 'equals', 'x', 'plus', '2']);
    expect(engine.getState().parsedEquation).toBe('2x - 5 = x + 2');
  });

  it('TEST 14: repeated interim results do not duplicate tokens', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2x')]));
    engine.handleResult(payload(1, 0, [item(false, '2x')]));
    engine.handleResult(payload(1, 0, [item(false, '2x')]));
    engine.handleResult(payload(1, 0, [item(true, '2x')]));
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('TEST 15: recognition error then restart keeps buffer', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5')]));
    engine.handleError(1, 'network');
    engine.handleSessionEnd(1);
    engine.markRestarting();
    engine.beginSession(2);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
  });

  it('keeps math and confirms solve when both arrive in one utterance', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2 solve')]));
    expect(engine.getState().parsedEquation).toBe('2x - 5 = x + 2');
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('TEST 16: pause before confirmed solve keeps the equation', () => {
    const commands: string[] = [];
    const engine = createVoiceInputEngine({
      onConfirmedIntent: (intent) => commands.push(intent.type),
    });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x minus 5 equals x plus 2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleSessionEnd(2);
    engine.beginSession(3);
    expect(engine.getState().parsedEquation).toBe('2x - 5 = x + 2');
    engine.handleResult(payload(3, 0, [item(true, 'solve')]));
    expect(commands).toEqual(['SOLVE_COMMAND']);
  });

  it('debug log records session 1 = 2 then session 2 = 2x', () => {
    const engine = createVoiceInputEngine({ debug: true });
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2')]));
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(false, 'x')]));

    expect(engine.getDisplayEquation()).toBe('2x');
    const events = engine.getDebugEvents();
    expect(events.some((event) => event.type === 'SESSION_START' && event.sessionId === 1)).toBe(true);
    expect(events.some((event) => event.type === 'SESSION_END' && event.sessionId === 1)).toBe(true);
    expect(events.some((event) => event.sessionId === 1 && event.persistentBufferAfter === '2')).toBe(true);
    expect(events.some((event) => event.type === 'SESSION_START' && event.sessionId === 2)).toBe(true);
    expect(events.some((event) => event.sessionId === 2 && event.interimText === 'x')).toBe(true);
  });

  it('drops stale results from a previous session', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    engine.beginSession(2);
    engine.handleResult(payload(1, 0, [item(true, 'should not overwrite')]));
    expect(engine.getState().parsedEquation).toBe('2');
  });

  it('prefers 2x when buffer is 2 and alternatives are 2 / x / 2x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult({
      sessionId: 2,
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          alternatives: [alt('2', 0.9), alt('x', 0.6), alt('2x', 0.5)],
        },
      ],
    });
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('slow speech: Chrome replaces interim 2 with x in the same result slot → 2x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2')]));
    engine.handleResult(payload(1, 0, [item(false, 'x')]));
    expect(engine.getDisplayEquation()).toBe('2x');
    engine.handleSpeechPause(1);
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('slow speech: same slot finalizes 2 then later finalizes x → 2x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    engine.handleResult(payload(1, 0, [item(true, 'x')]));
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('slow speech: pause after 2 then minus then 5 in the same slot', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2x')]));
    engine.handleSpeechPause(1);
    engine.handleResult(payload(1, 0, [item(false, 'minus')]));
    engine.handleSpeechPause(1);
    engine.handleResult(payload(1, 0, [item(false, '5')]));
    engine.handleSpeechPause(1);
    expect(engine.getState().parsedEquation).toBe('2x - 5');
  });

  it('slow speech: speech pause locks 2 before a new session says x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(false, '2')]));
    engine.handleSpeechPause(1);
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(false, 'x')]));
    expect(engine.getDisplayEquation()).toBe('2x');
  });

  it('accepts misheard x after a digit (s / ex / ecs)', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(true, 's')]));
    expect(engine.getState().parsedEquation).toBe('2x');
  });

  it('prefers minus over nine when Chrome offers both after a term', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult({
      sessionId: 2,
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          alternatives: [alt('nine', 0.9), alt('minus', 0.5)],
        },
      ],
    });
    expect(engine.getState().parsedEquation).toBe('2x -');
  });

  it('does not turn equals fragments into x or e after 2x', () => {
    const engine = createVoiceInputEngine();
    engine.startListening();
    engine.beginSession(1);
    engine.handleResult(payload(1, 0, [item(true, '2x')]));
    engine.handleSessionEnd(1);
    engine.beginSession(2);
    engine.handleResult(payload(2, 0, [item(true, 'e')]));
    engine.handleSessionEnd(2);
    expect(engine.getState().parsedEquation).toBe('2x');

    engine.beginSession(3);
    engine.handleResult(payload(3, 0, [item(true, 'es')]));
    engine.handleSessionEnd(3);
    expect(engine.getState().parsedEquation).toBe('2x');

    engine.beginSession(4);
    engine.handleResult({
      sessionId: 4,
      resultIndex: 0,
      results: [
        {
          isFinal: true,
          alternatives: [alt('x', 0.9), alt('e', 0.8), alt('equals', 0.4)],
        },
      ],
    });
    expect(engine.getState().parsedEquation).toBe('2x =');
  });
});
