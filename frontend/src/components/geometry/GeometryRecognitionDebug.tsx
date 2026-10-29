import { useAIStore } from '../../stores/aiStore';
import { isGeometryDebugEnabled } from '../../engine/geometry/geometryRecognitionService';
import { DiagramPreview } from '../math/DiagramPreview';
import { generateDiagramFromScene } from '../../engine/diagram/sceneDiagram';

export function GeometryRecognitionDebug() {
  const debug = useAIStore((s) => s.geometryDebug);

  if (!isGeometryDebugEnabled() || !debug) return null;

  const finalDiagram = debug.scene ? generateDiagramFromScene(debug.scene, 'Final SVG') : null;

  return (
    <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-amber-900">Geometry recognition debug</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1 font-medium">OpenCV mask / detection overlay</p>
          {debug.maskDataUrl ? (
            <img src={debug.maskDataUrl} alt="OpenCV detection overlay" className="max-h-40 rounded border bg-black" />
          ) : (
            <p className="text-slate-500">No OpenCV mask (OpenCV unavailable or no geometry strokes)</p>
          )}
        </div>
        <div>
          <p className="mb-1 font-medium">Recognition summary</p>
          <ul className="space-y-1">
            <li>Contours: {debug.contourCount}</li>
            <li>Lines detected: {debug.lines?.length ?? 0}</li>
            <li>Circles detected: {debug.circles?.length ?? 0}</li>
            <li>OpenCV shapes: {debug.recognizedShapes.map((s) => `${s.type} (${s.confidence})`).join(', ') || 'none'}</li>
            <li>Fused shapes: {debug.fusedShapes.map((s) => `${s.type} (${s.confidence})`).join(', ') || 'none'}</li>
          </ul>
          {debug.scene?.recognition ? (
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-white p-2 text-[10px]">
              {JSON.stringify(debug.scene.recognition, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
      {finalDiagram ? (
        <div className="mt-4">
          <p className="mb-1 font-medium">Final SVG from Geometry Scene</p>
          <DiagramPreview diagram={finalDiagram} hideTitle />
        </div>
      ) : null}
      {debug.scene ? (
        <details className="mt-3">
          <summary className="cursor-pointer font-medium">Geometry Scene JSON</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded bg-white p-2 text-[10px]">
            {JSON.stringify(debug.scene, null, 2)}
          </pre>
        </details>
      ) : null}
    </section>
  );
}
