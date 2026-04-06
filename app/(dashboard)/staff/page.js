'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function StaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'salesman' });

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
      // Create system user (admin only has this power)
      await api.post('/auth/register', formData);
      toast.success('Staff/User created');
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating user');
    }
  };

  const handleToggleState = async (user) => {
    if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}? They will ${user.isActive ? 'NOT ' : ''}be able to login.`)) {
       try {
         await api.patch(`/auth/users/${user._id}/toggle`);
         toast.success('User status updated');
         fetchUsers();
       } catch(e) {
         toast.error('Error updating status');
       }
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
        <button onClick={handleOpenModal} className="bg-brand text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add User</button>
      </div>

      {loading ? <p>Loading staff...</p> : (
        <DataTable columns={columns} data={users} onDelete={handleToggleState} />
      )}

      {/* Note: In DataTable, onDelete triggers the "toggle", so the text will say "Delete" but it actually deactivates */}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add System User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm">Email Address (Used for Login)</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm">Password</label>
            <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border rounded p-2" placeholder="Min 6 characters" />
          </div>
          <div>
             <label className="block text-sm">Role</label>
             <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="mt-1 w-full border rounded p-2">
               <option value="admin">Admin (Full Access)</option>
               <option value="manager">Manager (No Auth/Staff controls)</option>
               <option value="salesman">Salesman (Only POS & Products)</option>
             </select>
          </div>
          <div className="mt-5">
            <button type="submit" className="w-full bg-brand text-white py-2 rounded">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


