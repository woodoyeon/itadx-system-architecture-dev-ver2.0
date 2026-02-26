import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

/**
 * WHY: WebSocket으로 입고확인 등 실시간 이벤트를 수신하여
 *      React Query 캐시를 자동 무효화 → UI 즉시 반영
 */
export function useSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    socket.on('receiving:confirmed', () => {
      queryClient.invalidateQueries({ queryKey: ['receivings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('credit:score-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    });

    socket.on('risk:level-changed', () => {
      queryClient.invalidateQueries({ queryKey: ['marts'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    });

    return () => {
      socket.off('receiving:confirmed');
      socket.off('credit:score-updated');
      socket.off('risk:level-changed');
    };
  }, [queryClient]);
}
