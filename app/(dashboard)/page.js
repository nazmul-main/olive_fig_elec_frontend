'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import StatsCard from '@/components/ui/StatsCard';
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
  ChevronRight
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
