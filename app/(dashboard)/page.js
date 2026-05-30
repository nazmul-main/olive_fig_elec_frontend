'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import StatsCard from '@/components/ui/StatsCard';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Wallet, 
  Package, 
  AlertCircle,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('product'); // 'product' or 'supplier'
  const [suppliers, setSuppliers] = useState([]);

  // Product Form State
  const [productData, setProductData] = useState({
    name: '',
    code: '',
    brand: '',
    category: '',
    purchasePrice: 0,
    salePrice: 0,
    stockQuantity: 0,
    supplierId: '',
    supplierName: '',
    isNewSupplier: false,
    newSupplierName: '',
    newSupplierContact: '',
    newSupplierPhone: '',
    newSupplierAddress: '',
    newSupplierEmail: ''
  });

  // Supplier Form State
  const [supplierData, setSupplierData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    email: ''
  });

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      if (data.success) {
        setSuppliers(data.suppliers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isQuickAddOpen) {
      fetchSuppliers();
    }
  }, [isQuickAddOpen]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalSupplierName = productData.supplierName;

      if (productData.isNewSupplier) {
        if (!productData.newSupplierName) {
          toast.error('New supplier name is required');
          return;
        }
        // 1. Create the new supplier first
        const sRes = await api.post('/suppliers', {
          name: productData.newSupplierName,
          contactPerson: productData.newSupplierContact,
          phone: productData.newSupplierPhone,
          address: productData.newSupplierAddress,
          email: productData.newSupplierEmail
        });
        if (sRes.data.success) {
          finalSupplierName = productData.newSupplierName;
          toast.success(`Supplier '${productData.newSupplierName}' created!`);
        } else {
          toast.error('Failed to create new supplier');
          return;
        }
      }

      // 2. Create the product
      const pRes = await api.post('/products', {
        name: productData.name,
        code: productData.code,
        brand: productData.brand,
        category: productData.category,
        purchasePrice: Number(productData.purchasePrice),
        salePrice: Number(productData.salePrice),
        stockQuantity: Number(productData.stockQuantity),
        supplierName: finalSupplierName
      });

      if (pRes.data.success) {
        toast.success(`Product '${productData.name}' created!`);
        setIsQuickAddOpen(false);
        // Reset product form
        setProductData({
          name: '',
          code: '',
          brand: '',
          category: '',
          purchasePrice: 0,
          salePrice: 0,
          stockQuantity: 0,
          supplierId: '',
          supplierName: '',
          isNewSupplier: false,
          newSupplierName: '',
          newSupplierContact: '',
          newSupplierPhone: '',
          newSupplierAddress: '',
          newSupplierEmail: ''
        });
        // Refresh dashboard stats
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const sRes = await api.post('/suppliers', supplierData);
      if (sRes.data.success) {
        toast.success(`Supplier '${supplierData.name}' created!`);
        setIsQuickAddOpen(false);
        setSupplierData({
          name: '',
          contactPerson: '',
          phone: '',
          address: '',
          email: ''
        });
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating supplier');
    }
  };

  const [chartStart, setChartStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [chartEnd, setChartEnd] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStats();
  }, [chartStart, chartEnd]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get(`/dashboard?chartStart=${chartStart}&chartEnd=${chartEnd}`);
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
    </div>
  );
  
  if (!stats) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center shadow-sm">
      <AlertCircle className="mr-2 h-5 w-5" />
      Failed to load dashboard statistics.
    </div>
  );

  const { stats: dStats, recentSales, lowStockProducts, chartData } = stats;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1.5 flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            System active and up to date • Olive & Fig Electronics
          </p>
        </div>

        {/* Quick Add Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-brand/20 active:scale-[0.98]"
          >
            <Plus size={16} /> Quick Add Menu
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Today's Sales" 
          value={`৳ ${dStats.todayRevenue.toLocaleString()}`} 
          subtitle={`${dStats.todaySalesCount} orders today`} 
          icon={<TrendingUp className="h-6 w-6 text-brand" />}
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`৳ ${dStats.monthlyRevenue.toLocaleString()}`} 
          subtitle={`${dStats.monthlySalesCount} orders this month`} 
          icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
        />
        <StatsCard 
          title="Monthly Profit" 
          value={`৳ ${dStats.monthlyProfit.toLocaleString()}`} 
          valueColor={dStats.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}
          subtitle={`After expenses ৳${dStats.monthlyExpenses}`} 
          icon={<Wallet className="h-6 w-6 text-green-600" />}
        />
        <StatsCard 
          title="Stock Valuation" 
          value={`৳ ${dStats.stockValue.toLocaleString()}`} 
          subtitle={`${dStats.totalProducts} active products`} 
          icon={<Package className="h-6 w-6 text-orange-600" />}
        />
      </div>

      {/* Analytics Chart */}
      {chartData && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-brand" />
              Revenue, Expense & Sales Analytics
            </h3>
            
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={chartStart} 
                onChange={(e) => setChartStart(e.target.value)} 
                className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand focus:border-brand dark:bg-slate-900 dark:text-white outline-none" 
              />
              <span className="text-gray-400 text-xs font-bold">TO</span>
              <input 
                type="date" 
                value={chartEnd} 
                onChange={(e) => setChartEnd(e.target.value)} 
                className="text-xs border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-brand focus:border-brand dark:bg-slate-900 dark:text-white outline-none" 
              />
            </div>
          </div>
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(value) => `৳${value}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', cursor: 'default' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="left" type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                <Area yAxisId="right" type="monotone" dataKey="sales" name="Sales Count" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Sales Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ring-1 ring-black ring-opacity-5 transition-colors duration-300">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5 text-brand" />
              Recent Sales
            </h3>
            <Link href="/sales" className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center transition-colors">
              View all <ChevronRight className="ml-0.5 h-4 w-4" />
            </Link>
          </div>
          <div className="px-6">
            <ul className="divide-y divide-gray-100">
              {recentSales?.map(sale => (
                <li key={sale._id} className="py-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 -mx-6 px-6 transition-all duration-200 group border-b border-gray-100 dark:border-slate-700 last:border-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate uppercase">
                          {sale.invoiceNo}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(sale.saleDate).toLocaleDateString()} • {sale.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 shadow-sm">
                        ৳{sale.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {recentSales?.length === 0 && (
                <div className="py-12 text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-200" />
                  <p className="mt-2 text-sm text-gray-500 font-medium">No sales recorded today.</p>
                </div>
              )}
            </ul>
          </div>
        </div>

        {/* Low Stock Alerts Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden ring-1 ring-black ring-opacity-5 transition-colors duration-300">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Low Stock Alerts
            </h3>
            <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
              {lowStockProducts?.length || 0} Critical Items
            </span>
          </div>
          <div className="px-6">
            <ul className="divide-y divide-gray-100">
              {lowStockProducts?.map(prod => (
                <li key={prod._id} className="py-4 hover:bg-gray-50/50 -mx-6 px-6 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{prod.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">Code: {prod.code}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        prod.stockQuantity === 0 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {prod.stockQuantity} Left
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {lowStockProducts?.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-200" />
                  <p className="mt-2 text-sm text-gray-500 font-medium">All products are in sufficient stock.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <Modal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} title="Quick Add Menu">
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'product'
                  ? 'border-brand text-brand font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-500 dark:hover:text-slate-300'
              }`}
            >
              Add Product
            </button>
            <button
              onClick={() => setActiveTab('supplier')}
              className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'supplier'
                  ? 'border-brand text-brand font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-500 dark:hover:text-slate-300'
              }`}
            >
              Add Supplier
            </button>
          </div>

          {/* Product Form Tab */}
          {activeTab === 'product' && (
            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Name *</label>
                  <input
                    type="text"
                    required
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. Inverter Refrigerator 500L"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Code *</label>
                  <input
                    type="text"
                    required
                    value={productData.code}
                    onChange={(e) => setProductData({ ...productData, code: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. REF-INV-500L"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Brand *</label>
                  <input
                    type="text"
                    required
                    value={productData.brand}
                    onChange={(e) => setProductData({ ...productData, brand: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. Samsung, LG, Singer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Category *</label>
                  <input
                    type="text"
                    required
                    value={productData.category}
                    onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. Refrigerator, AC, TV"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Purchase Price *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productData.purchasePrice || ''}
                    onChange={(e) => setProductData({ ...productData, purchasePrice: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="৳"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Sale Price *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productData.salePrice || ''}
                    onChange={(e) => setProductData({ ...productData, salePrice: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="৳"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Initial Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productData.stockQuantity || ''}
                    onChange={(e) => setProductData({ ...productData, stockQuantity: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="0"
                  />
                </div>

                {/* Supplier Information Section */}
                <div className="col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Supplier Information</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Select an existing supplier or add a new one</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 tracking-wider mb-1">Select Existing Supplier</label>
                      <select
                        disabled={productData.isNewSupplier}
                        value={productData.supplierId}
                        onChange={(e) => {
                          const s = suppliers.find(sup => sup._id === e.target.value);
                          setProductData({
                            ...productData,
                            supplierId: e.target.value,
                            supplierName: s?.name || '',
                            isNewSupplier: false
                          });
                        }}
                        className="block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-brand focus:border-brand outline-none transition-all"
                      >
                        <option value="">— Choose from list —</option>
                        {suppliers.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.name} {s.phone ? `(${s.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProductData({ ...productData, isNewSupplier: !productData.isNewSupplier, supplierId: '', supplierName: '' })}
                      className={`w-full py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                        productData.isNewSupplier
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-gray-50 dark:bg-slate-900/50 border-transparent text-gray-500 hover:border-brand/30'
                      }`}
                    >
                      {productData.isNewSupplier ? '← Use Existing Supplier' : '+ Add New Supplier Instead'}
                    </button>

                    {productData.isNewSupplier && (
                      <div className="space-y-3 pt-3 p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed dark:border-slate-700">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">New Supplier Name *</label>
                          <input
                            type="text"
                            value={productData.newSupplierName}
                            onChange={(e) => setProductData({ ...productData, newSupplierName: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-1.5 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                            placeholder="Supplier or Company Name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">Contact Person</label>
                            <input
                              type="text"
                              value={productData.newSupplierContact}
                              onChange={(e) => setProductData({ ...productData, newSupplierContact: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-1.5 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">Phone</label>
                            <input
                              type="text"
                              value={productData.newSupplierPhone}
                              onChange={(e) => setProductData({ ...productData, newSupplierPhone: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-1.5 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                              placeholder="01XXXXXXXXX"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">Address</label>
                            <input
                              type="text"
                              value={productData.newSupplierAddress}
                              onChange={(e) => setProductData({ ...productData, newSupplierAddress: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-1.5 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase">Email</label>
                            <input
                              type="email"
                              value={productData.newSupplierEmail}
                              onChange={(e) => setProductData({ ...productData, newSupplierEmail: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-1.5 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-xs font-black uppercase text-white hover:bg-brand-dark focus:outline-none transition-colors tracking-widest"
                >
                  Create Product
                </button>
              </div>
            </form>
          )}

          {/* Supplier Form Tab */}
          {activeTab === 'supplier' && (
            <form onSubmit={handleSupplierSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={supplierData.name}
                    onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. Samsung Bangladesh"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Contact Person</label>
                  <input
                    type="text"
                    value={supplierData.contactPerson}
                    onChange={(e) => setSupplierData({ ...supplierData, contactPerson: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Phone</label>
                  <input
                    type="text"
                    value={supplierData.phone}
                    onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Address</label>
                  <input
                    type="text"
                    value={supplierData.address}
                    onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                    placeholder="e.g. Dhaka, Bangladesh"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={supplierData.email}
                    onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors outline-none"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-xs font-black uppercase text-white hover:bg-brand-dark focus:outline-none transition-colors tracking-widest"
                >
                  Create Supplier
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
