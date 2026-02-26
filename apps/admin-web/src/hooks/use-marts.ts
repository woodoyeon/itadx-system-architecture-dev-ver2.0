import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Mart, ApiResponse } from '@/types';

export function useMarts(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: ['marts', params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Mart[]>>('/marts', { params });
      return data;
    },
  });
}

export function useMart(id: string) {
  return useQuery({
    queryKey: ['mart', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Mart>>(`/marts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
