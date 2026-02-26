import { Card } from './card';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function KPICard({ title, value, change, icon }: KPICardProps) {
  return (
    <Card className="flex items-center gap-4">
      {icon && <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <p className={`text-xs ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
          </p>
        )}
      </div>
    </Card>
  );
}
