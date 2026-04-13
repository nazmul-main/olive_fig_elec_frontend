'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import useAuthStore from '@/store/useAuthStore';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fn = async () => {
      await checkAuth();
      setChecking(false);
    };
    fn();
  }, [checkAuth]);

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      router.push('/login');
    }
  }, [checking, isAuthenticated, router]);

  if (checking || isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 h-screen overflow-hidden transition-colors duration-300">
      {/* Sidebar for Desktop & Mobile */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex flex-col w-0 flex-1 overflow-hidden transition-all duration-300">
        <Header isOpen={isSidebarOpen} onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


