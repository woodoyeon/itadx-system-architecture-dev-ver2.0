'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 지점 관리 페이지
 * TODO: branch list with risk index
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">지점 관리</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: branch list with risk index</p>
      </div>
    </DashboardLayout>
  );
}
