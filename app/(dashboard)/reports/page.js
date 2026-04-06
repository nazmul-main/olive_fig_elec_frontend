'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import StatsCard from '@/components/ui/StatsCard';

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
        <h1 className="text-2xl font-semibold text-gray-900">Business Reports</h1>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-1 text-sm text-gray-700" />
          <span className="text-gray-500 self-center">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-1 text-sm text-gray-700" />
          <button onClick={fetchReport} className="bg-brand text-white text-sm px-4 py-1 rounded">Update</button>
        </div>
      </div>

      {salesReport && (
        <div className="space-y-6">
           <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Profit & Loss (P&L) Summary</h2>
           <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
             <StatsCard title="Total Revenue" value={`৳ ${salesReport.summary.totalRevenue.toLocaleString()}`} />
             <StatsCard title="Cost of Goods (CGS)" value={`৳ ${salesReport.summary.totalCost.toLocaleString()}`} />
             <StatsCard title="Total Expenses" value={`৳ ${salesReport.summary.totalExpenses.toLocaleString()}`} valueColor="text-red-500" />
             <StatsCard title="Net Profit" value={`৳ ${salesReport.summary.netProfit.toLocaleString()}`} valueColor={salesReport.summary.netProfit >= 0 ? "text-green-600" : "text-red-600"} />
           </div>

           <div className="bg-white shadow rounded-lg p-6 mt-8">
              <h3 className="text-md font-medium text-gray-800 mb-4">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales Count</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGS</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesReport.data.map((dayData, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 text-sm text-gray-900">{dayData._id.day}/{dayData._id.month}/{dayData._id.year}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">{dayData.count}</td>
                          <td className="px-6 py-4 text-sm text-green-600 font-medium text-right">৳{dayData.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-red-500 text-right">৳{dayData.purchaseCost.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-brand font-medium text-right">৳{(dayData.revenue - dayData.purchaseCost).toLocaleString()}</td>
                        </tr>
                      ))}
                      {salesReport.data.length === 0 && (
                        <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No sales in this period.</td></tr>
                      )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}


