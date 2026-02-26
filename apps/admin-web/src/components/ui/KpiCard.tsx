interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function KpiCard({ title, value, subtitle, icon, trend }: KpiCardProps) {
  return (
    <div className="card flex items-start gap-4">
      {icon && <div className="p-3 rounded-lg bg-primary-50 text-primary-600">{icon}</div>}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
