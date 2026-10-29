import type { Stroke } from '../../types/stroke';
import type { GeometryScene, OpenCVDebugSnapshot, RecognizedShape } from '../../types/geometry';
import { recognizeBoardShapes } from './shapeRecognizer';
import { recognizeBoardShapesOpenCV } from './opencv/opencvShapeRecognizer';
import { fuseRecognizedShapes } from './recognitionFusion';
import { buildEnrichedGeometryScene } from './geometrySceneFromRecognition';
import { buildGeometryScene, segmentGeometryStrokes } from './sceneBuilder';
import { isOpenCVReady, loadOpenCV } from './opencv/opencvLoader';

export interface GeometryRecognitionResult {
  shapes: RecognizedShape[];
  heuristicShapes: RecognizedShape[];
  opencvShapes: RecognizedShape[];
  scene: GeometryScene;
  debug?: OpenCVDebugSnapshot;
}

export function isGeometryDebugEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_GEOMETRY_DEBUG === 'true';
}

export async function recognizeBoardGeometry(
  strokes: Stroke[],
  recognizedLabelText = '',
  options?: { collectDebug?: boolean }
): Promise<GeometryRecognitionResult> {
  const heuristicShapes = recognizeBoardShapes(strokes);
  const collectDebug = options?.collectDebug ?? isGeometryDebugEnabled();

  await loadOpenCV();
  const opencvResult = isOpenCVReady()
    ? await recognizeBoardShapesOpenCV(strokes, { collectDebug })
    : { shapes: [] as RecognizedShape[], debug: undefined };

  const fusion = fuseRecognizedShapes(heuristicShapes, opencvResult.shapes);
  const scene = buildEnrichedGeometryScene(strokes, fusion.shapes, recognizedLabelText, {
    ...fusion.meta,
    opencv: fusion.meta.opencv
      ? { ...fusion.meta.opencv, available: isOpenCVReady() }
      : { type: 'unknown', confidence: 0, available: isOpenCVReady() },
  });

  const debug = opencvResult.debug
    ? {
        ...opencvResult.debug,
        fusedShapes: fusion.shapes,
        scene,
      }
    : collectDebug
      ? {
          contourCount: 0,
          recognizedShapes: opencvResult.shapes,
          fusedShapes: fusion.shapes,
          scene,
        }
      : undefined;

  return {
    shapes: fusion.shapes,
    heuristicShapes,
    opencvShapes: opencvResult.shapes,
    scene,
    debug,
  };
}

export function recognizeBoardGeometrySync(strokes: Stroke[], recognizedLabelText = ''): GeometryRecognitionResult {
  const heuristicShapes = recognizeBoardShapes(strokes);
  const scene = buildEnrichedGeometryScene(strokes, heuristicShapes, recognizedLabelText);
  return {
    shapes: heuristicShapes,
    heuristicShapes,
    opencvShapes: [],
    scene,
  };
}

export { segmentGeometryStrokes, buildGeometryScene };
