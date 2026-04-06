'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stock Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ productId: '', quantity: 0, type: 'IN', reason: 'purchase', note: '' });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/dashboard/inventory');
      if (data.success) setHistory(data.history);
    } catch (e) {
      toast.error('Failed to load inventory history');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
     try {
       const { data } = await api.get('/products');
       if (data.success) setProducts(data.products);
     } catch (e) {}
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) return toast.error('Invalid data');
    try {
      await api.post('/dashboard/stock-adjustment', formData);
      toast.success('Stock adjusted successfully');
      setIsModalOpen(false);
      fetchInventory();
      // Reset form
      setFormData({ productId: '', quantity: 0, type: 'IN', reason: 'purchase', note: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adjusting stock');
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.createdAt).toLocaleString() },
    { header: 'Product', render: (row) => `${row.productName} (${row.product?.sku})` },
    { header: 'Type', render: (row) => (
       <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
         {row.type}
       </span>
    )},
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Reason', render: (row) => <span className="capitalize">{row.reason}</span> },
    { header: 'Balance', render: (row) => `${row.previousStock} → ${row.newStock}` },
    { header: 'Updated By', render: (row) => row.updatedBy?.name },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory Movement</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-indigo-700">Manual Stock Adjustment</button>
      </div>

      {loading ? <p>Loading history...</p> : (
        <DataTable columns={columns} data={history} />
      )}

      {/* Adjust Stock Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manual Stock Adjustment">
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-gray-700">Product</label>
             <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="mt-1 w-full border border-gray-300 rounded p-2">
                <option value="">Select a product...</option>
                {products.map(p => (
                   <option key={p._id} value={p._id}>{p.name} (Stock: {p.stockQuantity})</option>
                ))}
             </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Type</label>
               <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="mt-1 w-full border border-gray-300 rounded p-2">
                 <option value="IN">ADD (IN)</option>
                 <option value="OUT">DEDUCT (OUT)</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Quantity</label>
               <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="mt-1 w-full border border-gray-300 rounded p-2" />
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Reason</label>
             <select value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="mt-1 w-full border border-gray-300 rounded p-2">
               <option value="purchase">Purchase (New Stock)</option>
               <option value="adjustment">Manual Adjustment</option>
               <option value="return">Customer Return</option>
               <option value="damage">Damage / Defect</option>
             </select>
          </div>
          <div className="mt-5">
            <button type="submit" className="w-full bg-brand text-white py-2 rounded">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


