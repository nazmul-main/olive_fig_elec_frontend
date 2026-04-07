'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const [formData, setFormData] = useState({ title: '', amount: 0, category: 'others', date: new Date().toISOString().split('T')[0], note: '' });
  const [editId, setEditId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses');
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Expenses</h1>
           <p className="text-sm text-gray-500 dark:text-slate-400">This Month: <span className="text-red-500 font-medium">৳{monthlyTotal.toLocaleString()}</span></p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors">
            Add Expense
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={expenses} 
          onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null} 
          onDelete={user?.role === 'admin' ? handleDeleteClick : null} 
        />
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


