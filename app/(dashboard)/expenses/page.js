'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { Printer, FileUp, Plus, Trash2, Calendar, Wallet } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({ title: '', amount: 0, category: 'others', date: new Date().toISOString().split('T')[0], note: '' });
  const [editId, setEditId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    setPage(1);
    setExpenses([]);
    setHasMore(true);
    fetchExpenses(1, true);
  }, [startDate, endDate]);

  const fetchExpenses = async (pageNumber = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get('/expenses', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit: 20,
          page: pageNumber
        }
      });
      if (data.success) {
        if (isInitial) {
          setExpenses(data.expenses);
        } else {
          setExpenses(prev => [...prev, ...data.expenses]);
        }
        setHasMore(data.expenses.length === 20);
        setMonthlyTotal(data.monthlyTotal);
      }
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const observer = useRef();
  const lastElementRef = (node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchExpenses(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  };

  const handleOpenModal = (exp = null) => {
    if (exp) {
      setEditId(exp._id);
      setFormData({ ...exp, date: new Date(exp.date).toISOString().split('T')[0] });
    } else {
      setEditId(null);
      setFormData({ title: '', amount: 0, category: 'others', date: new Date().toISOString().split('T')[0], note: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/expenses/${editId}`, formData);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', formData);
        toast.success('Expense added');
      }
      setIsModalOpen(false);
      fetchExpenses(1, true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving expense');
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing full expense report...');
    try {
      // Fetch all records from the server
      const { data } = await api.get('/expenses', {
        params: {
          limit: 0,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      if (!data.success || !data.expenses) {
        throw new Error('Failed to fetch data');
      }

      const reportData = data.expenses.length > 0 ? data.expenses : expenses;

      const exportData = reportData.map(exp => ({
        'Date': new Date(exp.date).toLocaleDateString(),
        'Title': exp.title,
        'Category': exp.category.toUpperCase(),
        'Amount': exp.amount,
        'Added By': exp.addedBy?.name || 'N/A',
        'Note': exp.note || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

      XLSX.writeFile(workbook, `Expenses_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Expense report downloaded!', { id: toastId });
    } catch (e) {
      console.error('Export Error:', e);
      toast.error('Failed to export report', { id: toastId });
    }
  };

  const handleDeleteClick = (exp) => {
    setExpenseToDelete(exp);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (password) => {
    try {
      setIsDeleting(true);
      const { data } = await api({
        method: 'delete',
        url: `/expenses/${expenseToDelete._id}`,
        data: { password }
      });
      if (data.success) {
        toast.success('Expense deleted');
        fetchExpenses(1, true);
        setShowDeleteModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error deleting expense');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Title', accessor: 'title' },
    { header: 'Category', render: (row) => <span className="capitalize">{row.category}</span> },
    { header: 'Amount', render: (row) => <span className="font-semibold text-red-600">৳{row.amount.toLocaleString()}</span> },
    { header: 'Added By', render: (row) => row.addedBy?.name },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Financial Expenses</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                Total (Month): <span className="text-red-500 font-black">৳{monthlyTotal.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex flex-1 items-center bg-gray-50 dark:bg-slate-900/50 rounded-2xl border dark:border-slate-700 p-0.5 sm:p-1 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">From</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]" />
              </div>
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"></div>
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">To</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]" />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(startDate || endDate) && (
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-black text-red-500 uppercase px-1 hover:underline transition-all hidden sm:block">Clear</button>
              )}

              <button
                onClick={handleExportExcel}
                disabled={expenses.length === 0}
                title="Export Expense Report"
                className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
              >
                <FileUp size={18} />
              </button>

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => handleOpenModal()}
                  title="Add New Expense"
                  className="w-10 h-10 flex items-center justify-center bg-brand hover:bg-brand-dark text-white rounded-xl transition-all shadow-lg shadow-brand/20 shrink-0"
                >
                  <Plus size={20} />
                </button>
              )}
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
          <DataTable
            columns={columns}
            data={expenses}
            onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null}
            onDelete={user?.role === 'admin' ? handleDeleteClick : null}
            disablePagination={true}
          />

          <div ref={lastElementRef} className="h-16 flex items-center justify-center border-t dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/20">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                <span className="font-black uppercase tracking-widest text-[9px]">Loading more...</span>
              </div>
            )}
            {!hasMore && expenses.length > 0 && (
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border dark:border-slate-700 shadow-sm">End of expenses</span>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Amount (৳)</label>
              <input type="number" min="0" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-4 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors">
              <option value="salary">Salary</option>
              <option value="electricity">Electricity</option>
              <option value="rent">Rent</option>
              <option value="maintenance">Maintenance</option>
              <option value="marketing">Marketing</option>
              <option value="others">Others</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Note (Optional)</label>
            <textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" rows="3"></textarea>
          </div>
          <div className="mt-5">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm transition-colors">
              {editId ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`Delete Expense: ${expenseToDelete?.title}?`}
      />
    </div>
  );
}


