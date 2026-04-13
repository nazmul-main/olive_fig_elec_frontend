'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Search, UserPlus, Phone, CreditCard, History, DollarSign, Trash2, FileUp } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import useAuthStore from '@/store/useAuthStore';
import * as XLSX from 'xlsx';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  
  // Form states
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', email: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get(`/customers?search=${search}`);
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (e) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/customers', newCustomer);
      if (data.success) {
        toast.success('Customer added!');
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', address: '', email: '' });
        fetchCustomers();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add customer');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/customers/${selectedCustomer._id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod,
      });
      if (data.success) {
        toast.success('Payment recorded!');
        setShowPaymentModal(false);
        setPaymentAmount('');
        fetchCustomers();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed');
    }
  };

  const handleDeleteClick = (customer) => {
    if (user?.role !== 'admin') {
      return toast.error('Access denied. Admins only.');
    }
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing full customer ledger...');
    try {
      // Fetch all records (search already handled by backend if needed, but here we fetch all for export)
      const { data } = await api.get(`/customers?search=${search}`);
      if (!data.success || !data.customers) throw new Error('Failed to fetch customers');

      const exportData = data.customers.map(c => ({
        'Name': c.name,
        'Phone': c.phone || 'N/A',
        'Email': c.email || 'N/A',
        'Address': c.address || 'N/A',
        'Total Purchased': c.totalPurchased || 0,
        'Total Paid': c.totalPaid || 0,
        'Total Due': c.totalDue || 0,
        'Last Transaction': c.lastTransactionDate ? new Date(c.lastTransactionDate).toLocaleDateString() : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

      XLSX.writeFile(workbook, `Customer_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Customer ledger downloaded!', { id: toastId });
    } catch (e) {
      toast.error('Failed to export report', { id: toastId });
    }
  };

  const totalReceivables = customers.reduce((acc, c) => acc + c.totalDue, 0);
  const totalCollections = customers.reduce((acc, c) => acc + c.totalPaid, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none text-brand">Customer Ledger</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Manage receivables & collection history</p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-brand/20 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
               <button 
                 onClick={handleExportExcel}
                 disabled={customers.length === 0}
                 title="Export Customer Report"
                 className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
               >
                 <FileUp size={18} />
               </button>

               {(user?.role === 'admin' || user?.role === 'manager') && (
                 <button 
                  onClick={() => setShowAddModal(true)} 
                  title="Add New Customer"
                  className="w-10 h-10 flex items-center justify-center bg-brand hover:bg-brand-dark text-white rounded-xl transition-all shadow-lg shadow-brand/20 shrink-0"
                 >
                   <UserPlus size={20} />
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700 shadow-sm">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Accounts</p>
           <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 uppercase leading-none">{customers.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700 shadow-sm border-l-4 border-l-red-500">
           <p className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Total Receivables</p>
           <h3 className="text-2xl font-black text-red-600 mt-1 leading-none uppercase tracking-tighter">
             ৳{totalReceivables.toLocaleString()}
           </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border dark:border-slate-700 shadow-sm border-l-4 border-l-green-500">
           <p className="text-[9px] font-black text-green-500/60 uppercase tracking-widest">Total Collected</p>
           <h3 className="text-2xl font-black text-green-600 mt-1 leading-none uppercase tracking-tighter">
             ৳{totalCollections.toLocaleString()}
           </h3>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 text-sm uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Customer Info</th>
              <th className="px-6 py-4">Total Due</th>
              <th className="px-6 py-4">Total Paid</th>
              <th className="px-6 py-4">Payment Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {customers.map(c => (
              <tr 
                key={c._id} 
                className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => { setSelectedCustomer(c); setShowPaymentModal(true); }}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center space-x-1">
                    <Phone size={12} /> <span>{c.phone || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${c.totalDue > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ৳{c.totalDue.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-green-600">৳{c.totalPaid.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                    {c.totalDue > 0 ? (
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit space-x-1">
                        <DollarSign size={12} />
                        <span>Pay Due</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-500 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800">
                        Payment Clear ✨
                      </span>
                    )}
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center space-x-2">
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteClick(c)}
                        className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && !loading && (
          <div className="p-10 text-center text-gray-500">No customers found.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center space-x-2">
              <UserPlus className="text-brand" />
              <span>Add New Customer</span>
            </h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <input 
                type="text" required placeholder="Full Name" 
                className="w-full border dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white"
                value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              />
              <input 
                type="text" placeholder="Phone Number" 
                className="w-full border dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white"
                value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
              <input 
                type="email" placeholder="Email (Optional)" 
                className="w-full border dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white"
                value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
              />
              <textarea 
                placeholder="Address" 
                className="w-full border dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white"
                value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
              />
              <div className="flex space-x-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-2 dark:text-white">Collect Payment</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Customer: <span className="text-gray-900 dark:text-white font-bold">{selectedCustomer?.name}</span></p>
            
            <form onSubmit={handlePayment} className="space-y-4">
              {selectedCustomer?.totalDue > 0 ? (
                <>
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl mb-4 flex justify-between items-center border border-red-100 dark:border-red-900/20">
                    <span className="text-red-600 dark:text-red-400 font-medium">Current Outstanding:</span>
                    <span className="text-red-600 dark:text-red-400 font-bold text-lg">৳{selectedCustomer?.totalDue.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Paying Amount</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="0.00" 
                      max={selectedCustomer?.totalDue}
                      className="w-full border dark:border-slate-700 border-green-200 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white font-bold text-xl"
                      value={paymentAmount} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (val <= selectedCustomer?.totalDue) {
                          setPaymentAmount(e.target.value);
                        } else {
                          toast.error(`Cannot pay more than ৳${selectedCustomer.totalDue}`);
                          setPaymentAmount(selectedCustomer.totalDue);
                        }
                      }}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">* Maximum payable: ৳{selectedCustomer?.totalDue}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">Payment Method</label>
                    <select 
                      className="w-full border dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 dark:text-white"
                      value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="card">Card</option>
                    </select>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Discard</button>
                    <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-600/20">Confirm Payment</button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center space-y-4">
                   <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                     🎉
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Congratulations!</h3>
                   <p className="text-gray-500 dark:text-slate-400">All payments are clear for this customer. No outstanding due found.</p>
                   <button 
                     type="button" 
                     onClick={() => setShowPaymentModal(false)} 
                     className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl"
                   >
                     Thank You
                   </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title={`Delete Customer: ${customerToDelete?.name}?`}
        description={`This will permanently remove ${customerToDelete?.name} and all their history from the ledger. Please enter admin password to confirm.`}
      />
    </div>
  );
}
