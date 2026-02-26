'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 마트 상세 페이지
 * TODO: mart detail with tabs for branches, merchants, risk
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">마트 상세</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: mart detail with tabs for branches, merchants, risk</p>
      </div>
    </DashboardLayout>
  );
}
