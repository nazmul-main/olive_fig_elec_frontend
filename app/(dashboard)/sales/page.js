'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const { user } = useAuthStore();

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

  const handleDeleteClick = (sale) => {
    setSelectedSale(sale);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (password) => {
    try {
      setIsDeleting(true);
      const { data } = await api({
        method: 'delete',
        url: `/sales/${selectedSale._id}`,
        data: { password }
      });
      if (data.success) {
        toast.success(data.message || 'Sale deleted and stock restored');
        fetchSales();
        setShowDeleteModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete sale');
    } finally {
      setIsDeleting(false);
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

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={sales} 
          onDelete={user?.role === 'admin' ? handleDeleteClick : null}
        />
      )}

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`Delete Invoice ${selectedSale?.invoiceNo}?`}
      />
    </div>
  );
}


