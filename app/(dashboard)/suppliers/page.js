'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { Truck, Plus, AlertCircle, CheckCircle, Eye, Pencil, Trash2, Phone, User, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactPerson: '', phone: '', address: '', email: '' });
  const { user } = useAuthStore();

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      if (data.success) setSuppliers(data.suppliers);
    } catch { toast.error('Failed to load suppliers'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditId(supplier._id);
      setFormData({ name: supplier.name, contactPerson: supplier.contactPerson || '', phone: supplier.phone || '', address: supplier.address || '', email: supplier.email || '' });
    } else {
      setEditId(null);
      setFormData({ name: '', contactPerson: '', phone: '', address: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/suppliers/${editId}`, formData);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier added');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (e) { toast.error(e.response?.data?.message || 'Error saving supplier'); }
  };

  const confirmDelete = async (password) => {
    try {
      setIsDeleting(true);
      await api({ method: 'delete', url: `/suppliers/${supplierToDelete._id}`, data: { password } });
      toast.success('Supplier deleted');
      fetchSuppliers();
      setShowDeleteModal(false);
    } catch (e) { toast.error(e.response?.data?.message || 'Error deleting supplier'); }
    finally { setIsDeleting(false); }
  };

  const totalDueAll = suppliers.reduce((sum, s) => sum + (s.totalPurchased - s.totalPaid), 0);
  const totalPurchasedAll = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);

  const inputCls = "mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-300";

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand" /> Suppliers
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage your brand & distributor accounts</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total Suppliers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total Purchased</p>
          <p className="text-2xl font-bold text-brand mt-1">৳{totalPurchasedAll.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-red-200 dark:border-red-900/40 shadow-sm bg-red-50 dark:bg-red-900/10">
          <p className="text-sm text-red-500 dark:text-red-400">Total Due (All Suppliers)</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">৳{totalDueAll.toLocaleString()}</p>
        </div>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No suppliers yet. Add your first supplier!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => {
            const due = s.totalPurchased - s.totalPaid;
            const paidPercent = s.totalPurchased > 0 ? Math.round((s.totalPaid / s.totalPurchased) * 100) : 100;
            return (
              <div key={s._id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg uppercase">
                      {s.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                      {s.contactPerson && <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"><User className="h-3 w-3" />{s.contactPerson}</p>}
                    </div>
                  </div>
                  {due === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" title="Fully Paid" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" title="Has Due" />
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2">
                  {s.phone && <p className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{s.phone}</p>}
                  {s.address && <p className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" />{s.address}</p>}

                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Total Purchased</span>
                      <span className="font-medium text-gray-900 dark:text-white">৳{s.totalPurchased.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Total Paid</span>
                      <span className="font-medium text-green-600 dark:text-green-400">৳{s.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-red-500">Due Amount</span>
                      <span className="text-red-600 dark:text-red-400">৳{due.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {s.totalPurchased > 0 && (
                    <div className="pt-1">
                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${paidPercent}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{paidPercent}% paid</p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <Link href={`/suppliers/${s._id}`} className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark font-medium transition-colors">
                    <Eye className="h-4 w-4" /> View Details
                  </Link>
                  <div className="flex gap-2">
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => handleOpenModal(s)} className="p-1.5 text-gray-400 hover:text-brand transition-colors rounded" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button onClick={() => { setSupplierToDelete(s); setShowDeleteModal(true); }} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? 'Edit Supplier' : 'Add New Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Supplier / Brand Name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="e.g. Samsung, Philips, Electra" />
            </div>
            <div>
              <label className={labelCls}>Contact Person</label>
              <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className={inputCls} placeholder="Distributor's name" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="01XXXXXXXXX" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} placeholder="Distributor's address" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Email (optional)</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="mt-5">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-brand-dark focus:outline-none sm:text-sm transition-colors">
              {editId ? 'Save Changes' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} loading={isDeleting} title={`Delete Supplier: ${supplierToDelete?.name}?`} />
    </div>
  );
}
