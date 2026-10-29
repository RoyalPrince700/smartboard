import { apiClient } from './axiosClient';
import { Board, BoardSummary } from '../../types/board';
import { CanvasSettings, Stroke } from '../../types/stroke';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface BoardListResponse {
  boards: BoardSummary[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchHealth(): Promise<{ status: string; db: string }> {
  const { data } = await apiClient.get<ApiResponse<{ status: string; db: string }>>('/health');
  return data.data;
}

export async function createBoard(payload?: {
  title?: string;
  strokes?: Stroke[];
  canvasSettings?: Partial<CanvasSettings>;
}): Promise<Board> {
  const { data } = await apiClient.post<ApiResponse<Board>>('/boards', payload ?? {});
  return data.data;
}

export async function fetchBoards(page = 1, limit = 20): Promise<BoardListResponse> {
  const { data } = await apiClient.get<ApiResponse<BoardListResponse>>('/boards', {
    params: { page, limit },
  });
  return data.data;
}

export async function fetchBoard(id: string): Promise<Board> {
  const { data } = await apiClient.get<ApiResponse<Board>>(`/boards/${id}`);
  return data.data;
}

export async function updateBoard(
  id: string,
  payload: {
    title?: string;
    strokes?: Stroke[];
    canvasSettings?: Partial<CanvasSettings>;
  }
): Promise<Board> {
  const { data } = await apiClient.put<ApiResponse<Board>>(`/boards/${id}`, payload);
  return data.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await apiClient.delete(`/boards/${id}`);
}
