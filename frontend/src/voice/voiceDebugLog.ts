import { VoiceDebugEvent } from './types';

const MAX_EVENTS = 120;

export function createVoiceDebugLog() {
  let events: VoiceDebugEvent[] = [];
  let seq = 0;

  const push = (event: Omit<VoiceDebugEvent, 't'> & { t?: number }): VoiceDebugEvent => {
    const entry: VoiceDebugEvent = {
      ...event,
      t: event.t ?? Date.now(),
    };
    seq += 1;
    events = [...events, entry].slice(-MAX_EVENTS);
    return entry;
  };

  return {
    push,
    clear() {
      events = [];
      seq = 0;
    },
    snapshot(): VoiceDebugEvent[] {
      return [...events];
    },
    get size() {
      return seq;
    },
  };
}

export function formatVoiceDebugEvent(event: VoiceDebugEvent): string {
  const parts = [
    event.type,
    `session=${event.sessionId}`,
    event.resultIndex !== undefined ? `idx=${event.resultIndex}` : '',
    event.isFinal !== undefined ? `final=${event.isFinal}` : '',
    event.rawResult ? `raw="${event.rawResult}"` : '',
    event.interimText ? `interim="${event.interimText}"` : '',
    event.finalText ? `final="${event.finalText}"` : '',
    event.normalizedTokens ? `tokens=[${event.normalizedTokens.join(' ')}]` : '',
    event.currentSegment ? `segment="${event.currentSegment}"` : '',
    event.persistentBufferBefore ? `before="${event.persistentBufferBefore}"` : '',
    event.persistentBufferAfter ? `after="${event.persistentBufferAfter}"` : '',
    event.detectedIntent ? `intent=${event.detectedIntent}` : '',
    event.commandConfidence !== undefined ? `conf=${event.commandConfidence}` : '',
    event.parserResult ? `parser="${event.parserResult}"` : '',
    event.detail ?? '',
  ].filter(Boolean);

  return parts.join(' | ');
}

export function isVoiceMathDebugEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === 'undefined') return true;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('voiceDebug') === '0') return false;
    if (window.localStorage.getItem('voiceDebug') === '0') return false;
    return true;
  } catch {
    return true;
  }
}
