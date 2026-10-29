import type {
  InferenceEngine,
  RecognitionResult,
  Stroke as InkStroke,
  Vocab,
} from 'ink-on/core';
import * as ort from 'onnxruntime-web';
import type { Stroke as BoardStroke } from '../../types/stroke';
import { normalizeOcrMath } from '../../utils/mathOcrNormalization';
import { classifyEquationInput } from '../../utils/equationClassifier';
import { labelFromOcrOrStroke } from '../../engine/geometry/geometryLabelOcr';
import { strokePoints } from '../../engine/geometry/strokeRoles';

const MODEL_BASE = '/models/math-ocr';
const ORT_BASE = '/ort';

type InkCore = typeof import('ink-on/core');

export interface LocalMathOcrResult {
  text: string;
  rawLatex: string;
  confidence: number;
  status: 'ok' | 'low_confidence' | 'empty' | 'unavailable' | 'error';
  message?: string;
  timingMs?: number;
}

let corePromise: Promise<InkCore> | null = null;
let enginePromise: Promise<{
  core: InkCore;
  engine: InferenceEngine;
  vocab: Vocab;
}> | null = null;
let ortConfigured = false;

function configureOnnxRuntime(): void {
  if (ortConfigured) return;

  // Vite dev can otherwise resolve ORT wasm to index.html, which breaks WebAssembly.
  ort.env.wasm.wasmPaths = {
    wasm: `${ORT_BASE}/ort-wasm-simd-threaded.jsep.wasm`,
  };
  ort.env.wasm.numThreads = 1;
  ortConfigured = true;
}

function loadCore(): Promise<InkCore> {
  configureOnnxRuntime();
  corePromise ??= import('ink-on/core');
  return corePromise;
}

function estimateDeviceBeamWidth(): number {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  if (memory <= 2 || cores <= 2) return 1;
  if (cores <= 4) return 2;
  return 3;
}

async function getRecognizer() {
  enginePromise ??= (async () => {
    const core = await loadCore();
    const vocab = await core.loadVocab(`${MODEL_BASE}/vocab.json`);
    const engine = new core.InferenceEngine({
      encoderUrl: `${MODEL_BASE}/encoder_int8.onnx`,
      decoderUrl: `${MODEL_BASE}/decoder_int8.onnx`,
      beamWidth: estimateDeviceBeamWidth(),
      executionProvider: 'wasm',
    });

    await engine.init();
    return { core, engine, vocab };
  })();

  return enginePromise;
}

export function hasPenHandwriting(strokes: BoardStroke[]): boolean {
  return strokes.some(
    (stroke) =>
      (stroke.tool === 'pen' || stroke.tool === 'highlighter') &&
      stroke.points.length >= 2 &&
      stroke.finished
  );
}

function toInkStrokes(strokes: BoardStroke[]): InkStroke[] {
  return strokes
    .filter((stroke) => stroke.tool === 'pen' || stroke.tool === 'highlighter')
    .filter((stroke) => stroke.points.length >= 2)
    .map((stroke) => ({
      lineWidth: Math.max(2, stroke.width),
      points: stroke.points.map((point) => ({ x: point.x, y: point.y })),
    }));
}

function confidenceFromResult(result: RecognitionResult, text: string): number {
  if (!text.trim()) return 0;

  const classification = classifyEquationInput(text);
  let confidence = 0.45;

  if (classification.topic) {
    confidence = 0.55 + classification.confidence * 0.35;
  } else if (text.includes('=')) {
    confidence += 0.15;
  }

  if (/^[0-9a-zA-Z+\-*/=^().\s|]+$/.test(text)) confidence += 0.05;
  if (result.tokenIds.length > 0) confidence += 0.05;

  return Math.min(confidence, 0.95);
}

function ocrStatusFromClassification(
  text: string,
  confidence: number
): 'ok' | 'low_confidence' {
  const classification = classifyEquationInput(text);
  const hasTopic = Boolean(classification.topic);
  const threshold = hasTopic ? 0.72 : 0.75;
  return classification.isEquation && confidence >= threshold ? 'ok' : 'low_confidence';
}

function confidenceFromLabel(text: string): number {
  if (!text.trim()) return 0;
  let confidence = 0.4;
  if (/\d/.test(text)) confidence += 0.25;
  if (/\b(cm|mm|m|°)\b/i.test(text)) confidence += 0.15;
  if (text.length <= 24) confidence += 0.1;
  return Math.min(confidence, 0.9);
}

