import { apiClient } from './axiosClient';
import { AuthSession, AuthUser } from '../../types/auth';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function signInWithGoogle(credential: string): Promise<AuthSession> {
  const { data } = await apiClient.post<ApiResponse<AuthSession>>('/auth/google', {
    credential,
  });
  return data.data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
  return data.data.user;
}
