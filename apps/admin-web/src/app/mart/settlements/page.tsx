'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 정산 관리 페이지
 * TODO: settlement list and status
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">정산 관리</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: settlement list and status</p>
      </div>
    </DashboardLayout>
  );
}
