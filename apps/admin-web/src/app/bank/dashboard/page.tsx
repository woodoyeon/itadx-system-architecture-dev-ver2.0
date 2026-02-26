'use client';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard } from '@/components/ui/kpi-card';
import { useBankDashboard } from '@/hooks/use-dashboard';
import { formatAmount } from '@/lib/utils';

export default function BankDashboard() {
  const { data, isLoading } = useBankDashboard();

  if (isLoading) return <DashboardLayout><p>로딩 중...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <h2 className="text-xl font-bold mb-6">은행 대시보드</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="등록 마트" value={data?.totalMarts || 0} />
        <KPICard title="전체 가맹점" value={data?.totalMerchants || 0} />
        <KPICard title="미확인 입고" value={data?.pendingReceivings || 0} />
        <KPICard title="확인 총액" value={formatAmount(data?.confirmedAmount || 0)} />
      </div>
    </DashboardLayout>
  );
}
