import React from 'react';

export default function DataTable({ columns, data, onEdit, onDelete, onRowClick }) {
  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 dark:border-slate-700 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 transition-colors duration-300">
              <thead className="bg-gray-50 dark:bg-slate-800 transition-colors duration-300">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700 transition-colors duration-300">
                {data.length > 0 ? data.map((row, rowIdx) => (
                  <tr key={rowIdx} className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors duration-200"} onClick={() => onRowClick && onRowClick(row)}>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300 transition-colors">
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="text-brand hover:text-brand-dark dark:text-brand dark:hover:text-white mr-4 transition-colors">
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => { e.stopPropagation(); onDelete(row); }} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-4 text-center text-sm text-gray-500">
                      No data available...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
