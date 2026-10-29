import { DiagramElement, DiagramSpec, GeometryScene, GeometryScenePoint } from '../../types/geometry';
import {
  generateCanonicalGeometryDiagram,
  geometryDiagramInputFromRecognized,
} from './canonicalGeometryDiagram';

const W = 800;
const H = 500;

function el(partial: DiagramElement): DiagramElement {
  return partial;
}

export class DiagramEngine {
  generateFromTopic(topic: string): DiagramSpec | null {
    const text = topic.toLowerCase();

    if (text.includes('water cycle') || text.includes('hydrologic')) {
      return this.waterCycleDiagram();
    }
    if (text.includes('photosynthesis')) {
      return this.photosynthesisDiagram();
    }
    if (text.includes('cell') && (text.includes('plant') || text.includes('structure'))) {
      return this.plantCellDiagram();
    }
    if (text.includes('food chain') || text.includes('food web')) {
      return this.foodChainDiagram();
    }
    if (text.includes('triangle') || text.includes('pythagoras')) {
      return this.rightTriangleDiagram();
    }
    if (text.includes('coordinate') || text.includes('number line')) {
      return this.coordinatePlaneDiagram();
    }
    if (text.includes('atom') || text.includes('atomic structure')) {
      return this.atomDiagram();
    }

    return null;
  }

  generateFromShapes(title: string, shapeCount: number): DiagramSpec {
    return {
      title,
      category: 'geometry',
      width: W,
      height: H,
      description: `Detected ${shapeCount} geometric shape(s) on the board`,
      elements: [
        el({ type: 'label', x1: 40, y1: 40, text: title, color: '#1a1a2e' }),
        el({ type: 'label', x1: 40, y1: 70, text: `${shapeCount} shape(s) analyzed`, color: '#666666' }),
      ],
    };
  }

  generateFromRecognizedData(data: Record<string, unknown> | undefined): DiagramSpec | null {
    const input = geometryDiagramInputFromRecognized(data);
    if (!input) return null;
    return generateCanonicalGeometryDiagram(input);
  }

  generateFromScene(scene: GeometryScene, title = 'Recognized Geometry Diagram'): DiagramSpec | null {
    if (scene.segments.length === 0) return null;

    const padding = 80;
    const bounds = scene.bounds ?? {
      x1: Math.min(...scene.points.map((p) => p.x)),
      y1: Math.min(...scene.points.map((p) => p.y)),
      x2: Math.max(...scene.points.map((p) => p.x)),
      y2: Math.max(...scene.points.map((p) => p.y)),
    };
    const sourceW = Math.max(bounds.x2 - bounds.x1, 1);
    const sourceH = Math.max(bounds.y2 - bounds.y1, 1);
    const scale = Math.min((W - padding * 2) / sourceW, (H - padding * 2) / sourceH);
    const pointMap = new Map(
      scene.points.map((point) => [
        point.id,
        {
          ...point,
          x: padding + (point.x - bounds.x1) * scale,
          y: padding + (point.y - bounds.y1) * scale,
        },
      ])
    );

    const getPoint = (id: string): GeometryScenePoint | undefined => pointMap.get(id);
    const elements: DiagramElement[] = [
      el({ type: 'label', x1: 40, y1: 36, text: title, color: '#1a1a2e' }),
    ];

    for (const relation of scene.relations.filter((r) => r.type === 'parallel')) {
      const [a, b] = relation.targetIds;
      elements.push(
        el({ type: 'label', x1: 40, y1: 56 + elements.length * 16, text: `${a} ∥ ${b}`, color: '#666666' })
      );
    }

    for (const segment of scene.segments) {
      const p1 = getPoint(segment.p1);
      const p2 = getPoint(segment.p2);
      if (!p1 || !p2) continue;
      elements.push(
        el({
          type: 'line',
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          color: '#1f2937',
          strokeWidth: segment.kind === 'line' ? 3 : 4,
          label: segment.label,
        })
      );
    }

    for (const angle of scene.angles.filter((a) => a.isMarked || a.valueDeg !== undefined)) {
      const vertex = getPoint(angle.vertex);
      if (!vertex) continue;
      elements.push(
        el({
          type: 'arc',
          cx: vertex.x,
          cy: vertex.y,
          radius: 28,
          color: angle.valueDeg !== undefined ? '#4f46e5' : '#e94560',
        })
      );
      elements.push(
        el({
          type: 'label',
          x1: vertex.x + 14,
          y1: vertex.y - 14,
          text: angle.label ?? 'x',
          color: angle.valueDeg !== undefined ? '#4f46e5' : '#e94560',
        })
      );
    }

    for (const point of pointMap.values()) {
      elements.push(el({ type: 'point', cx: point.x, cy: point.y, color: '#111827', label: point.id }));
    }

    for (const label of scene.labels) {
      elements.push(el({ type: 'label', x1: label.x, y1: label.y, text: label.text, color: '#4f46e5' }));
    }

    return {
      title,
      category: 'geometry',
      width: W,
      height: H,
      description: 'Clean redraw generated from the handwritten board diagram',
      elements,
    };
  }

