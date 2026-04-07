import { Menu, PanelLeftClose } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header({ pageTitle = 'Overview', onMenuClick, isOpen }) {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-900/10 no-print transition-colors duration-300">
      <button
        type="button"
        className="px-4 border-r border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand hover:text-brand dark:hover:text-brand transition-colors group"
        onClick={onMenuClick}
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <span className="sr-only">{isOpen ? "Close sidebar" : "Open sidebar"}</span>
        <div className={`transition-all duration-700 ease-in-out transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}>
          {isOpen ? (
            <PanelLeftClose className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
      </button>
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{pageTitle}</h2>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

