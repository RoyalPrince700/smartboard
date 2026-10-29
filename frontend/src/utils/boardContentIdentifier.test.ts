import { describe, expect, it } from 'vitest';
import { identifyBoardContent } from './boardContentIdentifier';
import type { BoardGeometryCapture } from './boardGeometryCapture';
import type { LocalMathOcrResult } from '../services/ocr/localMathOcr';

function emptyCapture(overrides: Partial<BoardGeometryCapture> = {}): BoardGeometryCapture {
  const emptyScene = {
    points: [],
    segments: [],
    angles: [],
    labels: [],
    relations: [],
    shapes: [],
  };
  return {
    hasGeometry: false,
    shapes: [],
    heuristicShapes: [],
    opencvShapes: [],
    scene: emptyScene,
    labelStrokes: [],
    textLabels: [],
    problemText: '',
    ...overrides,
  };
}

function ocrResult(text: string, status: LocalMathOcrResult['status'] = 'ok'): LocalMathOcrResult {
  return { text, rawLatex: text, confidence: 0.9, status };
}

describe('identifyBoardContent', () => {
  it('prefers equation when OCR reads a quadratic despite incidental line segments', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('x^2 + 5x + 6 = 0'),
      geometryCapture: emptyCapture({
        hasGeometry: true,
        scene: {
          points: [],
          segments: [
            { id: 's1', p1: 'p1', p2: 'p2', length: 30, angleDeg: 0, kind: 'line' },
            { id: 's2', p1: 'p2', p2: 'p3', length: 30, angleDeg: 0, kind: 'line' },
          ],
          angles: [],
          labels: [],
          relations: [],
          shapes: [],
        },
      }),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('quadratic');
    expect(result.problemText).toBe('x^2 + 5x + 6 = 0');
  });

  it('routes typed quadratic equations to equation even with geometry capture noise', () => {
    const result = identifyBoardContent({
      typedText: 'x^2 + 5x + 6 = 0',
      geometryCapture: emptyCapture({ hasGeometry: true }),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('quadratic');
  });

  it('identifies linear equations from OCR transcription', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('2x + 3 = 7'),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('linear');
    expect(result.reason).toContain('linear');
  });

  it('identifies exponential equations from OCR transcription', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('2^x = 16'),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('exponential');
  });

  it('identifies absolute value equations from OCR transcription', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('|2x - 3| = 7'),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('absolute_value');
  });

  it('identifies simultaneous equations from OCR transcription', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('2x + y = 7; x - y = 1'),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('simultaneous');
  });

  it('identifies arithmetic expressions from OCR transcription', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: ocrResult('3 + 5 * 2 ='),
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('arithmetic');
  });

  it('fast-paths clear typed equations without geometry capture', () => {
    const result = identifyBoardContent({
      typedText: '2 * 3 + 3 = 7',
    });

    expect(result.kind).toBe('equation');
    expect(result.topic).toBe('arithmetic');
    expect(result.reason).toContain('typed arithmetic');
  });

  it('routes clear geometry prompts to geometry', () => {
    const result = identifyBoardContent({
      typedText: 'find the area of the triangle',
      geometryCapture: emptyCapture({
        shapes: [{
          id: 't1',
          strokeId: 's1',
          type: 'triangle',
          confidence: 0.82,
          bounds: { x1: 0, y1: 0, x2: 100, y2: 100 },
          measurements: [],
          labels: [],
        }],
      }),
    });

    expect(result.kind).toBe('geometry');
  });

  it('routes recognized triangle shapes to geometry when OCR is empty', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: { text: '', rawLatex: '', confidence: 0, status: 'empty' },
      geometryCapture: emptyCapture({
        shapes: [{
          id: 't1',
          strokeId: 's1',
          type: 'triangle',
          confidence: 0.78,
          bounds: { x1: 0, y1: 0, x2: 100, y2: 100 },
          measurements: [],
          labels: [],
        }],
        scene: {
          points: [],
          segments: [
            { id: 'a', p1: 'p1', p2: 'p2', length: 50, angleDeg: 0, kind: 'side' },
            { id: 'b', p1: 'p2', p2: 'p3', length: 50, angleDeg: 60, kind: 'side' },
            { id: 'c', p1: 'p3', p2: 'p1', length: 50, angleDeg: 120, kind: 'side' },
          ],
          angles: [],
          labels: [],
          relations: [],
          shapes: [{
            id: 't1',
            type: 'triangle',
            confidence: 0.78,
            vertices: [{ id: 'p1', x: 0, y: 0 }, { id: 'p2', x: 50, y: 0 }, { id: 'p3', x: 25, y: 40 }],
            edges: [],
          }],
        },
      }),
    });

    expect(result.kind).toBe('geometry');
  });

  it('does not treat two line segments alone as geometry', () => {
    const result = identifyBoardContent({
      typedText: '',
      ocrResult: { text: '', rawLatex: '', confidence: 0, status: 'empty' },
      geometryCapture: emptyCapture({
        hasGeometry: true,
        scene: {
          points: [],
          segments: [
            { id: 's1', p1: 'p1', p2: 'p2', length: 40, angleDeg: 0, kind: 'line' },
            { id: 's2', p1: 'p2', p2: 'p3', length: 40, angleDeg: 90, kind: 'line' },
          ],
          angles: [],
          labels: [],
          relations: [],
          shapes: [],
        },
      }),
    });

    expect(result.kind).toBe('unknown');
  });
});
