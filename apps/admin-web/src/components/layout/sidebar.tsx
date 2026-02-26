'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const bankMenus = [
  { href: '/bank/dashboard', label: '대시보드', icon: '📊' },
  { href: '/bank/marts', label: '마트 관리', icon: '🏪' },
  { href: '/bank/merchants', label: '가맹점 관리', icon: '🏬' },
  { href: '/bank/risk', label: '리스크 분석', icon: '⚠️' },
];

const martMenus = [
  { href: '/mart/receiving', label: '입고 관리', icon: '📦' },
  { href: '/mart/settlements', label: '정산 관리', icon: '💰' },
  { href: '/mart/branches', label: '지점 관리', icon: '🏢' },
];

const adminMenus = [
  { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
  { href: '/admin/users', label: '사용자 관리', icon: '👤' },
  { href: '/admin/audit', label: '감사 로그', icon: '📋' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'bank';

  const menus = role === 'bank' ? bankMenus : role === 'mart' ? martMenus : adminMenus;

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-primary-light">ItaDX</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.name || 'User'} ({role})</p>
      </div>
      <nav className="space-y-1">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname === menu.href ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800',
            )}
          >
            <span>{menu.icon}</span>
            <span>{menu.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
