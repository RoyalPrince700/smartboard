import type { LocalMathOcrResult } from '../services/ocr/localMathOcr';
import type { BoardGeometryCapture } from './boardGeometryCapture';
import { isTrigonometryDiagram } from './boardGeometryCapture';
import {
  classifyEquationInput,
  isClearEquationInput,
  type EquationClassification,
  type EquationTopic,
} from './equationClassifier';
import { looksLikeGeometry, looksLikeTrigonometry } from './agentRouting';

export type BoardContentKind = 'equation' | 'geometry' | 'trigonometry' | 'unknown';

export interface BoardContentIdentification {
  kind: BoardContentKind;
  topic?: EquationTopic;
  confidence: number;
  reason: string;
  /** Best text to send to the agent (OCR or typed). */
  problemText?: string;
}

export interface IdentifyBoardContentInput {
  typedText?: string;
  ocrResult?: LocalMathOcrResult | null;
  geometryCapture?: BoardGeometryCapture | null;
}

function equationTopicLabel(topic?: EquationTopic): string {
  if (!topic) return 'equation';
  return topic.replace(/_/g, ' ');
}

function isRecognizedMathEquation(classification: EquationClassification): boolean {
  return (
    classification.isMath &&
    Boolean(classification.topic) &&
    (classification.isEquation ||
      classification.topic === 'probability' ||
      classification.topic === 'arithmetic')
  );
}

function scoreEquationSignals(
  typedClass: EquationClassification | null,
  ocrClass: EquationClassification | null,
  ocr: LocalMathOcrResult | null | undefined
): number {
  let score = 0;

  if (typedClass && isRecognizedMathEquation(typedClass)) {
    score = Math.max(score, 0.95);
  }

  if (ocrClass && ocr) {
    if (isRecognizedMathEquation(ocrClass)) {
      const ocrBoost = ocr.status === 'ok' ? 0.92 : 0.78;
      score = Math.max(score, ocrBoost * Math.max(ocr.confidence, ocrClass.confidence));
    } else if (ocr.text?.includes('=') && /[a-zA-Z]/.test(ocr.text)) {
      score = Math.max(score, 0.72 * Math.max(ocr.confidence, 0.5));
    } else if (ocrClass.topic === 'arithmetic') {
      score = Math.max(score, 0.8 * Math.max(ocr.confidence, 0.55));
    }
  }

  return score;
}

function scoreGeometrySignals(
  typed: string,
  typedIsEquation: boolean,
  capture: BoardGeometryCapture | null | undefined
): number {
  let score = 0;

  if (looksLikeGeometry(typed) && !typedIsEquation) {
    score = Math.max(score, 0.94);
  }

  if (!capture) return score;

  if (/\[geometry\]/i.test(typed)) {
    score = Math.max(score, 0.93);
  }

  const shapeConfidence = capture.shapes
    .filter((shape) => shape.type !== 'freehand' && shape.type !== 'unknown' && shape.type !== 'line')
    .reduce((max, shape) => Math.max(max, shape.confidence), 0);

  if (shapeConfidence >= 0.55) {
    score = Math.max(score, 0.55 + shapeConfidence * 0.35);
  }

  const hasClosedDiagram =
    (capture.scene.shapes?.some((shape) => shape.vertices.length >= 3) ?? false) ||
    capture.scene.segments.length >= 3;
  if (hasClosedDiagram && shapeConfidence >= 0.45) {
    score = Math.max(score, 0.72);
  }

  const hasGeometryLabels = capture.textLabels.some((label) =>
    /\b(cm|mm|m|°|hypotenuse|area|perimeter|radius)\b/i.test(label)
  );
  if (hasGeometryLabels) {
    score = Math.max(score, 0.68);
  }

  return score;
}

function scoreTrigonometrySignals(
  typed: string,
  typedIsEquation: boolean,
  capture: BoardGeometryCapture | null | undefined
): number {
  let score = 0;

  if (looksLikeTrigonometry(typed) && !typedIsEquation) {
    score = Math.max(score, 0.95);
  }

  if (!capture) return score;

  const labels = capture.textLabels;
  if (isTrigonometryDiagram(capture.shapes, labels, capture.scene, typed) && !typedIsEquation) {
    score = Math.max(score, 0.88);
  }

  return score;
}

