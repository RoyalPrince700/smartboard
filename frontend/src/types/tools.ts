import { ShapeType } from './stroke';

export type ToolMode = 'pen' | 'highlighter' | 'eraser' | 'select' | 'text' | 'shape';

export interface ToolSettings {
  activeTool: ToolMode;
  color: string;
  width: number;
  shapeType: ShapeType;
  highlighterOpacity: number;
}

export const PEN_WIDTH_MIN = 2;
export const PEN_WIDTH_MAX = 14;

export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  activeTool: 'pen',
  color: '#1a1a2e',
  width: PEN_WIDTH_MAX,
  shapeType: 'line',
  highlighterOpacity: 0.35,
};

export const BOARD_COLORS = ['#1a1a2e', '#e94560'] as const;

export const TOOL_COLORS = [...BOARD_COLORS];
