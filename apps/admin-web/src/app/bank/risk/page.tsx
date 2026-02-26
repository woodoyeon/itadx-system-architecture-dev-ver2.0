'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

/**
 * 리스크 분석 페이지
 * TODO: dual-track risk visualization
 */
export default function Page() {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">리스크 분석</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">구현 예정: dual-track risk visualization</p>
      </div>
    </DashboardLayout>
  );
}
