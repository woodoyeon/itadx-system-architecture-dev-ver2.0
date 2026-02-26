import { Badge } from './badge';

const statusMap = {
  pending: { label: '대기', variant: 'warning' as const },
  confirmed: { label: '확인', variant: 'success' as const },
  cancelled: { label: '취소', variant: 'danger' as const },
  completed: { label: '완료', variant: 'success' as const },
  overdue: { label: '연체', variant: 'danger' as const },
  active: { label: '활성', variant: 'success' as const },
  inactive: { label: '비활성', variant: 'default' as const },
  suspended: { label: '정지', variant: 'danger' as const },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
