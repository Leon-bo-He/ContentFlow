import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, getAccessToken, ApiError } from './client.js';
import type { AuthUser } from '../store/auth.store.js';

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface RefreshResponse {
  accessToken: string;
}

export function useLogin() {
  return useMutation<AuthResponse, ApiError, { email: string; password: string }>({
    mutationFn: (body) =>
      apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useRegister() {
  return useMutation<AuthResponse, ApiError, { email: string; username: string; password: string }>({
    mutationFn: (body) =>
      apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
}

export function useLogout() {
  return useMutation<{ ok: boolean }, ApiError, void>({
    mutationFn: () =>
      apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  });
}

export function useRefreshToken() {
  return useMutation<RefreshResponse, ApiError, void>({
    mutationFn: () =>
      apiFetch<RefreshResponse>('/api/auth/refresh', { method: 'POST' }),
  });
}

export function useUpdateProfile() {
  return useMutation<AuthUser, ApiError, { username?: string; email?: string; locale?: string; timezone?: string; avatar?: string | null }>({
    mutationFn: (body) =>
      apiFetch<AuthUser>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  });
}

export function useUploadAvatar() {
  return useMutation<{ url: string }, ApiError, File>({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('file', file);
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form, headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new ApiError(res.status, body.error ?? 'Upload failed');
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useChangePassword() {
  return useMutation<{ ok: boolean }, ApiError, { currentPassword: string; newPassword: string }>({
    mutationFn: (body) =>
      apiFetch<{ ok: boolean }>('/api/auth/password', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  });
}

export function useDeleteAccount() {
  return useMutation<{ ok: boolean }, ApiError, { password: string }>({
    mutationFn: (body) =>
      apiFetch<{ ok: boolean }>('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify(body),
      }),
  });
}

export function useMe(accessToken: string | null) {
  return useQuery<AuthUser, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch<AuthUser>('/api/auth/me'),
    enabled: !!accessToken,
    retry: false,
  });
}
