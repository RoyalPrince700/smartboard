import { describe, expect, it } from 'vitest';
import {
  mergeHearingChunk,
  normalizeMathHearingChunk,
  pickRicherTranscript,
} from './voiceHearingMerge';

describe('pickRicherTranscript', () => {
  it('keeps interim 2x when final drops to 2', () => {
    expect(pickRicherTranscript('2', '2x')).toBe('2x');
    expect(pickRicherTranscript('2', '2 x')).toBe('2x');
  });

  it('keeps final when interim is not richer', () => {
    expect(pickRicherTranscript('2x + 3', '2')).toBe('2x + 3');
  });
});

describe('mergeHearingChunk', () => {
  it('glues digit + x across a pause', () => {
    expect(mergeHearingChunk('2', 'x')).toBe('2x');
    expect(mergeHearingChunk('2', 'ex')).toBe('2x');
    expect(mergeHearingChunk('2 + 4', 'x')).toBe('2 + 4x');
  });

  it('appends normal operators', () => {
    expect(mergeHearingChunk('2x', 'plus 5')).toBe('2x + 5');
  });
});

describe('normalizeMathHearingChunk', () => {
  it('maps ex to x', () => {
    expect(normalizeMathHearingChunk('2 ex')).toBe('2 x');
  });
});
