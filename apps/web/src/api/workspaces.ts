import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError } from './client.js';
import type { Workspace } from '@contentflow/shared';

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
