export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR');
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('ko-KR');
}

export function getRiskBadge(level: number): string {
  const map: Record<number, string> = { 1: 'badge-stable', 2: 'badge-caution', 3: 'badge-warning', 4: 'badge-danger' };
  return map[level] || '';
}

export function getRiskLabel(level: number): string {
  const map: Record<number, string> = { 1: '안정', 2: '주의', 3: '경고', 4: '위험' };
  return map[level] || '알 수 없음';
}
