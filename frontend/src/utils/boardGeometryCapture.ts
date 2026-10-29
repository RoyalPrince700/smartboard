import type { Stroke } from '../types/stroke';
import type { GeometryScene, OpenCVDebugSnapshot, RecognizedShape } from '../types/geometry';
import { hasRecognizedGeometry } from '../engine/geometry/shapeRecognizer';
import {
  recognizeBoardGeometry,
  recognizeBoardGeometrySync,
  segmentGeometryStrokes,
} from '../engine/geometry/geometryRecognitionService';
import { sceneToAgentPayload } from '../engine/geometry/geometrySceneFromRecognition';
import { extractTextFromStrokes } from './strokeImageExport';
import { isUsefulGeometryLabel } from '../engine/geometry/geometryLabelOcr';

export interface BoardGeometryCapture {
  hasGeometry: boolean;
  shapes: RecognizedShape[];
  heuristicShapes: RecognizedShape[];
  opencvShapes: RecognizedShape[];
  scene: GeometryScene;
  labelStrokes: Stroke[];
  textLabels: string[];
  problemText: string;
  agentPayload?: ReturnType<typeof sceneToAgentPayload>;
  debug?: OpenCVDebugSnapshot;
}

function extractNumbers(text: string): number[] {
  return [...text.matchAll(/([0-9]+(?:\.[0-9]+)?)/g)]
    .map((match) => Number(match[1]))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function detectUnit(text: string): string {
  const match = /\b(cm|mm|m)\b/i.exec(text);
  return match?.[1]?.toLowerCase() ?? 'cm';
}

function detectFind(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('hypotenuse')) return 'hypotenuse';
  if (lower.includes('circumference')) return 'circumference';
  if (lower.includes('perimeter') || lower.includes('perimetre')) return 'perimeter';
  if (lower.includes('area')) return 'area';
  return undefined;
}

export function isGeneratedBoardPrompt(text: string): boolean {
  return /^\s*\[(?:geometry|trigonometry)\]/i.test(text);
}

const TRIG_ANGLE_LABEL = /(?:\btheta\b|θ|φ|α|beta|γ)/i;

export function isTrigonometryDiagram(
  shapes: RecognizedShape[],
  labels: string[],
  scene?: GeometryScene,
  extraText = ''
): boolean {
  const combined = [...labels, extraText].filter(Boolean).join(' ');
  if (/\[trigonometry\]/i.test(combined)) return true;
  if (/\b(?:sin|cos|tan)\b/i.test(combined)) return true;

  const shape = primaryShape(shapes);
  const isTriangle =
    shape?.type === 'triangle' ||
    /shape\s*=\s*triangle/i.test(combined) ||
    (scene?.segments.length ?? 0) === 3;
  if (!isTriangle) return false;

  const numbers = extractNumbers(combined);
  const unknownAngleCount =
    scene?.relations.filter((relation) => relation.type === 'unknownAngle').length ?? 0;
  const hasTrigAngleLabel = TRIG_ANGLE_LABEL.test(combined);
  const wantsUnknownAngle =
    /find\s*=\s*unknown_angle/i.test(combined) ||
    unknownAngleCount > 0 ||
    hasTrigAngleLabel;

  return numbers.length >= 2 && wantsUnknownAngle && !detectFind(combined);
}

export function buildTrigonometryProblemText(
  shapes: RecognizedShape[],
  labels: string[],
  extraText = '',
  scene?: GeometryScene
): string {
  const combined = [...labels, extraText].filter(Boolean).join(' ');
  const shape = primaryShape(shapes);
  const numbers = extractNumbers(combined);
  const unit = detectUnit(combined);
  const parts = ['[trigonometry]'];
  const unknownAngleCount =
    scene?.relations.filter((relation) => relation.type === 'unknownAngle').length ?? 0;
  const angleLabel = TRIG_ANGLE_LABEL.exec(combined)?.[0] ?? 'θ';

  if (shape) parts.push(`shape=${shape.type}`);
  else if (scene?.segments.length) parts.push('shape=triangle');
  if (numbers.length) parts.push(`values=${numbers.join(',')}`);
  if (unknownAngleCount) parts.push(`unknownAngles=${unknownAngleCount}`);
  parts.push('find=unknown_angle');
  parts.push(`angleLabel=${angleLabel}`);
  if (unit) parts.push(`unit=${unit}`);
  const usefulLabels = labels.filter((label) => isUsefulGeometryLabel(label));
  if (usefulLabels.length) parts.push(`labels=${usefulLabels.join('; ')}`);
  if (extraText.trim()) parts.push(extraText.trim());
  appendSceneSummary(parts, scene);

  return parts.join(' ');
}

