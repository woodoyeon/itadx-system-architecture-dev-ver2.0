'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 가맹점 관리 페이지
 * TODO: merchant list with credit scores
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">가맹점 관리</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: merchant list with credit scores</p>
      </div>
    </DashboardLayout>
  );
}
