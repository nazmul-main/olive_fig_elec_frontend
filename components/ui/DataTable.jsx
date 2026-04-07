import React, { useState } from 'react';

export default function DataTable({ columns, data, onEdit, onDelete, onRowClick, itemsPerPage = 8 }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

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
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider ${col.headerClassName || ''}`}
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
                {currentData.length > 0 ? currentData.map((row, rowIdx) => (
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, data.length)}</span> of{' '}
                      <span className="font-medium">{data.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                            currentPage === i + 1
                              ? 'z-10 bg-brand border-brand text-white'
                              : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

