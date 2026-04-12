'use client';
import { useState, useEffect } from 'react';
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
    fetchExpenses();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/expenses', {
        params: { startDate: startDate || undefined, endDate: endDate || undefined, limit: 100 }
      });
      if (data.success) {
        setExpenses(data.expenses);
        setMonthlyTotal(data.monthlyTotal);
      }
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
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
      fetchExpenses();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving expense');
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = expenses.map(exp => ({
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
      toast.success('Expense report downloaded!');
    } catch (e) {
      toast.error('Failed to export Excel');
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
        fetchExpenses();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center">
             <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Financial Expenses</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
               Total: <span className="text-red-500">৳{monthlyTotal.toLocaleString()}</span> (Current Month)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border dark:border-slate-700">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">From</span>
             <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none dark:text-white" />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-xl border dark:border-slate-700">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">To</span>
             <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold outline-none dark:text-white" />
          </div>
          
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] font-black text-red-500 uppercase px-2 hover:underline transition-all">Clear</button>
          )}

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={expenses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
            >
              <FileUp size={14} /> Export
            </button>
            
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button 
                onClick={() => handleOpenModal()} 
                className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20"
              >
                <Plus size={14} /> Add New
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden transition-all">
          <DataTable 
            columns={columns} 
            data={expenses} 
            onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null} 
            onDelete={user?.role === 'admin' ? handleDeleteClick : null} 
          />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Amount (৳)</label>
              <input type="number" min="0" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-4 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Category</label>
             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors">
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
             <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" rows="3"></textarea>
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


