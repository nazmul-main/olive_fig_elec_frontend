'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { PackagePlus, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');

  const [form, setForm] = useState({
    supplierId: '',
    productCode: '',
    productName: '',
    brand: '',
    category: '',
    quantity: 1,
    purchasePrice: '',
    salePrice: '',
    paidAmount: 0,
    note: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/purchases?limit=50'),
        api.get('/suppliers'),
      ]);
      if (pRes.data.success) setPurchases(pRes.data.purchases);
      if (sRes.data.success) setSuppliers(sRes.data.suppliers);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // When supplier changes, auto-fill brand name
  const handleSupplierChange = (e) => {
    const selectedId = e.target.value;
    const selectedSupplier = suppliers.find(s => s._id === selectedId);
    setForm({ ...form, supplierId: selectedId, brand: selectedSupplier?.name || '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) return toast.error('Please select a supplier');
    const totalAmount = form.quantity * Number(form.purchasePrice);
    if (Number(form.paidAmount) > totalAmount) return toast.error(`Paid amount cannot exceed total ৳${totalAmount}`);
    try {
      setIsSubmitting(true);
      const { data } = await api.post('/purchases', form);
      if (data.success) {
        toast.success('Purchase recorded & stock updated!');
        setForm({
          supplierId: '',
          productCode: '',
          productName: '',
          brand: '',
          category: '',
          quantity: 1,
          purchasePrice: '',
          salePrice: '',
          paidAmount: 0,
          note: '',
          purchaseDate: new Date().toISOString().split('T')[0],
        });
        fetchData();
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Error recording purchase'); }
    finally { setIsSubmitting(false); }
  };

  const totalAmount = form.quantity * (Number(form.purchasePrice) || 0);
  const dueAmount = totalAmount - (Number(form.paidAmount) || 0);

  const filteredPurchases = filterSupplier
    ? purchases.filter(p => p.supplier === filterSupplier || p.supplierName?.toLowerCase().includes(filterSupplier.toLowerCase()))
    : purchases;

  const inputCls = "block w-full border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 focus:ring-brand focus:border-brand text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PackagePlus className="h-6 w-6 text-brand" /> Purchases
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Record new stock purchases from suppliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Purchase Entry Form */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 sticky top-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-brand" /> New Purchase Entry
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Supplier */}
                <div>
                  <label className={labelCls}>Supplier / Brand *</label>
                  <select required value={form.supplierId} onChange={handleSupplierChange} className={inputCls}>
                    <option value="">— Select Supplier —</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">
                      No suppliers yet. <Link href="/suppliers" className="underline">Add supplier first →</Link>
                    </p>
                  )}
                </div>

                {/* Product Code + Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Product Code *</label>
                    <input type="text" required value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} className={inputCls} placeholder="e.g. UA55BU8100" />
                  </div>
                  <div>
                    <label className={labelCls}>Category *</label>
                    <input type="text" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} placeholder="TV, AC, Fridge..." />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Product Name *</label>
                  <input type="text" required value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} className={inputCls} placeholder="e.g. Samsung 55 inch LED TV" />
                </div>

                {/* Prices + Qty */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>Quantity *</label>
                    <input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Purchase Price *</label>
                    <input type="number" min="0" required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className={inputCls} placeholder="৳" />
                  </div>
                  <div>
                    <label className={labelCls}>Sale Price *</label>
                    <input type="number" min="0" required value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className={inputCls} placeholder="৳" />
                  </div>
                </div>

                {/* Amount Summary */}
                {totalAmount > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1 border border-gray-200 dark:border-slate-600">
                    <div className="flex justify-between"><span className="text-gray-500">Total Amount</span><span className="font-semibold text-gray-900 dark:text-white">৳{totalAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Paid Now</span><span className="font-semibold text-green-600">৳{(Number(form.paidAmount) || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-slate-600 pt-1"><span className="text-red-500 font-medium">Due Amount</span><span className="font-bold text-red-600">৳{dueAmount.toLocaleString()}</span></div>
                  </div>
                )}

                {/* Paid Amount */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Paid Now (৳)</label>
                    <input type="number" min="0" max={totalAmount} value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Purchase Date</label>
                    <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Note (optional)</label>
                  <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={inputCls} placeholder="Any remarks..." />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  <PackagePlus className="h-4 w-4" />
                  {isSubmitting ? 'Recording...' : 'Record Purchase'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Purchase History Table */}
        <div className={user?.role === 'admin' || user?.role === 'manager' ? 'lg:col-span-3' : 'lg:col-span-5'}>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Purchase History</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by supplier..."
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div></div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                <PackagePlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No purchases yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                      {['Date', 'Supplier', 'Product', 'Code', 'Category', 'Qty', 'Purchase ৳', 'Sale ৳', 'Total', 'Paid', 'Due'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {filteredPurchases.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{new Date(p.purchaseDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-3 py-3 text-sm font-medium text-brand whitespace-nowrap">
                          <Link href={`/suppliers/${p.supplier}`} className="hover:underline">{p.supplierName}</Link>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">{p.productName}</td>
                        <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400 font-mono">{p.productCode}</td>
                        <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400">{p.category}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">{p.quantity}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-slate-300">৳{p.purchasePrice.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-slate-300">৳{p.salePrice.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">৳{p.totalAmount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-green-600 dark:text-green-400">৳{p.paidAmount.toLocaleString()}</td>
                        <td className="px-3 py-3 text-sm font-semibold">
                          <span className={p.dueAmount > 0 ? 'text-red-500' : 'text-green-500'}>৳{p.dueAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
