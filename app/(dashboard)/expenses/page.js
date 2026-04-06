'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const [formData, setFormData] = useState({ title: '', amount: 0, category: 'others', date: new Date().toISOString().split('T')[0], note: '' });
  const [editId, setEditId] = useState(null);

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

  const handleDelete = async (exp) => {
    if (window.confirm(`Delete expense "${exp.title}"?`)) {
      try {
        await api.delete(`/expenses/${exp._id}`);
        toast.success('Expense deleted');
        fetchExpenses();
      } catch (e) {
        toast.error('Error deleting expense');
      }
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
           <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
           <p className="text-sm text-gray-500">This Month: <span className="text-red-500 font-medium">৳{monthlyTotal.toLocaleString()}</span></p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Expense</button>
      </div>

      {loading ? <p>Loading expenses...</p> : (
        <DataTable columns={columns} data={expenses} onEdit={handleOpenModal} onDelete={handleDelete} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Expense" : "Add Expense"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 w-full border rounded p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Amount (৳)</label>
              <input type="number" min="0" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="mt-1 w-full border rounded p-2" />
            </div>
          </div>
          <div>
             <label className="block text-sm">Category</label>
             <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 w-full border rounded p-2">
               <option value="salary">Salary</option>
               <option value="electricity">Electricity</option>
               <option value="rent">Rent</option>
               <option value="maintenance">Maintenance</option>
               <option value="marketing">Marketing</option>
               <option value="others">Others</option>
             </select>
          </div>
          <div>
             <label className="block text-sm">Note (Optional)</label>
             <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="mt-1 w-full border rounded p-2 rows-2"></textarea>
          </div>
          <div className="mt-5">
            <button type="submit" className="w-full bg-brand text-white py-2 rounded">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


