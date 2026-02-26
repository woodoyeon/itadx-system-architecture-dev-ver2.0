import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Receiving, ApiResponse, PaginationMeta } from '@/types';

export function useReceivings(filters?: { martId?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['receivings', filters],
    queryFn: async () => {
      // 경로: 1) admin-web → GET /api/receivings (baseURL /api + '/receivings')
      //       2) gateway-api → /api/receivings 매칭 → erp-api:4002 로 프록시
      //       3) erp-api → GET /api/receivings (globalPrefix 'api' + Controller 'receivings') → ReceivingController.findAll
      const { data } = await api.get<ApiResponse<Receiving[]>>('/receivings', { params: filters });
      return data;
    },
  });
}

export function useConfirmReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<ApiResponse<Receiving>>(`/receivings/${id}/confirm`);
      return data.data;
    },
    // ★ Optimistic Update: UI를 즉시 반영하고 서버 응답으로 교체
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['receivings'] });
      const previous = queryClient.getQueryData(['receivings']);

      queryClient.setQueriesData({ queryKey: ['receivings'] }, (old: unknown) => {
        if (!old) return old;
        const typed = old as ApiResponse<Receiving[]>;
        return {
          ...typed,
          data: typed.data.map((r) =>
            r.id === id ? { ...r, status: 'confirmed' as const, confirmedAt: new Date().toISOString() } : r,
          ),
        };
      });

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueriesData({ queryKey: ['receivings'] }, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['receivings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
