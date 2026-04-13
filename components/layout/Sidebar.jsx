'use client';
import { useEffect, useState } from 'react';
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
  X,
  Truck,
  PackagePlus,
  ChevronDown,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  // State to track which sections are expanded
  const [openSections, setOpenSections] = useState({
    sales: true,
    inventory: true,
    accounts: false,
    admin: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const menuGroups = [
    {
      id: 'main',
      label: 'Main',
      links: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'salesman'] },
      ]
    },
    {
      id: 'sales',
      label: 'Sales & CRM',
      icon: ShoppingCart,
      links: [
        { name: 'New Sale (POS)', href: '/sales/new', icon: ShoppingCart, roles: ['admin', 'manager', 'salesman'] },
        { name: 'Sales History', href: '/sales', icon: History, roles: ['admin', 'manager', 'salesman'] },
        { name: 'Customer Ledger', href: '/customers', icon: Users, roles: ['admin', 'manager', 'salesman'] },
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory Control',
      icon: Box,
      links: [
        { name: 'Products List', href: '/products', icon: Box, roles: ['admin', 'manager', 'salesman'] },
        { name: 'Record Purchase', href: '/purchases', icon: PackagePlus, roles: ['admin', 'manager'] },
        { name: 'Suppliers', href: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
        { name: 'Stock History', href: '/inventory', icon: Warehouse, roles: ['admin', 'manager'] },
      ]
    },
    {
      id: 'accounts',
      label: 'Finance & Accounts',
      icon: Wallet,
      links: [
        { name: 'Expenses', href: '/expenses', icon: Wallet, roles: ['admin', 'manager'] },
        { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
      ]
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: Users,
      links: [
        { name: 'Staff Management', href: '/staff', icon: Users, roles: ['admin'] },
        { name: 'System Settings', href: '/settings', icon: LayoutDashboard, roles: ['admin'] },
      ]
    }
  ];

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  // Check if any link in a group is active
  const isGroupActive = (group) => {
    return group.links.some(link => pathname === link.href);
  };

  // Auto-expand active group on initial load
  useEffect(() => {
    const updatedSections = { ...openSections };
    menuGroups.forEach(group => {
      if (isGroupActive(group)) {
        updatedSections[group.id] = true;
      }
    });
    setOpenSections(updatedSections);
  }, [pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 shadow-xl md:shadow-none transition-colors duration-300">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-center flex-shrink-0 px-4 pt-2 mb-8">
          <img src="/logo.png" alt="Olive & Fig" className="h-16 w-auto object-contain" />
        </div>
        
        <nav className="mt-2 flex-1 px-4 space-y-6">
          {menuGroups.map((group) => {
            // Filter links in group by user role
            const visibleLinks = group.links.filter(link => user?.role && link.roles.includes(user.role));
            if (visibleLinks.length === 0) return null;

            // Header-only links (like Dashboard)
            if (group.id === 'main') {
              return visibleLinks.map(link => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 mb-1 ${
                      isActive 
                        ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-brand dark:hover:text-brand'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand'}`} />
                    {link.name}
                  </Link>
                );
              });
            }

            const isExpanded = openSections[group.id];
            const GroupIcon = group.icon;
            const hasActiveChild = isGroupActive(group);

            return (
              <div key={group.id} className="space-y-1">
                <button 
                  onClick={() => toggleSection(group.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    hasActiveChild 
                      ? 'bg-brand/5 text-brand' 
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-brand'
                  }`}
                >
                  <div className="flex items-center">
                    <GroupIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${hasActiveChild ? 'text-brand' : 'text-gray-400 group-hover:text-brand transition-colors'}`} />
                    <span>{group.label}</span>
                  </div>
                  <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} className={hasActiveChild ? 'text-brand' : 'text-gray-400 group-hover:text-brand'} />
                  </div>
                </button>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden space-y-1 ml-4 border-l-2 border-gray-100 dark:border-slate-700/50 pl-4">
                    {visibleLinks.map((link) => {
                      const isActive = pathname === link.href;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          href={link.href}
                          className={`group flex items-center px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-brand/10 text-brand border border-brand/20' 
                              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-brand dark:hover:text-white'
                          }`}
                        >
                          <Icon size={18} className={`mr-3 flex-shrink-0 ${isActive ? 'text-brand' : 'text-gray-400 group-hover:text-brand'}`} />
                          {link.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="flex-shrink-0 flex border-t border-gray-100 dark:border-slate-700 p-4 bg-gray-50/50 dark:bg-slate-800/50 transition-colors duration-300">
        <div className="flex-shrink-0 w-full flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black uppercase">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate max-w-[100px] tracking-tight uppercase">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
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
      <div className={`fixed inset-0 flex z-50 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-800 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button onClick={() => setIsOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar (Togglable) */}
      <div className={`hidden md:flex md:flex-shrink-0 no-print transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden border-r border-gray-200 dark:border-slate-700 ${isOpen ? 'w-64' : 'w-0 border-none'}`}>
        <div className={`flex flex-col w-64 h-full transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'}`}>
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