function primaryShape(shapes: RecognizedShape[]): RecognizedShape | undefined {
  return [...shapes]
    .filter((shape) => shape.type !== 'freehand' && shape.type !== 'unknown' && shape.type !== 'line')
    .sort((a, b) => b.confidence - a.confidence)[0];
}

function appendSceneSummary(parts: string[], scene?: GeometryScene): void {
  if (!scene?.shapes?.length) return;
  const primary = scene.shapes[0];
  if (primary.vertices.length >= 3) {
    const coords = primary.vertices.map((v) => `${Math.round(v.x)},${Math.round(v.y)}`).join(';');
    parts.push(`vertices=${coords}`);
  }
  if (scene.recognition?.fused) {
    parts.push(`confidence=${scene.recognition.fused.confidence}`);
  }
}

export function buildGeometryProblemText(
  shapes: RecognizedShape[],
  labels: string[],
  extraText = '',
  scene?: GeometryScene
): string {
  const combined = [...labels, extraText].filter(Boolean).join(' ');
  const shape = primaryShape(shapes);
  const numbers = extractNumbers(combined);
  const unit = detectUnit(combined);
  const find = detectFind(combined);
  const parts = ['[geometry]'];
  const angleValues = [
    ...labels.flatMap((label) =>
      [...label.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*°/g)].map((match) => Number(match[1]))
    ),
    ...(scene?.angles
      .filter((angle) => angle.valueDeg !== undefined && Math.abs((angle.valueDeg ?? 0) - 90) <= 12)
      .map(() => 90) ?? []),
  ];
  const unknownAngleCount =
    scene?.relations.filter((relation) => relation.type === 'unknownAngle').length ?? 0;
  const parallelPairs =
    scene?.relations.filter((relation) => relation.type === 'parallel').length ?? 0;
  const equalLengthPairs =
    scene?.relations.filter((relation) => relation.type === 'equalLength').length ?? 0;

  if (shape) parts.push(`shape=${shape.type}`);
  if (!shape && scene?.segments.length) parts.push('shape=angle_diagram');
  if (numbers.length) parts.push(`values=${numbers.join(',')}`);
  if (angleValues.length) parts.push(`angles=${[...new Set(angleValues)].join(',')}`);
  if (unknownAngleCount) parts.push(`unknownAngles=${unknownAngleCount}`);
  if (parallelPairs) parts.push(`parallelPairs=${parallelPairs}`);
  if (equalLengthPairs) parts.push(`equalLengthPairs=${equalLengthPairs}`);
  if (unit) parts.push(`unit=${unit}`);
  if (find) parts.push(`find=${find}`);
  else if (unknownAngleCount) parts.push('find=unknown_angle');
  const usefulLabels = labels.filter((label) => isUsefulGeometryLabel(label));
  if (usefulLabels.length) parts.push(`labels=${usefulLabels.join('; ')}`);
  if (extraText.trim()) parts.push(extraText.trim());
  appendSceneSummary(parts, scene);

  return parts.join(' ');
}

function buildCapture(
  strokes: Stroke[],
  recognition: Awaited<ReturnType<typeof recognizeBoardGeometry>>,
  extraText: string
): BoardGeometryCapture {
  const textLabels = extractTextFromStrokes(strokes);
  const hasGeometry =
    hasRecognizedGeometry(recognition.shapes) ||
    /\[geometry\]/i.test(extraText);

  const labels = textLabels ? [textLabels] : [];
  const problemText = buildGeometryProblemText(recognition.shapes, labels, extraText, recognition.scene);

  return {
    hasGeometry,
    shapes: recognition.shapes,
    heuristicShapes: recognition.heuristicShapes,
    opencvShapes: recognition.opencvShapes,
    scene: recognition.scene,
    labelStrokes: segmentGeometryStrokes(strokes).labelStrokes,
    textLabels: labels,
    problemText,
    agentPayload: sceneToAgentPayload(recognition.scene),
    debug: recognition.debug,
  };
}

export function captureBoardGeometry(strokes: Stroke[], extraText = ''): BoardGeometryCapture {
  const recognition = recognizeBoardGeometrySync(strokes, extractTextFromStrokes(strokes));
  return buildCapture(strokes, recognition, extraText);
}

export async function captureBoardGeometryAsync(
  strokes: Stroke[],
  extraText = '',
  options?: { collectDebug?: boolean }
): Promise<BoardGeometryCapture> {
  const textLabels = extractTextFromStrokes(strokes);
  const recognition = await recognizeBoardGeometry(strokes, textLabels, options);
  return buildCapture(strokes, recognition, extraText);
}
