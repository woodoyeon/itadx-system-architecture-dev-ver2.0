'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const home = user?.role === 'bank' ? '/bank/dashboard' : user?.role === 'mart' ? '/mart/receiving' : '/admin/dashboard';
    router.push(home);
  }, [isAuthenticated, user, router]);

  return <div className="flex items-center justify-center min-h-screen"><p>Redirecting...</p></div>;
}