export async function recognizeMathFromStrokes(
  strokes: BoardStroke[]
): Promise<LocalMathOcrResult> {
  const inkStrokes = toInkStrokes(strokes);
  if (inkStrokes.length === 0) {
    return {
      text: '',
      rawLatex: '',
      confidence: 0,
      status: 'empty',
      message: 'No pen handwriting found on the board.',
    };
  }

  try {
    const { core, engine, vocab } = await getRecognizer();
    if (!core.isStrokeMeaningful(inkStrokes)) {
      return {
        text: '',
        rawLatex: '',
        confidence: 0,
        status: 'empty',
        message: 'The handwriting is too small or too short to recognize.',
      };
    }

    const input = core.preprocessStrokes(inkStrokes);
    const result = await engine.recognize(input, vocab, 'expression');
    const normalized = normalizeOcrMath(result.latex);
    const confidence = confidenceFromResult(result, normalized.text);
    const status = ocrStatusFromClassification(normalized.text, confidence);

    return {
      text: normalized.text,
      rawLatex: result.latex,
      confidence,
      status,
      timingMs: result.totalMs,
      message:
        status === 'ok'
          ? undefined
          : 'I could not confidently read a complete equation from the handwriting.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Local OCR failed';
    return {
      text: '',
      rawLatex: '',
      confidence: 0,
      status: message.includes('404') ? 'unavailable' : 'error',
      message,
    };
  }
}

export async function recognizeGeometryLabels(
  strokes: BoardStroke[]
): Promise<LocalMathOcrResult> {
  const inkStrokes = toInkStrokes(strokes);
  if (inkStrokes.length === 0) {
    return {
      text: '',
      rawLatex: '',
      confidence: 0,
      status: 'empty',
      message: 'No handwritten labels found beside the shape.',
    };
  }

  try {
    const { core, engine, vocab } = await getRecognizer();
    if (!core.isStrokeMeaningful(inkStrokes)) {
      return {
        text: '',
        rawLatex: '',
        confidence: 0,
        status: 'empty',
        message: 'The labels next to the shape are too small to read.',
      };
    }

    const input = core.preprocessStrokes(inkStrokes);
    const result = await engine.recognize(input, vocab, 'expression');
    const normalized = normalizeOcrMath(result.latex);
    const text = normalized.text;
    const confidence = confidenceFromLabel(text);
    const status = /\d/.test(text) && confidence >= 0.55 ? 'ok' : 'low_confidence';

    return {
      text,
      rawLatex: result.latex,
      confidence,
      status,
      timingMs: result.totalMs,
      message:
        status === 'ok'
          ? undefined
          : 'I could not confidently read the lengths written next to the shape.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Local OCR failed';
    return {
      text: '',
      rawLatex: '',
      confidence: 0,
      status: message.includes('404') ? 'unavailable' : 'error',
      message,
    };
  }
}

export interface PerStrokeLabelResult {
  strokeId: string;
  text: string;
  confidence: number;
  source?: 'ocr' | 'digit-guess';
}

/** OCR each label stroke individually so side lengths map to the correct edge. */
export async function recognizeGeometryLabelsPerStroke(
  strokes: BoardStroke[]
): Promise<PerStrokeLabelResult[]> {
  const labelStrokes = strokes.filter(
    (stroke) =>
      (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'text') &&
      stroke.points.length >= 2
  );

  if (labelStrokes.length === 0) return [];

  const results: PerStrokeLabelResult[] = [];

  try {
    const { core, engine, vocab } = await getRecognizer();

    for (const stroke of labelStrokes) {
      const inkStrokes = toInkStrokes([stroke]);
      const points = strokePoints(stroke);

      if (!core.isStrokeMeaningful(inkStrokes)) {
        const guessed = labelFromOcrOrStroke('', points);
        if (guessed) {
          results.push({
            strokeId: stroke.id,
            text: guessed.text,
            confidence: guessed.confidence,
            source: guessed.source,
          });
        }
        continue;
      }

      const input = core.preprocessStrokes(inkStrokes);
      const result = await engine.recognize(input, vocab, 'expression');
      const normalized = normalizeOcrMath(result.latex);
      const recovered = labelFromOcrOrStroke(normalized.text, points);
      if (!recovered?.text) continue;

      results.push({
        strokeId: stroke.id,
        text: recovered.text,
        confidence: recovered.confidence,
        source: recovered.source,
      });
    }

    if (results.length > 0) return results;
  } catch {
    // Fall through to batch OCR below
  }

  const batch = await recognizeGeometryLabels(labelStrokes);
  if (!batch.text.trim()) {
    return recoverDigitsWithoutOcr(labelStrokes);
  }

  const parsed = [...batch.text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);
  if (parsed.length === 0) {
    return recoverDigitsWithoutOcr(labelStrokes);
  }

  if (parsed.length === 1 && parsed[0].length > 1 && parsed[0].length === labelStrokes.length) {
    return labelStrokes.map((stroke, index) => ({
      strokeId: stroke.id,
      text: parsed[0][index] ?? parsed[0],
      confidence: batch.confidence,
    }));
  }

  return labelStrokes.map((stroke, index) => ({
    strokeId: stroke.id,
    text: parsed[index] ?? parsed[parsed.length - 1],
    confidence: batch.confidence,
  }));
}

function recoverDigitsWithoutOcr(strokes: BoardStroke[]): PerStrokeLabelResult[] {
  const results: PerStrokeLabelResult[] = [];
  for (const stroke of strokes) {
    const recovered = labelFromOcrOrStroke('', strokePoints(stroke));
    if (!recovered) continue;
    results.push({
      strokeId: stroke.id,
      text: recovered.text,
      confidence: recovered.confidence,
      source: recovered.source,
    });
  }
  return results;
}
