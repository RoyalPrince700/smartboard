import { apiClient } from './axiosClient';
import {
  AgentMessagePayload,
  AgentSessionSummary,
  AgentStatus,
  TutorAgentResponse,
} from '../../types/agent';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const AGENT_REQUEST_CONFIG = { timeout: 30_000 };

export async function fetchAgentStatus(): Promise<AgentStatus> {
  const { data } = await apiClient.get<ApiResponse<AgentStatus>>(
    '/agent/status',
    AGENT_REQUEST_CONFIG
  );
  return data.data;
}

export async function sendAgentMessage(
  payload: AgentMessagePayload
): Promise<TutorAgentResponse> {
  const { data } = await apiClient.post<ApiResponse<TutorAgentResponse>>(
    '/agent/message',
    payload,
    AGENT_REQUEST_CONFIG
  );
  return data.data;
}

export async function fetchAgentSession(sessionId: string): Promise<AgentSessionSummary> {
  const { data } = await apiClient.get<ApiResponse<AgentSessionSummary>>(
    `/agent/session/${sessionId}`,
    AGENT_REQUEST_CONFIG
  );
  return data.data;
}

export async function resetAgentSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/agent/session/${sessionId}`, AGENT_REQUEST_CONFIG);
}
