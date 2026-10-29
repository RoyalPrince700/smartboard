import { apiClient } from './axiosClient';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  adminCount: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
  return data.data;
}

export async function fetchAdminUsers(page = 1, limit = 50): Promise<{
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}> {
  const { data } = await apiClient.get<
    ApiResponse<{ users: AdminUser[]; total: number; page: number; limit: number }>
  >('/admin/users', { params: { page, limit } });
  return data.data;
}
