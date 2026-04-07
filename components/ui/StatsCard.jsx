import React from 'react';

export default function StatsCard({ title, value, subtitle, icon, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-white dark:bg-slate-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon ? (
               <div className="h-12 w-12 rounded-md bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 {icon}
               </div>
            ) : (
                <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-slate-700" />
            )}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">{title}</dt>
              <dd>
                <div className={`text-2xl font-semibold dark:text-white ${valueColor}`}>{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {subtitle && (
        <div className="bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 px-5 py-3">
          <div className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</div>
        </div>
      )}
    </div>
  );
}
