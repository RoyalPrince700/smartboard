import { apiClient } from './axiosClient';
import {
  AIContext,
  ExplanationResponse,
  InterpretResponse,
  RecognizeResponse,
  SubjectClassification,
} from '../../types/ai';
import { Stroke } from '../../types/stroke';
import { SolveResponse } from '../../types/math';
import { DiagramAnalysis, VisualizeResponseExtended } from '../../types/geometry';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const AI_REQUEST_CONFIG = { timeout: 45_000 };

export async function fetchAIStatus(): Promise<{ provider: string }> {
  const { data } = await apiClient.get<ApiResponse<{ provider: string }>>(
    '/ai/status',
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function explainText(
  input: string,
  options?: { context?: AIContext; boardId?: string }
): Promise<ExplanationResponse> {
  const { data } = await apiClient.post<ApiResponse<ExplanationResponse>>(
    '/ai/explain',
    {
      input,
      context: options?.context,
      boardId: options?.boardId,
    },
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function recognizeStrokes(
  strokes: Stroke[],
  options?: { imageBase64?: string; boardId?: string }
): Promise<RecognizeResponse> {
  const { data } = await apiClient.post<ApiResponse<RecognizeResponse>>(
    '/ai/recognize',
    {
      strokes,
      imageBase64: options?.imageBase64,
      boardId: options?.boardId,
    },
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function classifyInput(
  input: string,
  subject?: string
): Promise<SubjectClassification> {
  const { data } = await apiClient.post<ApiResponse<SubjectClassification>>(
    '/ai/classify',
    {
      input,
      subject,
    },
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function interpretBoard(
  payload: {
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
    boardId?: string;
    explain?: boolean;
  }
): Promise<InterpretResponse> {
  const { data } = await apiClient.post<ApiResponse<InterpretResponse>>(
    '/ai/interpret',
    payload,
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function solveMath(
  payload: {
    input?: string;
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    context?: AIContext;
    boardId?: string;
    includeGraph?: boolean;
  }
): Promise<SolveResponse> {
  const { data } = await apiClient.post<ApiResponse<SolveResponse>>(
    '/ai/solve',
    payload,
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function visualizeMath(
  payload: {
    expression?: string;
    text?: string;
    strokes?: Stroke[];
    imageBase64?: string;
    mode?: 'function' | 'geometry' | 'diagram' | 'auto';
    xMin?: number;
    xMax?: number;
    boardId?: string;
    context?: AIContext;
  }
): Promise<VisualizeResponseExtended> {
  const { data } = await apiClient.post<ApiResponse<VisualizeResponseExtended>>(
    '/ai/visualize',
    payload,
    AI_REQUEST_CONFIG
  );
  return data.data;
}

export async function analyzeDiagram(
  payload: {
    strokes?: Stroke[];
    text?: string;
    imageBase64?: string;
    context?: AIContext;
    boardId?: string;
    generateDiagram?: boolean;
  }
): Promise<DiagramAnalysis> {
  const { data } = await apiClient.post<ApiResponse<DiagramAnalysis>>(
    '/ai/analyze-diagram',
    payload,
    AI_REQUEST_CONFIG
  );
  return data.data;
}
