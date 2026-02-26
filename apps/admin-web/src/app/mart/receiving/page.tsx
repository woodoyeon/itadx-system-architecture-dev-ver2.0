'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Table, Th, Td } from '@/components/ui/table';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useReceivings, useConfirmReceiving } from '@/hooks/use-receivings';
import { formatAmount, formatDate } from '@/lib/utils';

export default function ReceivingPage() {
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading } = useReceivings({ status });
  const confirmMutation = useConfirmReceiving();

  const handleConfirm = (id: string) => {
    if (window.confirm('이 입고를 확인하시겠습니까?')) {
      confirmMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">입고 관리</h2>
        <div className="flex gap-2">
          {[undefined, 'pending', 'confirmed'].map((s) => (
            <Button key={s || 'all'} variant={status === s ? 'primary' : 'secondary'} size="sm" onClick={() => setStatus(s)}>
              {s === undefined ? '전체' : s === 'pending' ? '대기' : '확인'}
            </Button>
          ))}
        </div>
      </div>
      <Table>
        <thead>
          <tr><Th>가맹점</Th><Th>입고일</Th><Th>금액</Th><Th>상태</Th><Th>확인일</Th><Th>액션</Th></tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data?.data?.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <Td>{r.merchant?.name || r.merchantId}</Td>
              <Td>{formatDate(r.receivingDate)}</Td>
              <Td className="font-mono">{formatAmount(r.totalAmount)}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td>{r.confirmedAt ? formatDate(r.confirmedAt) : '-'}</Td>
              <Td>
                {r.status === 'pending' && (
                  <Button size="sm" onClick={() => handleConfirm(r.id)} disabled={confirmMutation.isPending}>
                    입고확인
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </DashboardLayout>
  );
}
