'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { PackagePlus, Search, Plus, Trash2, ArrowRight, ArrowLeft, Building2, Smartphone, MapPin, CheckCircle2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1); // 1: Supplier, 2: Items, 3: Summary
  
  const [supplierData, setSupplierData] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    isNew: false
  });

  const [items, setItems] = useState([
    { id: Date.now(), productCode: '', productName: '', category: '', quantity: 1, purchasePrice: '', salePrice: '' }
  ]);

  const [paymentData, setPaymentData] = useState({
    paidAmount: 0,
    note: '',
    purchaseDate: new Date().toISOString().split('T')[0]
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

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), productCode: '', productName: '', category: '', quantity: 1, purchasePrice: '', salePrice: '' }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (Number(item.quantity) * (Number(item.purchasePrice) || 0)), 0);
  };

  const handleFinalSubmit = async () => {
    if (items.some(i => !i.productCode || !i.productName || !i.purchasePrice)) {
      return toast.error('Please fill all item details properly');
    }

    const payload = {
        supplierId: supplierData.isNew ? null : supplierData.id,
        newSupplier: supplierData.isNew ? { name: supplierData.name, phone: supplierData.phone, address: supplierData.address } : null,
        items,
        paidAmount: Number(paymentData.paidAmount),
        note: paymentData.note,
        purchaseDate: paymentData.purchaseDate
    };

    try {
      setIsSubmitting(true);
      const { data } = await api.post('/purchases/bulk', payload);
      if (data.success) {
        toast.success(data.message);
        // Reset full state
        setCurrentStep(1);
        setSupplierData({ id: '', name: '', phone: '', address: '', isNew: false });
        setItems([{ id: Date.now(), productCode: '', productName: '', category: '', quantity: 1, purchasePrice: '', salePrice: '' }]);
        setPaymentData({ paidAmount: 0, note: '', purchaseDate: new Date().toISOString().split('T')[0] });
        fetchData();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error recording purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVoucherAmount = calculateTotal();
  const dueAmount = totalVoucherAmount - (Number(paymentData.paidAmount) || 0);

  const filteredPurchases = filterSupplier
    ? purchases.filter(p => p.supplier === filterSupplier || p.supplierName?.toLowerCase().includes(filterSupplier.toLowerCase()))
    : purchases;

  const inputCls = "block w-full border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm py-2 px-3 text-sm bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 outline-none transition-all";
  const labelCls = "block text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 tracking-wider mb-1 ml-1";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <PackagePlus className="h-7 w-7 text-brand" /> INVENTORY PURCHASE
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage and record stock inflow</p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700 shadow-sm">
           {[1, 2, 3].map(s => (
             <div key={s} className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${currentStep === s ? 'bg-brand text-white' : 'text-gray-400'}`}>
                {s === 1 ? <Building2 size={16} /> : s === 2 ? <ShoppingCart size={16} /> : <CheckCircle2 size={16} />}
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Flow Card */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <div className="lg:col-span-12">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden">
              
              {/* Step 1: Supplier */}
              {currentStep === 1 && (
                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b dark:border-slate-700 pb-4">
                    <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                       <Building2 size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white">Supplier Information</h2>
                       <p className="text-sm text-gray-400">Select an existing supplier or add a new one</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className={labelCls}>Select Existing Supplier</label>
                        <select 
                          disabled={supplierData.isNew}
                          value={supplierData.id} 
                          onChange={(e) => {
                            const s = suppliers.find(sup => sup._id === e.target.value);
                            setSupplierData({ ...supplierData, id: e.target.value, name: s?.name || '', isNew: false });
                          }} 
                          className={inputCls}
                        >
                          <option value="">— Choose from list —</option>
                          {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.phone})</option>)}
                        </select>
                        
                        <div className="flex items-center gap-3 py-2">
                           <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OR</span>
                           <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                        </div>

                        <button 
                          onClick={() => setSupplierData({ ...supplierData, isNew: !supplierData.isNew, id: '' })}
                          className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all ${supplierData.isNew ? 'bg-brand/10 border-brand text-brand' : 'bg-gray-50 dark:bg-slate-900/50 border-transparent text-gray-500 hover:border-brand/30'}`}
                        >
                          {supplierData.isNew ? '← Use Existing Supplier' : '+ Add New Supplier Instead'}
                        </button>
                     </div>

                     <div className={`space-y-4 transition-all duration-300 ${supplierData.isNew ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="space-y-1">
                          <label className={labelCls}>New Supplier Name</label>
                          <input type="text" value={supplierData.name} onChange={e => setSupplierData({...supplierData, name: e.target.value})} className={inputCls} placeholder="Company or Individual Name" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                             <label className={labelCls}>Phone</label>
                             <input type="text" value={supplierData.phone} onChange={e => setSupplierData({...supplierData, phone: e.target.value})} className={inputCls} placeholder="017XXXXXXXX" />
                           </div>
                           <div className="space-y-1">
                             <label className={labelCls}>Address</label>
                             <input type="text" value={supplierData.address} onChange={e => setSupplierData({...supplierData, address: e.target.value})} className={inputCls} placeholder="City/Area" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end pt-4">
                     <button 
                       disabled={!supplierData.id && !supplierData.name}
                       onClick={() => setCurrentStep(2)}
                       className="px-10 py-4 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 disabled:opacity-50 flex items-center gap-2"
                     >
                       Next Step <ArrowRight size={18} />
                     </button>
                  </div>
                </div>
              )}

              {/* Step 2: Items List */}
              {currentStep === 2 && (
                <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b dark:border-slate-700 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                          <ShoppingCart size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-brand uppercase tracking-widest">{supplierData.name}</p>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Add Products to Purchase</h2>
                       </div>
                    </div>
                    <button 
                      onClick={handleAddItem}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand transition-all"
                    >
                      <Plus size={16} /> Add Another Row
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="text-[10px] uppercase font-black text-gray-400 bg-gray-50/50 dark:bg-slate-900/30">
                          <th className="px-4 py-3 rounded-l-xl">Code</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 w-24">Qty</th>
                          <th className="px-4 py-3 w-32">P. Price</th>
                          <th className="px-4 py-3 w-32">S. Price</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-center rounded-r-xl w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-700">
                        {items.map((item, index) => (
                          <tr key={item.id} className="group">
                            <td className="px-2 py-3">
                              <input required type="text" value={item.productCode} onChange={e => updateItem(item.id, 'productCode', e.target.value)} placeholder="Code" className={inputCls} />
                            </td>
                            <td className="px-2 py-3">
                              <input required type="text" value={item.productName} onChange={e => updateItem(item.id, 'productName', e.target.value)} placeholder="e.g. iPhone 15 Pro" className={inputCls} />
                            </td>
                            <td className="px-2 py-3">
                              <input required type="text" value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)} placeholder="Mobile" className={inputCls} />
                            </td>
                            <td className="px-2 py-3">
                              <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className={inputCls} />
                            </td>
                            <td className="px-2 py-3">
                              <input required type="number" min="0" value={item.purchasePrice} onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)} placeholder="Cost" className={inputCls} />
                            </td>
                            <td className="px-2 py-3">
                              <input required type="number" min="0" value={item.salePrice} onChange={e => updateItem(item.id, 'salePrice', e.target.value)} placeholder="Sale" className={inputCls} />
                            </td>
                            <td className="px-4 py-3 text-right font-black text-brand text-xs">
                               ৳{(Number(item.quantity) * (Number(item.purchasePrice) || 0)).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                               {items.length > 1 && (
                                 <button onClick={() => removeItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                   <Trash2 size={16} />
                                 </button>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50/50 dark:bg-slate-900/30 p-6 rounded-3xl border border-dashed dark:border-slate-700 gap-6 mt-4">
                     <div className="flex items-center gap-6">
                        <div className="text-center md:text-left">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                           <p className="text-2xl font-black text-gray-900 dark:text-white uppercase">{items.length}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200 dark:bg-slate-700"></div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Cost</p>
                           <p className="text-2xl font-black text-brand uppercase tracking-tighter">৳{totalVoucherAmount.toLocaleString()}</p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <button onClick={() => setCurrentStep(1)} className="px-8 py-3 text-xs font-black uppercase text-gray-500 hover:text-gray-700 flex items-center gap-2">
                           <ArrowLeft size={16} /> Back
                        </button>
                        <button onClick={() => setCurrentStep(3)} className="px-10 py-3 bg-gray-900 dark:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:bg-brand">
                           Payment Info
                        </button>
                     </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment & Final Details */}
              {currentStep === 3 && (
                <div className="p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4 border-b dark:border-slate-700 pb-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center">
                       <CheckCircle2 size={24} />
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white">Summary & Payment</h2>
                       <p className="text-sm text-gray-400">Finalize the purchase record and add payment details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-gray-50/50 dark:bg-slate-900/20 p-6 rounded-3xl border dark:border-slate-700">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b dark:border-slate-700 pb-3 mb-4">Financial Overview</h3>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm font-bold text-gray-600 dark:text-slate-300">
                              <span>Grand Total</span>
                              <span>৳{totalVoucherAmount.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-400">Paid Amount (৳)</span>
                              <input type="number" value={paymentData.paidAmount} onChange={e => setPaymentData({...paymentData, paidAmount: e.target.value})} className="w-32 bg-white dark:bg-slate-800 border-b-2 border-green-500 font-black text-lg text-green-600 text-right outline-none p-1" placeholder="0" />
                           </div>
                           <div className="flex justify-between items-center p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                              <span className="text-xs font-black text-red-400 uppercase">Balance Due</span>
                              <span className="text-xl font-black text-red-500">৳{dueAmount.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-1">
                          <label className={labelCls}>Purchase Date</label>
                          <input type="date" value={paymentData.purchaseDate} onChange={e => setPaymentData({...paymentData, purchaseDate: e.target.value})} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelCls}>Note (Internal)</label>
                          <textarea rows="3" value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})} className={inputCls} placeholder="Add any details about this batch purchase..."></textarea>
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between mt-8">
                     <button onClick={() => setCurrentStep(2)} className="px-8 py-4 text-xs font-black uppercase text-gray-500 hover:text-gray-700 flex items-center gap-2">
                        <ArrowLeft size={16} /> Edit Items
                     </button>
                     <button 
                       disabled={isSubmitting}
                       onClick={handleFinalSubmit}
                       className="px-14 py-4 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-brand/20 disabled:opacity-50 flex items-center gap-3 text-lg"
                     >
                       {isSubmitting ? 'Recording...' : (
                         <><PackagePlus size={24} /> Record Purchase</>
                       )}
                     </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Purchase History Table - FULL WIDTH NOW */}
        <div className="lg:col-span-12">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden mt-6">
            <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap bg-gray-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Purchase History</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by supplier..."
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border-transparent bg-white dark:bg-slate-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand/20 outline-none w-64"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackagePlus size={40} className="opacity-20" />
                </div>
                <p className="font-bold">No purchase records found</p>
                <p className="text-xs">Incoming stock will be listed here after entry</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Qty</th>
                      <th className="px-6 py-4">Cost ৳</th>
                      <th className="px-6 py-4">Sale ৳</th>
                      <th className="px-6 py-4">Voucher</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {filteredPurchases.map((p) => (
                      <tr key={p._id} className="hover:bg-brand/5 transition-colors group">
                        <td className="px-6 py-4 text-xs font-bold text-gray-400 whitespace-nowrap">{new Date(p.purchaseDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-brand uppercase tracking-tighter">{p.supplierName}</p>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-bold text-gray-900 dark:text-white">{p.productName}</p>
                           <p className="text-[10px] font-mono text-gray-400">{p.productCode}</p>
                        </td>
                        <td className="px-6 py-3 text-sm font-black text-gray-900 dark:text-white">{p.quantity}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-500">৳{p.purchasePrice.toLocaleString()}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-500">৳{p.salePrice.toLocaleString()}</td>
                        <td className="px-6 py-3 font-black text-gray-900 dark:text-white">৳{p.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-3">
                           <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${p.dueAmount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {p.dueAmount > 0 ? 'Partial' : 'Full Paid'}
                           </span>
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
