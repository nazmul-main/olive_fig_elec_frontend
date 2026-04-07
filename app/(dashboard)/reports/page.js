'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/ui/StatsCard';
import DataTable from '@/components/ui/DataTable';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  BarChart3,
  Calendar
} from 'lucide-react';

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default to current month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(startOfMonth);
  const [endDate, setEndDate] = useState(endOfMonth);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
      if (data.success) {
        setSalesReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !salesReport) return <p>Loading report data...</p>;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Business Reports</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border dark:border-slate-600 rounded px-3 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 transition-colors" />
          <span className="text-gray-500 dark:text-slate-400 self-center">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border dark:border-slate-600 rounded px-3 py-1 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 transition-colors" />
          <button onClick={fetchReport} className="bg-brand text-white text-sm px-4 py-1 rounded hover:bg-brand-dark transition-colors">Update</button>
        </div>
      </div>

      {salesReport && (
        <div className="space-y-6">
           <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-slate-700 pb-2">Profit & Loss (P&L) Summary</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard 
                title="Total Revenue" 
                value={`৳ ${salesReport.summary.totalRevenue.toLocaleString()}`} 
                icon={<TrendingUp size={24} />}
              />
              <StatsCard 
                title="Cost of Goods (CGS)" 
                value={`৳ ${salesReport.summary.totalCost.toLocaleString()}`} 
                icon={<ShoppingBag size={24} />}
              />
              <StatsCard 
                title="Total Expenses" 
                value={`৳ ${salesReport.summary.totalExpenses.toLocaleString()}`} 
                valueColor="text-red-500" 
                icon={<Wallet size={24} className="text-red-500" />}
              />
              <StatsCard 
                title="Net Profit" 
                value={`৳ ${salesReport.summary.netProfit.toLocaleString()}`} 
                valueColor={salesReport.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"} 
                icon={<BarChart3 size={24} className={salesReport.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"} />}
              />
            </div>

           <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mt-8 transition-colors duration-300">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Daily Breakdown</h3>
              <DataTable 
                data={salesReport.data}
                itemsPerPage={8}
                columns={[
                  { header: 'Date', render: (row) => `${row._id.day}/${row._id.month}/${row._id.year}` },
                  { header: 'Sales Count', headerClassName: 'text-right', render: (row) => <div className="text-right">{row.count}</div> },
                  { header: 'Revenue', headerClassName: 'text-right', render: (row) => <div className="text-right text-green-600 dark:text-green-400 font-medium">৳{row.revenue.toLocaleString()}</div> },
                  { header: 'CGS', headerClassName: 'text-right', render: (row) => <div className="text-right text-red-500 dark:text-red-400">৳{row.purchaseCost.toLocaleString()}</div> },
                  { header: 'Gross Profit', headerClassName: 'text-right', render: (row) => <div className="text-right text-brand font-medium">৳{(row.revenue - row.purchaseCost).toLocaleString()}</div> },
                ]}
              />
           </div>
        </div>
      )}
    </div>
  );
}


