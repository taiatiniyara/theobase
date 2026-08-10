import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchChurchState, postChurchMutation } from './api';
import type { Member, InsertMember } from '@theobase/shared';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

export const memberKeys = {
  all: ['members'] as const,
  list: (churchId: string) => [...memberKeys.all, 'list', churchId] as const,
  detail: (churchId: string, id: string) => [...memberKeys.all, 'detail', churchId, id] as const,
};

export function useMembers(churchId: string) {
  return useQuery({
    queryKey: memberKeys.list(churchId),
    queryFn: async () => {
      const state = await fetchChurchState(churchId);
      return Object.values(state.members ?? {}) as Member[];
    },
  });
}

export function useAddMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: InsertMember) => postChurchMutation(churchId, 'member:create', member),
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.list(churchId) });
      const previous = queryClient.getQueryData<Member[]>(memberKeys.list(churchId));
      queryClient.setQueryData<Member[]>(memberKeys.list(churchId), (old) => [
        ...(old ?? []),
        { ...newMember, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() } as Member,
      ]);
      return { previous };
    },
    onError: (_err, _member, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberKeys.list(churchId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(churchId) });
    },
  });
}

export function useUpdateMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (member: InsertMember) => postChurchMutation(churchId, 'member:update', member),
    onMutate: async (updatedMember) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.list(churchId) });
      const previous = queryClient.getQueryData<Member[]>(memberKeys.list(churchId));
      queryClient.setQueryData<Member[]>(memberKeys.list(churchId), (old) =>
        (old ?? []).map((m) => (m.id === updatedMember.id ? { ...m, ...updatedMember } : m)),
      );
      return { previous };
    },
    onError: (_err, _member, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberKeys.list(churchId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(churchId) });
    },
  });
}

export function useDeleteMember(churchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      postChurchMutation(churchId, 'member:delete', { id: memberId }),
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: memberKeys.list(churchId) });
      const previous = queryClient.getQueryData<Member[]>(memberKeys.list(churchId));
      queryClient.setQueryData<Member[]>(memberKeys.list(churchId), (old) =>
        (old ?? []).filter((m) => m.id !== memberId),
      );
      return { previous };
    },
    onError: (_err, _memberId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(memberKeys.list(churchId), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(churchId) });
    },
  });
}
