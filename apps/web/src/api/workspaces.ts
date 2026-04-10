import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from './client.js';
import type { Workspace } from '@orbit/shared';

export function useWorkspaces() {
  return useQuery<Workspace[], ApiError>({
    queryKey: ['workspaces'],
    queryFn: () => apiFetch<Workspace[]>('/api/workspaces'),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 3;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation<Workspace, ApiError, Record<string, unknown>>({
    mutationFn: (body) =>
      apiFetch<Workspace>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation<Workspace, ApiError, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) =>
      apiFetch<Workspace>(`/api/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
