'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 관리자 대시보드 페이지
 * TODO: system overview
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">관리자 대시보드</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: system overview</p>
      </div>
    </DashboardLayout>
  );
}
