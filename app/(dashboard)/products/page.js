'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', sku: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, supplierName: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
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

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await api.delete(`/products/${product._id}`);
        toast.success('Product deleted');
        fetchProducts();
      } catch (e) {
        toast.error('Error deleting product');
      }
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
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <button onClick={() => handleOpenModal()} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Product</button>
      </div>

      {loading ? <p>Loading products...</p> : (
        <DataTable columns={columns} data={products} onEdit={handleOpenModal} onDelete={handleDelete} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Product" : "New Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SKU</label>
              <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Brand</label>
              <input type="text" required value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input type="text" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Purchase Price (৳)</label>
              <input type="number" min="0" required value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sale Price (৳)</label>
              <input type="number" min="0" required value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Initial Stock</label>
              <input type="number" min="0" required value={formData.stockQuantity} onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" disabled={!!editId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
              <input type="text" value={formData.supplierName} onChange={(e) => setFormData({...formData, supplierName: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
            </div>
          </div>
          <div className="mt-5 sm:mt-6">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm">
              {editId ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


