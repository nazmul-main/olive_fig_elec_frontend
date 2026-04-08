'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, supplierName: '' });
  const [editId, setEditId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=100');
      if (data.success) {
        setProducts(data.products);
      }
    } catch (e) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditId(product._id);
      setFormData(product);
    } else {
      setEditId(null);
      setFormData({ name: '', sku: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, supplierName: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/products/${editId}`, formData);
        toast.success('Product updated');
      } else {
         await api.post('/products', formData);
         toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving product');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (password) => {
    try {
      setIsDeleting(true);
      const { data } = await api({
        method: 'delete',
        url: `/products/${productToDelete._id}`,
        data: { password }
      });
      if (data.success) {
        toast.success('Product deleted');
        fetchProducts();
        setShowDeleteModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Name', accessor: 'name' },
    { header: 'Brand', accessor: 'brand' },
    { header: 'Category', accessor: 'category' },
    { header: 'Stock', render: (row) => <span className={`font-semibold ${row.stockQuantity <= 5 ? 'text-red-500' : 'text-green-500'}`}>{row.stockQuantity}</span> },
    { header: 'Sale Price', render: (row) => `৳${row.salePrice}` },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Products</h1>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors">
            Add Product
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
          data={products} 
          onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null} 
          onDelete={user?.role === 'admin' ? handleDeleteClick : null} 
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Product" : "New Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">SKU</label>
              <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Brand</label>
              <input type="text" required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Category</label>
              <input type="text" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Purchase Price (৳)</label>
              <input type="number" min="0" required value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sale Price (৳)</label>
              <input type="number" min="0" required value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Initial Stock</label>
              <input type="number" min="0" required value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 transition-colors" disabled={!!editId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Supplier Name</label>
              <input type="text" value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
          </div>
          <div className="mt-5 sm:mt-6">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm transition-colors">
              {editId ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`Delete Product: ${productToDelete?.name}?`}
      />
    </div>
  );
}


