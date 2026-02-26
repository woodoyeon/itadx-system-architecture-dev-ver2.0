'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 감사 로그 페이지
 * TODO: audit log viewer
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">감사 로그</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: audit log viewer</p>
      </div>
    </DashboardLayout>
  );
}
