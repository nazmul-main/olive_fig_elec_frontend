'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import toast from 'react-hot-toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data } = await api.get('/sales');
      if (data.success) {
        setSales(data.sales);
      }
    } catch (e) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Invoice No', accessor: 'invoiceNo' },
    { header: 'Date', render: (row) => new Date(row.saleDate).toLocaleDateString() },
    { header: 'Customer', render: (row) => `${row.customerName} ${row.customerPhone ? '- ' + row.customerPhone : ''}` },
    { header: 'Items', render: (row) => row.items.reduce((acc, curr) => acc + curr.quantity, 0) },
    { header: 'Grand Total', render: (row) => `৳${row.grandTotal.toLocaleString()}` },
    { header: 'Method', render: (row) => <span className="capitalize">{row.paymentMethod}</span> },
    { header: 'Sold By', render: (row) => row.soldBy?.name },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales History</h1>
      </div>

      {loading ? <p>Loading sales...</p> : (
        <DataTable columns={columns} data={sales} />
      )}
    </div>
  );
}


