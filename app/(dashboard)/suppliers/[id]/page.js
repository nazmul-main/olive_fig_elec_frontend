'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { ArrowLeft, Truck, Plus, CheckCircle, AlertCircle, Phone, User, MapPin, PackagePlus, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [supplier, setSupplier] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', paymentDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    try {
      const [sRes, pRes, pmRes] = await Promise.all([
        api.get(`/suppliers/${id}`),
        api.get(`/purchases/by-supplier/${id}`),
        api.get(`/suppliers/${id}/payments`),
      ]);
      if (sRes.data.success) setSupplier(sRes.data.supplier);
      if (pRes.data.success) setPurchases(pRes.data.purchases);
      if (pmRes.data.success) setPayments(pmRes.data.payments);
    } catch { toast.error('Failed to load supplier details'); }
    finally { setLoading(false); }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const { data } = await api.post(`/suppliers/${id}/payments`, {
        amount: Number(paymentForm.amount),
        note: paymentForm.note,
        paymentDate: paymentForm.paymentDate || undefined,
      });
      if (data.success) {
        toast.success('Payment recorded successfully!');
        setIsPaymentModalOpen(false);
        setPaymentForm({ amount: '', note: '', paymentDate: '' });
        fetchAll();
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Error recording payment'); }
    finally { setIsSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div></div>;
  if (!supplier) return <div className="text-center py-20 text-gray-500">Supplier not found.</div>;

  const due = supplier.totalPurchased - supplier.totalPaid;
  const paidPercent = supplier.totalPurchased > 0 ? Math.round((supplier.totalPaid / supplier.totalPurchased) * 100) : 100;

  const inputCls = "mt-1 block w-full border border-gray-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-300";

  return (
    <div>
      {/* Back Button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand dark:text-slate-400 dark:hover:text-brand transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Suppliers
      </button>

      {/* Supplier Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl uppercase">
              {supplier.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {supplier.name}
                {due === 0 ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
              </h1>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
                {supplier.contactPerson && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{supplier.contactPerson}</span>}
                {supplier.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{supplier.phone}</span>}
                {supplier.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{supplier.address}</span>}
              </div>
            </div>
          </div>

          {(user?.role === 'admin' || user?.role === 'manager') && due > 0 && (
            <button onClick={() => setIsPaymentModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors whitespace-nowrap">
              <Banknote className="h-4 w-4" /> Record Payment
            </button>
          )}
        </div>

        {/* financials */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Purchased</p>
            <p className="text-xl font-bold text-brand mt-1">৳{supplier.totalPurchased.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">৳{supplier.totalPaid.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-red-400 uppercase tracking-wide">Due Amount</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">৳{due.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress */}
        {supplier.totalPurchased > 0 && (
          <div className="mt-4">
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${paidPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">{paidPercent}% of total amount paid</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('purchases')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'purchases' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
          Purchase History ({purchases.length})
        </button>
        <button onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'payments' ? 'bg-white dark:bg-slate-700 text-brand shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
          Payment History ({payments.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {activeTab === 'purchases' ? (
          purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              <PackagePlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No purchases recorded yet from this supplier.</p>
              <Link href="/purchases" className="mt-2 inline-block text-sm text-brand hover:underline">Make a purchase →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    {['Date', 'Product', 'Code', 'Category', 'Qty', 'Purchase Price', 'Sale Price', 'Total', 'Paid', 'Due'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {purchases.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 whitespace-nowrap">{new Date(p.purchaseDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 font-mono">{p.productCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.category}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{p.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">৳{p.purchasePrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">৳{p.salePrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">৳{p.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">৳{p.paidAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <span className={p.dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-500'}>
                          ৳{p.dueAmount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          payments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              <Banknote className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No payments recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    {['Date', 'Amount', 'Note', 'Recorded By'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">৳{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.note || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">{p.createdBy?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Record Payment — ${supplier.name}`}>
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Current Due Amount: <strong>৳{due.toLocaleString()}</strong></p>
        </div>
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Amount (৳) *</label>
            <input type="number" min="1" max={due} required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className={inputCls} placeholder={`Max: ৳${due.toLocaleString()}`} />
          </div>
          <div>
            <label className={labelCls}>Payment Date</label>
            <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Note (optional)</label>
            <input type="text" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} className={inputCls} placeholder="e.g. March installment payment" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors disabled:opacity-50">
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
