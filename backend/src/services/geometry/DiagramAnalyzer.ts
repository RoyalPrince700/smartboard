import { AIContext } from '../../types/ai';
import { DiagramAnalysis, DiagramSpec, RecognizedShape } from '../../types/geometry';
import { GraphSpec } from '../../types/math';
import { Stroke } from '../../types/stroke';
import { aiService } from '../ai/AIService';
import { extractGraphExpression } from '../math/EquationParser';
import { mathEngine } from '../math/MathEngine';
import { diagramEngine } from './DiagramEngine';
import { geometryRecognizer } from './GeometryRecognizer';
import { geometrySceneBuilder } from './GeometrySceneBuilder';

export class DiagramAnalyzer {
  analyze(
    strokes: Stroke[],
    options?: { text?: string; generateDiagram?: boolean; context?: AIContext }
  ): DiagramAnalysis {
    const shapes = geometryRecognizer.recognize(strokes);
    const { textAnnotations, parsedMeasurements } = geometryRecognizer.extractAnnotations(strokes);
    const combinedText = [options?.text, ...textAnnotations].filter(Boolean).join(' ');
    const scene = geometrySceneBuilder.build(strokes, combinedText ? [combinedText] : []);

    const allMeasurements = [
      ...parsedMeasurements,
      ...shapes.flatMap((s) => s.measurements),
    ];

    let diagram: DiagramSpec | undefined;
    let graph: GraphSpec | undefined;

    if (options?.generateDiagram !== false) {
      if (combinedText) {
        diagram = diagramEngine.generateFromTopic(combinedText) ?? undefined;
        const graphExpr = extractGraphExpression(combinedText);
        if (graphExpr) {
          graph = mathEngine.visualize(graphExpr);
        }
      }

      if (!diagram && scene.segments.length > 0) {
        diagram = diagramEngine.generateFromScene(scene) ?? undefined;
      }

      if (!diagram && shapes.length > 0) {
        diagram = diagramEngine.generateFromShapes(
          'Board Geometry Analysis',
          shapes.length
        );
        this.annotateDiagramWithShapes(diagram, shapes);
      }
    }

    const summary = this.buildSummary(shapes, textAnnotations, combinedText);

    return {
      shapes,
      scene,
      recognizedLabels: shapes.flatMap((s) => s.labels),
      textAnnotations,
      measurements: allMeasurements,
      diagram,
      graph,
      summary,
    };
  }

  private annotateDiagramWithShapes(diagram: DiagramSpec, shapes: RecognizedShape[]): void {
    let offsetX = 80;
    for (const shape of shapes.slice(0, 4)) {
      if (!shape.bounds) continue;
      const w = Math.abs(shape.bounds.x2 - shape.bounds.x1);
      const h = Math.abs(shape.bounds.y2 - shape.bounds.y1);
      const scale = Math.min(80 / Math.max(w, 1), 80 / Math.max(h, 1), 1);

      diagram.elements.push({
        type: shape.type === 'circle' ? 'circle' : shape.type === 'line' ? 'line' : 'rectangle',
        x1: offsetX,
        y1: 150,
        x2: offsetX + w * scale,
        y2: 150 + h * scale,
        cx: offsetX + (w * scale) / 2,
        cy: 150 + (h * scale) / 2,
        radius: (Math.min(w, h) * scale) / 2,
        color: '#e94560',
        label: shape.type,
      });

      if (shape.measurements[0]) {
        diagram.elements.push({
          type: 'label',
          x1: offsetX,
          y1: 150 + h * scale + 15,
          text: `${shape.type}: ${shape.measurements[0].value}`,
          color: '#666',
        });
      }

      offsetX += 120;
    }
  }

  private buildSummary(
    shapes: RecognizedShape[],
    annotations: string[],
    text: string
  ): string {
    const parts: string[] = [];

    if (shapes.length > 0) {
      const types = [...new Set(shapes.map((s) => s.type))];
      parts.push(`Detected ${shapes.length} shape(s): ${types.join(', ')}`);
    }

    if (annotations.length > 0) {
      parts.push(`Labels: ${annotations.join('; ')}`);
    }

    if (text && !parts.length) {
      parts.push(`Analyzed board content: "${text.slice(0, 80)}"`);
    }

    if (!parts.length) {
      return 'No recognizable geometry or diagrams found. Draw shapes or add labels on the board.';
    }

    return parts.join('. ') + '.';
  }

  async enrichWithAI(analysis: DiagramAnalysis, context?: AIContext): Promise<DiagramAnalysis> {
    const provider = aiService.getProvider();
    if (provider.name === 'mock') {
      analysis.explanation =
        analysis.shapes.length > 0
          ? `This diagram contains ${analysis.shapes.length} geometric element(s). ` +
            `Measurements are shown in pixel units (board coordinates). ` +
            `Configure OpenAI for detailed geometric analysis and teaching explanations.`
          : 'Draw shapes using the SHAPES tool or write labels like "AB = 5cm" for geometry analysis.';
      return analysis;
    }

    try {
      const prompt = `Analyze this whiteboard geometry for a teacher:\n${analysis.summary}\n` +
        `Shapes: ${JSON.stringify(analysis.shapes.map((s) => ({ type: s.type, measurements: s.measurements, labels: s.labels })))}\n` +
        `Labels: ${analysis.textAnnotations.join(', ')}`;

      const result = await provider.explainConcept(prompt, context);
      analysis.explanation = result.text;
    } catch {
      // optional enrichment
    }

    return analysis;
  }
}

export const diagramAnalyzer = new DiagramAnalyzer();