  private waterCycleDiagram(): DiagramSpec {
    return {
      title: 'The Water Cycle',
      category: 'scientific',
      width: W,
      height: H,
      description: 'Evaporation, condensation, precipitation, and collection',
      elements: [
        el({ type: 'rectangle', x1: 0, y1: 350, width: W, height: 150, color: '#3498db', label: 'Collection' }),
        el({ type: 'arrow', x1: 200, y1: 340, x2: 200, y2: 180, color: '#2980b9', label: 'Evaporation' }),
        el({ type: 'arrow', x1: 400, y1: 160, x2: 550, y2: 160, color: '#7f8c8d', label: 'Condensation' }),
        el({ type: 'circle', cx: 480, cy: 130, radius: 55, color: '#ecf0f1', label: 'Cloud' }),
        el({ type: 'arrow', x1: 600, y1: 180, x2: 650, y2: 320, color: '#2980b9', label: 'Precipitation' }),
        el({ type: 'label', x1: 620, y1: 250, text: 'Rain', color: '#2980b9' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'The Water Cycle', color: '#1a1a2e' }),
      ],
    };
  }

  private photosynthesisDiagram(): DiagramSpec {
    return {
      title: 'Photosynthesis',
      category: 'scientific',
      width: W,
      height: H,
      description: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂',
      elements: [
        el({ type: 'circle', cx: 400, cy: 250, radius: 115, color: '#eafaf1', label: 'Chloroplast' }),
        el({ type: 'arrow', x1: 80, y1: 200, x2: 260, y2: 230, color: '#3498db', label: 'CO₂ + H₂O' }),
        el({ type: 'arrow', x1: 80, y1: 120, x2: 260, y2: 200, color: '#f39c12', label: 'Sunlight' }),
        el({ type: 'arrow', x1: 540, y1: 230, x2: 720, y2: 200, color: '#e74c3c', label: 'O₂' }),
        el({ type: 'arrow', x1: 540, y1: 270, x2: 720, y2: 300, color: '#8e44ad', label: 'Glucose' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'Photosynthesis', color: '#1a1a2e' }),
        el({ type: 'label', x1: 30, y1: 55, text: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', color: '#666666' }),
      ],
    };
  }

  private plantCellDiagram(): DiagramSpec {
    return {
      title: 'Plant Cell Structure',
      category: 'scientific',
      width: W,
      height: H,
      elements: [
        el({ type: 'rectangle', x1: 150, y1: 80, width: 500, height: 340, color: '#27ae60', label: 'Cell Wall' }),
        el({ type: 'circle', cx: 400, cy: 250, radius: 60, color: '#8e44ad', label: 'Nucleus' }),
        el({ type: 'circle', cx: 280, cy: 180, radius: 35, color: '#27ae60', label: 'Chloroplast' }),
        el({ type: 'circle', cx: 520, cy: 200, radius: 35, color: '#27ae60', label: 'Chloroplast' }),
        el({ type: 'circle', cx: 350, cy: 320, radius: 20, color: '#e74c3c', label: 'Mitochondria' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'Plant Cell', color: '#1a1a2e' }),
      ],
    };
  }

  private foodChainDiagram(): DiagramSpec {
    return {
      title: 'Food Chain',
      category: 'scientific',
      width: W,
      height: H,
      elements: [
        el({ type: 'rectangle', x1: 60, y1: 200, width: 100, height: 60, color: '#27ae60', label: 'Grass' }),
        el({ type: 'arrow', x1: 170, y1: 230, x2: 230, y2: 230, color: '#333333' }),
        el({ type: 'rectangle', x1: 240, y1: 200, width: 100, height: 60, color: '#f39c12', label: 'Grasshopper' }),
        el({ type: 'arrow', x1: 350, y1: 230, x2: 410, y2: 230, color: '#333333' }),
        el({ type: 'rectangle', x1: 420, y1: 200, width: 100, height: 60, color: '#e67e22', label: 'Frog' }),
        el({ type: 'arrow', x1: 530, y1: 230, x2: 590, y2: 230, color: '#333333' }),
        el({ type: 'rectangle', x1: 600, y1: 200, width: 100, height: 60, color: '#c0392b', label: 'Snake' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'Food Chain', color: '#1a1a2e' }),
      ],
    };
  }

  private rightTriangleDiagram(): DiagramSpec {
    return {
      title: 'Right-Angled Triangle',
      category: 'geometry',
      width: W,
      height: H,
      elements: [
        el({ type: 'line', x1: 200, y1: 380, x2: 500, y2: 380, color: '#e94560', strokeWidth: 3, label: 'Base' }),
        el({ type: 'line', x1: 200, y1: 380, x2: 200, y2: 140, color: '#e94560', strokeWidth: 3, label: 'Height' }),
        el({ type: 'line', x1: 200, y1: 140, x2: 500, y2: 380, color: '#e94560', strokeWidth: 3, label: 'Hypotenuse' }),
        el({ type: 'label', x1: 185, y1: 395, text: '90°', color: '#1a1a2e' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'a² + b² = c²', color: '#1a1a2e' }),
      ],
    };
  }

  private coordinatePlaneDiagram(): DiagramSpec {
    return {
      title: 'Coordinate Plane',
      category: 'coordinate',
      width: W,
      height: H,
      elements: [
        el({ type: 'line', x1: 50, y1: 250, x2: 750, y2: 250, color: '#333333', strokeWidth: 2 }),
        el({ type: 'line', x1: 400, y1: 50, x2: 400, y2: 450, color: '#333333', strokeWidth: 2 }),
        el({ type: 'label', x1: 760, y1: 245, text: 'x', color: '#333333' }),
        el({ type: 'label', x1: 405, y1: 40, text: 'y', color: '#333333' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'Coordinate Plane', color: '#1a1a2e' }),
      ],
    };
  }

  private atomDiagram(): DiagramSpec {
    return {
      title: 'Atomic Structure',
      category: 'scientific',
      width: W,
      height: H,
      elements: [
        el({ type: 'circle', cx: 400, cy: 250, radius: 15, color: '#e74c3c', label: 'Nucleus' }),
        el({ type: 'circle', cx: 400, cy: 250, radius: 80, color: '#3498db', dashed: true, label: 'Orbit 1' }),
        el({ type: 'circle', cx: 400, cy: 250, radius: 130, color: '#3498db', dashed: true, label: 'Orbit 2' }),
        el({ type: 'point', cx: 480, cy: 250, color: '#2c3e50', label: 'Electron' }),
        el({ type: 'point', cx: 320, cy: 180, color: '#2c3e50', label: 'Electron' }),
        el({ type: 'label', x1: 30, y1: 30, text: 'Atomic Structure', color: '#1a1a2e' }),
      ],
    };
  }
}

export const diagramEngine = new DiagramEngine();
