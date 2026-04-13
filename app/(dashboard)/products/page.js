'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { FileUp, Package, Plus, Trash2, Box, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, supplierName: '' });
  const [editId, setEditId] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, []);

  const fetchProducts = async (pageNumber = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const { data } = await api.get('/products', {
        params: {
          limit: 20,
          page: pageNumber
        }
      });
      if (data.success) {
        if (isInitial) {
          setProducts(data.products);
        } else {
          setProducts(prev => [...prev, ...data.products]);
        }
        setHasMore(data.products.length === 20);
      }
    } catch (e) {
      toast.error('Failed to load products');
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
          fetchProducts(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditId(product._id);
      setFormData(product);
    } else {
      setEditId(null);
      setFormData({ name: '', code: '', brand: '', category: '', purchasePrice: 0, salePrice: 0, stockQuantity: 0, supplierName: '' });
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
      fetchProducts(1, true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving product');
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing full product report...');
    try {
      // Fetch all records from the server
      const { data } = await api.get('/products', {
        params: { limit: 0 }
      });

      if (!data.success || !data.products) {
        throw new Error('Failed to fetch data');
      }

      const reportData = data.products.length > 0 ? data.products : products;

      const exportData = reportData.map(p => ({
        'Code': p.code,
        'Name': p.name,
        'Brand': p.brand,
        'Category': p.category,
        'Purchase Price': p.purchasePrice,
        'Sale Price': p.salePrice,
        'Stock Qty': p.stockQuantity,
        'Stock Value (Cost)': p.purchasePrice * p.stockQuantity,
        'Stock Value (Sale)': p.salePrice * p.stockQuantity,
        'Supplier': p.supplierName || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Current Stock");

      XLSX.writeFile(workbook, `Stock_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Inventory report downloaded!', { id: toastId });
    } catch (e) {
      console.error('Export Error:', e);
      toast.error('Failed to export report', { id: toastId });
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
        fetchProducts(1, true);
        setShowDeleteModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error deleting product');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Name', accessor: 'name' },
    { header: 'Brand', accessor: 'brand' },
    { header: 'Category', accessor: 'category' },
    { header: 'Stock', render: (row) => <span className={`font-semibold ${row.stockQuantity <= 5 ? 'text-red-500' : 'text-green-500'}`}>{row.stockQuantity}</span> },
    { header: 'Sale Price', render: (row) => `৳${row.salePrice}` },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Product Inventory</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">
                Stock Control System <span className="text-blue-600 font-black">({products.length} Items)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              onClick={handleExportExcel}
              disabled={products.length === 0}
              title="Export Full Inventory"
              className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
            >
              <FileUp size={18} />
            </button>

            {(user?.role === 'admin' || user?.role === 'manager') && (
              <button
                onClick={() => handleOpenModal()}
                title="Add New Product"
                className="flex flex-1 lg:flex-none items-center justify-center gap-2 px-6 h-10 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20"
              >
                <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
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
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden transition-all text-xs font-medium">
          <DataTable
            columns={columns}
            data={products}
            onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null}
            onDelete={user?.role === 'admin' ? handleDeleteClick : null}
            disablePagination={true}
          />

          <div ref={lastElementRef} className="h-16 flex items-center justify-center border-t dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/20">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                <span className="font-black uppercase tracking-widest text-[9px]">Loading more products...</span>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border dark:border-slate-700 shadow-sm">End of inventory</span>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editId ? "Edit Product" : "New Product"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Code</label>
              <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Brand</label>
              <input type="text" required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Category</label>
              <input type="text" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Purchase Price (৳)</label>
              <input type="number" min="0" required value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sale Price (৳)</label>
              <input type="number" min="0" required value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Initial Stock</label>
              <input type="number" min="0" required value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:text-gray-500 transition-colors" disabled={!!editId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Supplier Name</label>
              <input type="text" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors" />
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


