'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  History, 
  Warehouse, 
  Wallet, 
  Users, 
  BarChart3, 
  LogOut,
  X 
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'salesman'] },
    { name: 'Products', href: '/products', icon: Box, roles: ['admin', 'manager', 'salesman'] },
    { name: 'POS (New Sale)', href: '/sales/new', icon: ShoppingCart, roles: ['admin', 'manager', 'salesman'] },
    { name: 'Sales History', href: '/sales', icon: History, roles: ['admin', 'manager', 'salesman'] },
    { name: 'Inventory', href: '/inventory', icon: Warehouse, roles: ['admin', 'manager'] },
    { name: 'Expenses', href: '/expenses', icon: Wallet, roles: ['admin', 'manager'] },
    { name: 'Staff Management', href: '/staff', icon: Users, roles: ['admin'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  // Filter links by user role
  const filteredLinks = links.filter(link => user?.role && link.roles.includes(user.role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-xl md:shadow-none transition-colors duration-300">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center justify-center flex-shrink-0 px-4 pt-4 mb-6">
          <img src="/logo.png" alt="Olive & Fig" className="h-20 w-auto object-contain" />
        </div>
        <nav className="mt-5 flex-1 px-4 space-y-1">
          {filteredLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand text-white shadow-md shadow-brand/20' 
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 dark:text-slate-400 group-hover:text-gray-500 dark:group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-100 dark:border-slate-700 p-4 bg-gray-50/50 dark:bg-slate-800/50 transition-colors duration-300">
        <div className="flex-shrink-0 w-full flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold uppercase">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[100px]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 capitalize">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-0 flex z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Backdrop overlay */}
        <div 
          className="fixed inset-0 bg-gray-600/75 dark:bg-slate-900/80 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
        
        {/* Sidebar panel */}
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
        <div className="flex-shrink-0 w-14" aria-hidden="true" />
      </div>

      {/* Desktop Sidebar (Togglable) */}
      <div 
        className={`hidden md:flex md:flex-shrink-0 no-print transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden border-r border-gray-200 dark:border-slate-700 ${isOpen ? 'w-64' : 'w-0 border-none'}`}
      >
        <div className={`flex flex-col w-64 h-full transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'}`}>
          <SidebarContent />
        </div>
      </div>
    </>
  );
}

