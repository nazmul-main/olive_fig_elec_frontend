'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';

export default function StaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'salesman' });
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({ name: '', email: '', password: '', role: 'salesman' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      toast.success('Staff/User created');
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating user');
    }
  };

  const handleToggleClick = (user) => {
    setUserToToggle(user);
    setShowToggleModal(true);
  };

  const confirmToggle = async (password) => {
    try {
      setIsToggling(true);
      const { data } = await api.patch(`/auth/users/${userToToggle._id}/toggle`, { password });
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
        setShowToggleModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating status');
    } finally {
      setIsToggling(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', render: (row) => <span className="capitalize font-medium text-brand">{row.role}</span> },
    { header: 'Joined', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: 'Status', render: (row) => (
       <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
         {row.isActive ? 'Active' : 'Inactive'}
       </span>
    )},
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-semibold text-gray-900">Staff & System Users</h1>
           <p className="text-sm text-gray-500">Manage who can log into the ERP.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button onClick={handleOpenModal} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors">Add User</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          onDelete={currentUser?.role === 'admin' ? handleToggleClick : null} 
        />
      )}

      {/* Note: onDelete acts as the 'toggle' trigger for users */}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add System User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" placeholder="Min 6 characters" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Role</label>
             <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm">
               <option value="admin">Admin (Full Access)</option>
               <option value="manager">Manager (No Auth/Staff controls)</option>
               <option value="salesman">Salesman (Only POS & Products)</option>
             </select>
          </div>
          <div className="mt-5 sm:mt-6">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm transition-colors">
              Create User
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={showToggleModal}
        onClose={() => setShowToggleModal(false)}
        onConfirm={confirmToggle}
        loading={isToggling}
        title={userToToggle?.isActive ? `Deactivate ${userToToggle?.name}?` : `Activate ${userToToggle?.name}?`}
      />
    </div>
  );
}