function buildEquationReason(
  _typed: string,
  ocr: LocalMathOcrResult | null | undefined,
  typedClass: EquationClassification | null,
  ocrClass: EquationClassification | null
): string {
  if (typedClass && isRecognizedMathEquation(typedClass)) {
    return `typed ${equationTopicLabel(typedClass.topic)} equation`;
  }
  if (ocr?.text && ocrClass && isRecognizedMathEquation(ocrClass)) {
    return `handwriting OCR read as ${equationTopicLabel(ocrClass.topic)} equation`;
  }
  return 'equation pattern detected';
}

/**
 * Identify whether board content is an equation, geometry diagram, or trigonometry diagram.
 * Runs after OCR and geometry capture; picks the strongest signal so equations are not
 * misrouted when pen strokes produce incidental line segments.
 */
export function identifyBoardContent(input: IdentifyBoardContentInput): BoardContentIdentification {
  const typed = (input.typedText ?? '').trim();
  const ocr = input.ocrResult;
  const capture = input.geometryCapture;
  const ocrText = ocr?.text?.trim() ?? '';

  const typedClass = typed ? classifyEquationInput(typed) : null;
  const ocrClass = ocrText ? classifyEquationInput(ocrText) : null;
  const typedIsEquation = typedClass ? isRecognizedMathEquation(typedClass) : false;

  // Fast path: typed equation is unambiguous — skip geometry/trig scoring entirely.
  if (typed && isClearEquationInput(typed) && typedClass?.topic) {
    return {
      kind: 'equation',
      topic: typedClass.topic,
      confidence: 0.95,
      reason: `typed ${equationTopicLabel(typedClass.topic)} equation`,
      problemText: typed,
    };
  }

  // Fast path: confident OCR equation when nothing typed.
  if (!typed && ocrClass && isRecognizedMathEquation(ocrClass) && ocr?.status === 'ok') {
    return {
      kind: 'equation',
      topic: ocrClass.topic,
      confidence: Math.max(0.9, ocr.confidence),
      reason: `handwriting OCR read as ${equationTopicLabel(ocrClass.topic)} equation`,
      problemText: ocrText,
    };
  }

  const equationScore = scoreEquationSignals(typedClass, ocrClass, ocr);
  const geometryScore = scoreGeometrySignals(typed, typedIsEquation, capture);
  const trigScore = scoreTrigonometrySignals(typed, typedIsEquation, capture);

  const scores: Array<{ kind: BoardContentKind; score: number; reason: string; problemText?: string }> = [
    {
      kind: 'equation',
      score: equationScore,
      reason: buildEquationReason(typed, ocr, typedClass, ocrClass),
      problemText: typedIsEquation ? typed : ocrText || typed || undefined,
    },
    {
      kind: 'trigonometry',
      score: trigScore,
      reason: looksLikeTrigonometry(typed) ? 'typed trigonometry prompt' : 'trigonometry diagram detected',
      problemText: typed || undefined,
    },
    {
      kind: 'geometry',
      score: geometryScore,
      reason: looksLikeGeometry(typed) ? 'typed geometry prompt' : 'geometry diagram detected',
      problemText: typed || undefined,
    },
  ];

  const ranked = [...scores].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const runnerUp = ranked[1];

  const MIN_CONFIDENCE = 0.55;
  if (!winner || winner.score < MIN_CONFIDENCE) {
    return {
      kind: 'unknown',
      confidence: winner?.score ?? 0,
      reason: 'no confident board content type',
      problemText: ocrText || typed || undefined,
    };
  }

  const kind =
    equationScore >= MIN_CONFIDENCE &&
    equationScore >= geometryScore - 0.08 &&
    equationScore >= trigScore - 0.08
      ? 'equation'
      : trigScore >= geometryScore && trigScore >= MIN_CONFIDENCE
        ? 'trigonometry'
        : geometryScore >= MIN_CONFIDENCE && geometryScore > equationScore
          ? 'geometry'
          : winner.kind;

  const chosen = scores.find((entry) => entry.kind === kind) ?? winner;
  const topicSource = chosen.problemText ?? typed;
  const classification = topicSource
    ? topicSource === typed
      ? typedClass ?? classifyEquationInput(topicSource)
      : ocrClass ?? classifyEquationInput(topicSource)
    : undefined;

  return {
    kind,
    topic: classification?.topic,
    confidence: chosen.score,
    reason:
      kind === 'equation' && runnerUp && runnerUp.score >= MIN_CONFIDENCE
        ? `${chosen.reason} (over geometry/trig score ${runnerUp.score.toFixed(2)})`
        : chosen.reason,
    problemText: chosen.problemText,
  };
}
