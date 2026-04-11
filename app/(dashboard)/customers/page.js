'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Search, UserPlus, Phone, CreditCard, History, DollarSign, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import useAuthStore from '@/store/useAuthStore';

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

  const confirmDelete = async (password) => {
    setIsDeleting(true);
    try {
      const { data } = await api.delete(`/customers/${customerToDelete._id}`, {
        data: { password } // Sending password in body for DELETE
      });
      if (data.success) {
        toast.success('Customer deleted successfully');
        setShowDeleteModal(false);
        fetchCustomers();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete customer');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customer Ledger</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-brand-dark transition-all"
        >
          <UserPlus size={18} />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </span>
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-brand shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
           <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Customers</p>
           <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{customers.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
           <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Receivables (Dues)</p>
           <h3 className="text-3xl font-bold text-red-500 mt-1">
             ৳{customers.reduce((acc, c) => acc + c.totalDue, 0).toLocaleString()}
           </h3>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
           <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Collections</p>
           <h3 className="text-3xl font-bold text-green-500 mt-1">
             ৳{customers.reduce((acc, c) => acc + c.totalPaid, 0).toLocaleString()}
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
