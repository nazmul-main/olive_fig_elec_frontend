'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const links = [
    { name: 'Dashboard', href: '/', roles: ['admin', 'manager', 'salesman'] },
    { name: 'Products', href: '/products', roles: ['admin', 'manager', 'salesman'] },
    { name: 'POS (New Sale)', href: '/sales/new', roles: ['admin', 'manager', 'salesman'] },
    { name: 'Sales History', href: '/sales', roles: ['admin', 'manager', 'salesman'] },
    { name: 'Inventory', href: '/inventory', roles: ['admin', 'manager'] },
    { name: 'Expenses', href: '/expenses', roles: ['admin', 'manager'] },
    { name: 'Staff Management', href: '/staff', roles: ['admin'] },
    { name: 'Reports', href: '/reports', roles: ['admin', 'manager'] },
  ];

  // Filter links by user role
  const filteredLinks = links.filter(link => user?.role && link.roles.includes(user.role));

  return (
    <div className="hidden md:flex md:flex-shrink-0 no-print">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold tracking-tight text-brand">Olive & Fig</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {filteredLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                    {user?.role || 'Guest'}
                  </p>
                  <button 
                    onClick={logout} 
                    className="text-xs mt-1 text-red-500 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

