'use client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

export function Header() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {} 
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>로그아웃</Button>
      </div>
    </header>
  );
}
