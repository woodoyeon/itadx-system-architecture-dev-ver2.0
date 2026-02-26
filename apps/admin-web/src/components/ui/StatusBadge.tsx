interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '대기', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '확인', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', className: 'bg-red-100 text-red-700' },
  active: { label: '활성', className: 'bg-green-100 text-green-700' },
  inactive: { label: '비활성', className: 'bg-gray-100 text-gray-500' },
  completed: { label: '완료', className: 'bg-blue-100 text-blue-700' },
  overdue: { label: '연체', className: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100' };
  return <span className={`px-2 py-1 text-xs rounded-full font-medium ${className}`}>{label}</span>;
}
