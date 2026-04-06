'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/ui/StatsCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard');
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Failed to load stats.</div>;

  const { stats: dStats, recentSales, lowStockProducts } = stats;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Today's Sales" 
          value={`৳ ${dStats.todayRevenue.toLocaleString()}`} 
          subtitle={`${dStats.todaySalesCount} orders today`} 
        />
        <StatsCard 
          title="Monthly Revenue" 
          value={`৳ ${dStats.monthlyRevenue.toLocaleString()}`} 
          subtitle={`${dStats.monthlySalesCount} orders this month`} 
        />
        <StatsCard 
          title="Monthly Profit" 
          value={`৳ ${dStats.monthlyProfit.toLocaleString()}`} 
          valueColor={dStats.monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}
          subtitle={`After expenses ৳${dStats.monthlyExpenses}`} 
        />
        <StatsCard 
          title="Valuation (Stock)" 
          value={`৳ ${dStats.stockValue.toLocaleString()}`} 
          subtitle={`${dStats.totalProducts} active products`} 
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mt-8">
        {/* Recent Sales */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Sales</h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {recentSales?.map(sale => (
                <li key={sale._id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sale.invoiceNo} • {sale.customerName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       ৳ {sale.grandTotal}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {recentSales?.length === 0 && <p className="text-sm text-gray-500">No recent sales.</p>}
            </ul>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 text-red-600">Low Stock Alerts</h3>
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {lowStockProducts?.map(prod => (
                <li key={prod._id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                      <p className="text-sm text-gray-500 truncate">SKU: {prod.sku}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prod.stockQuantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {prod.stockQuantity} in stock
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {lowStockProducts?.length === 0 && <p className="text-sm text-gray-500">All stocks are sufficient.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


