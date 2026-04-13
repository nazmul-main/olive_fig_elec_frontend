'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { PackagePlus, Search, Plus, Trash2, ArrowRight, ArrowLeft, Building2, Smartphone, MapPin, CheckCircle2, ShoppingCart, FileUp } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  useEffect(() => {
    setPage(1);
    setPurchases([]);
    setHasMore(true);
    fetchData(1, true);
  }, [startDate, endDate]);

  const fetchData = async (pageNumber = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const [pRes, sRes] = await Promise.all([
        api.get('/purchases', {
          params: {
            limit: 20,
            page: pageNumber,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        }),
        isInitial ? api.get('/suppliers') : Promise.resolve({ data: { success: true, suppliers: [] } }),
      ]);

      if (pRes.data.success) {
        if (isInitial) {
          setPurchases(pRes.data.purchases);
        } else {
          setPurchases(prev => [...prev, ...pRes.data.purchases]);
        }
        setHasMore(pRes.data.purchases.length === 20);
      }

      if (isInitial && sRes.data.success) setSuppliers(sRes.data.suppliers);
    } catch { toast.error('Failed to load data'); }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Intersection Observer to trigger more loads
  const observer = useRef();
  const lastElementRef = (node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchData(nextPage);
          return nextPage;
        });
      }
    });

    if (node) observer.current.observe(node);
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
        fetchData(1, true);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error recording purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing full purchase report...');
    try {
      // Fetch all records for current filters
      const { data } = await api.get('/purchases', {
        params: {
          limit: 0,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      if (!data.success || !data.purchases) {
        throw new Error('Failed to fetch data');
      }

      const reportData = data.purchases.length > 0 ? data.purchases : purchases;

      const exportData = reportData.map(p => ({
        'Date': new Date(p.purchaseDate).toLocaleDateString(),
        'Supplier': p.supplierName,
        'Brand': p.brand,
        'Category': p.category,
        'Product': p.productName,
        'Code': p.productCode,
        'Quantity': p.quantity,
        'Purchase Price': p.purchasePrice,
        'Sale Price': p.salePrice,
        'Total Amount': p.totalAmount,
        'Paid': p.paidAmount,
        'Due': p.dueAmount,
        'Recorded By': p.createdBy?.name || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase History");

      XLSX.writeFile(workbook, `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Purchase report downloaded!', { id: toastId });
    } catch (e) {
      console.error('Export Error:', e);
      toast.error('Failed to export report', { id: toastId });
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
                        <input type="text" value={supplierData.name} onChange={e => setSupplierData({ ...supplierData, name: e.target.value })} className={inputCls} placeholder="Company or Individual Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className={labelCls}>Phone</label>
                          <input type="text" value={supplierData.phone} onChange={e => setSupplierData({ ...supplierData, phone: e.target.value })} className={inputCls} placeholder="017XXXXXXXX" />
                        </div>
                        <div className="space-y-1">
                          <label className={labelCls}>Address</label>
                          <input type="text" value={supplierData.address} onChange={e => setSupplierData({ ...supplierData, address: e.target.value })} className={inputCls} placeholder="City/Area" />
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
                          <input type="number" value={paymentData.paidAmount} onChange={e => setPaymentData({ ...paymentData, paidAmount: e.target.value })} className="w-32 bg-white dark:bg-slate-800 border-b-2 border-green-500 font-black text-lg text-green-600 text-right outline-none p-1" placeholder="0" />
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
                        <input type="date" value={paymentData.purchaseDate} onChange={e => setPaymentData({ ...paymentData, purchaseDate: e.target.value })} className={inputCls} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>Note (Internal)</label>
                        <textarea rows="3" value={paymentData.note} onChange={e => setPaymentData({ ...paymentData, note: e.target.value })} className={inputCls} placeholder="Add any details about this batch purchase..."></textarea>
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
            <div className="p-5 md:p-6 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Purchase History</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Incoming stock & supplier logs</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="flex flex-1 items-center bg-white dark:bg-slate-700 rounded-2xl border dark:border-slate-600 p-0.5 sm:p-1 overflow-hidden shadow-sm">
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">From</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]" />
                      </div>
                      <div className="w-px h-5 bg-gray-200 dark:bg-slate-700"></div>
                      <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 flex-1">
                        <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">To</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[10px] sm:text-[11px] font-bold outline-none dark:text-white w-full min-w-[75px]" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={filterSupplier}
                          onChange={(e) => setFilterSupplier(e.target.value)}
                          className="pl-9 pr-4 py-2 text-xs border-transparent bg-white dark:bg-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-brand/20 outline-none w-40"
                        />
                      </div>

                      <button
                        onClick={handleExportExcel}
                        disabled={purchases.length === 0}
                        title="Export Purchase Report"
                        className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
                      >
                        <FileUp size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div></div>
            ) : filteredPurchases.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PackagePlus size={40} className="opacity-10" />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">No records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700">
                  <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Supplier</th>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4">Cost ৳</th>
                      <th className="px-6 py-4">Sale ৳</th>
                      <th className="px-6 py-4">Voucher</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-xs">
                    {filteredPurchases.map((p, idx) => (
                      <tr
                        key={p._id}
                        ref={idx === filteredPurchases.length - 1 ? lastElementRef : null}
                        className="hover:bg-brand/5 transition-colors group"
                      >
                        <td className="px-6 py-4 font-bold text-gray-400 whitespace-nowrap">{new Date(p.purchaseDate).toLocaleDateString('en-GB')}</td>
                        <td className="px-6 py-4">
                          <p className="font-black text-brand uppercase tracking-tighter">{p.supplierName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{p.productName}</p>
                          <p className="text-[10px] font-mono text-gray-400 uppercase">{p.productCode}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-gray-900 dark:text-white bg-gray-50/30 dark:bg-slate-900/20">{p.quantity}</td>
                        <td className="px-6 py-4 font-medium text-gray-500">৳{p.purchasePrice.toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-500">৳{p.salePrice.toLocaleString()}</td>
                        <td className="px-6 py-4 font-black text-gray-900 dark:text-white">৳{p.totalAmount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${p.dueAmount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {p.dueAmount > 0 ? 'Partial' : 'Paid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="h-16 flex items-center justify-center border-t dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/20">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                      <span className="font-black uppercase tracking-widest text-[9px]">Loading more records...</span>
                    </div>
                  )}
                  {!hasMore && filteredPurchases.length > 0 && (
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-1.5 rounded-full border dark:border-slate-700 shadow-sm">End of history</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
