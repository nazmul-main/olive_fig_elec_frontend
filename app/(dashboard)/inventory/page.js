'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import toast from 'react-hot-toast';
import { Warehouse, History, FileUp, Plus, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InventoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setPage(1);
    setHistory([]);
    setHasMore(true);
    fetchInventory(1, true); // initial load
  }, [startDate, endDate]);

  const fetchInventory = async (pageNumber = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get('/dashboard/inventory', {
        params: { limit: 20, page: pageNumber, startDate: startDate || undefined, endDate: endDate || undefined }
      });

      if (data.success) {
        if (isInitial) {
          setHistory(data.history);
        } else {
          setHistory(prev => [...prev, ...data.history]);
        }
        setHasMore(data.history.length === 20); // if returned less than limit, no more data
      }
    } catch (e) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Intersection Observer to trigger more loads
  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchInventory(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, startDate, endDate]);



  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing full report...');
    try {
      // Fetch all data from the backend for the current filters
      // We pass limit: 0 to get all records matching the filters
      const { data } = await api.get('/dashboard/inventory', {
        params: {
          limit: 0,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      if (!data.success || !data.history) {
        throw new Error('Failed to fetch data');
      }

      const reportData = data.history.length > 0 ? data.history : history;

      const exportData = reportData.map(row => ({
        'Date/Time': new Date(row.createdAt).toLocaleString(),
        'Product Name': row.productName,
        'Product Code': row.product?.code || 'N/A',
        'Type': row.type,
        'Quantity': row.quantity,
        'Reason': row.reason.toUpperCase(),
        'Previous Stock': row.previousStock,
        'New Stock': row.newStock,
        'Note': row.note || '',
        'Updated By': row.updatedBy?.name || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Movement");

      XLSX.writeFile(workbook, `Inventory_History_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Stock report downloaded!', { id: toastId });
    } catch (e) {
      console.error('Export Error:', e);
      toast.error('Failed to export report', { id: toastId });
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.createdAt).toLocaleString() },
    { header: 'Product', render: (row) => `${row.productName} (${row.product?.code})` },
    {
      header: 'Type', render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.type}
        </span>
      )
    },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Reason', render: (row) => <span className="capitalize">{row.reason}</span> },
    { header: 'Balance', render: (row) => `${row.previousStock} → ${row.newStock}` },
    { header: 'Updated By', render: (row) => row.updatedBy?.name },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Warehouse size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Stock Movement</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Audit stock changes and history</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Date Filters Group - Compact for Mobile */}
            <div className="flex flex-1 items-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 p-0.5 sm:p-1 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]"
                />
              </div>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-[10px] font-black text-red-500 uppercase px-1 hover:underline transition-all hidden sm:block"
                >
                  Clear
                </button>
              )}

              <button
                onClick={handleExportExcel}
                disabled={history.length === 0}
                title="Export Report"
                className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
              >
                <FileUp size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden transition-all text-xs">
          <DataTable columns={columns} data={history} disablePagination={true} />

          {/* Target for Infinite Scroll */}
          <div ref={lastElementRef} className="h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                <span className="font-bold uppercase tracking-widest text-[10px]">Loading more...</span>
              </div>
            )}
            {!hasMore && history.length > 0 && (
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-900/50 px-4 py-1 rounded-full">End of records</span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}


