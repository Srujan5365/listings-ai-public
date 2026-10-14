import { apiFetch } from './client';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface UsersResponse {
  items: AppUser[];
  total: number;
  page: number;
  page_size: number;
}

export async function listUsers(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<UsersResponse> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.page_size) qs.set('page_size', String(params.page_size));
  return apiFetch<UsersResponse>(`/settings/users?${qs}`);
}

export async function createUser(data: {
  email: string;
  full_name: string;
  password: string;
  role_name: string;
}): Promise<AppUser> {
  return apiFetch<AppUser>('/settings/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: { full_name?: string; role_name?: string; is_active?: boolean },
): Promise<AppUser> {
  return apiFetch<AppUser>(`/settings/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deactivateUser(id: string): Promise<void> {
  return apiFetch(`/settings/users/${id}`, { method: 'DELETE' });
}
