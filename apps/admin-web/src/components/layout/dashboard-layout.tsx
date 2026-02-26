'use client';
import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useSocket } from '@/hooks/use-socket';

export function DashboardLayout({ children }: { children: ReactNode }) {
  useSocket();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
