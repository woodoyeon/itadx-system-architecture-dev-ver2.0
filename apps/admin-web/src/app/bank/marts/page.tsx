'use client';
import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Table, Th, Td } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { useMarts } from '@/hooks/use-marts';

export default function MartsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMarts({ page, search });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">마트 관리</h2>
        <Input placeholder="검색..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>
      <Table>
        <thead>
          <tr><Th>마트명</Th><Th>사업자번호</Th><Th>상태</Th><Th>심사결과</Th><Th>등록일</Th></tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data?.data?.map((mart) => (
            <tr key={mart.id} className="hover:bg-gray-50">
              <Td><Link href={`/bank/marts/${mart.id}`} className="text-primary hover:underline">{mart.name}</Link></Td>
              <Td>{mart.businessNumber}</Td>
              <Td><StatusBadge status={mart.status} /></Td>
              <Td>{mart.screeningResult || '-'}</Td>
              <Td>{new Date(mart.createdAt).toLocaleDateString('ko-KR')}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {data?.meta && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border disabled:opacity-50">이전</button>
          <span className="px-3 py-1">{page} / {data.meta.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= (data.meta.totalPages || 1)} className="px-3 py-1 rounded border disabled:opacity-50">다음</button>
        </div>
      )}
    </DashboardLayout>
  );
}
