import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export function useBankDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'bank'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/bank');
      return data.data;
    },
  });
}

export function useMartDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'mart'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/mart');
      return data.data;
    },
  });
}
