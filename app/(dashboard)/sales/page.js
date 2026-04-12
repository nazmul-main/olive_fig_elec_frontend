'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { Printer, FileUp } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import * as XLSX from 'xlsx';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    setPage(1);
    setSales([]);
    setHasMore(true);
    fetchSales(1, true);
  }, [startDate, endDate]);

  const fetchSales = async (pageNumber = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get('/sales', {
        params: { 
          limit: 20, 
          page: pageNumber,
          startDate: startDate || undefined, 
          endDate: endDate || undefined 
        }
      });
      if (data.success) {
        if (isInitial) {
          setSales(data.sales);
        } else {
          setSales(prev => [...prev, ...data.sales]);
        }
        setHasMore(data.sales.length === 20);
      }
    } catch (e) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
           const nextPage = prev + 1;
           fetchSales(nextPage);
           return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, startDate, endDate]);

  const handlePrint = (sale) => {
    generateInvoicePDF(sale);
  };

  const handleDeleteClick = (sale) => {
    setSelectedSale(sale);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (password) => {
    try {
      setIsDeleting(true);
      const { data } = await api({
        method: 'delete',
        url: `/sales/${selectedSale._id}`,
        data: { password }
      });
      if (data.success) {
        toast.success(data.message || 'Sale deleted and stock restored');
        fetchSales();
        setShowDeleteModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete sale');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = sales.map(s => ({
        'Invoice No': s.invoiceNo,
        'Date': new Date(s.saleDate).toLocaleDateString(),
        'Customer': s.customerName,
        'Phone': s.customerPhone || 'N/A',
        'Subtotal': s.subtotal,
        'Discount': s.discount || 0,
        'Grand Total': s.grandTotal,
        'Paid Amount': s.paidAmount || 0,
        'Due Amount': s.dueAmount || 0,
        'Payment Method': s.paymentMethod,
        'Items Count': s.items?.length || 0,
        'Sold By': s.soldBy?.name || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales History");

      // Auto-size columns (basic implementation)
      const max_width = exportData.reduce((w, r) => Math.max(w, r.Customer?.length || 0), 10);
      worksheet["!cols"] = [ { wch: 15 }, { wch: 12 }, { wch: max_width + 5 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 } ];

      XLSX.writeFile(workbook, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel report downloaded!');
    } catch (e) {
      toast.error('Failed to export Excel');
    }
  };

  const columns = [
    { header: 'Invoice No', accessor: 'invoiceNo' },
    { header: 'Date', render: (row) => new Date(row.saleDate).toLocaleDateString() },
    { header: 'Customer', render: (row) => `${row.customerName} ${row.customerPhone ? '- ' + row.customerPhone : ''}` },
    { header: 'Grand Total', render: (row) => `৳${row.grandTotal.toLocaleString()}` },
    { header: 'Paid', render: (row) => <span className="text-green-600 font-medium">৳{(row.paidAmount || 0).toLocaleString()}</span> },
    { header: 'Due', render: (row) => <span className={`${row.dueAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>৳{(row.dueAmount || 0).toLocaleString()}</span> },
    { header: 'Method', render: (row) => <span className="capitalize">{row.paymentMethod}</span> },
    { header: 'Sold By', render: (row) => row.soldBy?.name },
    { 
      header: 'Actions', 
      render: (row) => (
        <button 
          onClick={() => handlePrint(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Print Invoice"
        >
          <Printer size={18} />
        </button>
      )
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Sales History</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Found {sales.length} transactions</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border dark:border-slate-700">
             <span className="text-[10px] font-black text-gray-400 uppercase">From</span>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none dark:text-white" />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border dark:border-slate-700">
             <span className="text-[10px] font-black text-gray-400 uppercase">To</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none dark:text-white" />
          </div>
          
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-black text-red-500 uppercase hover:underline px-2">Clear</button>
          )}

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>

          <button 
            onClick={handleExportExcel}
            disabled={sales.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
          >
            <FileUp size={16} /> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden transition-all text-xs">
          <DataTable 
            columns={columns} 
            data={sales} 
            onDelete={user?.role === 'admin' ? handleDeleteClick : null}
            disablePagination={true}
          />
          
          <div ref={lastElementRef} className="h-10 flex items-center justify-center">
             {loadingMore && (
               <div className="flex items-center gap-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                  <span className="font-bold uppercase tracking-widest text-[10px]">Loading more...</span>
               </div>
             )}
             {!hasMore && sales.length > 0 && (
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-900/50 px-4 py-1 rounded-full">End of records</span>
             )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`Delete Invoice ${selectedSale?.invoiceNo}?`}
      />
    </div>
  );
}


