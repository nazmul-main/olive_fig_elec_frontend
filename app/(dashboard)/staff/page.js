'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import * as XLSX from 'xlsx';

export default function StaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
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
    setIsEditMode(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '', password: '', role: 'salesman' });
    setIsModalOpen(true);
  };

  const handleEditClick = (user) => {
    setIsEditMode(true);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave blank unless changing
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      // For editing, we trigger the confirmation modal first
      setShowConfirmEditModal(true);
    } else {
      // Create mode
      try {
        await api.post('/auth/register', formData);
        toast.success('Staff/User created');
        setIsModalOpen(false);
        fetchUsers();
      } catch (e) {
        toast.error(e.response?.data?.message || 'Error creating user');
      }
    }
  };

  const confirmEdit = async (adminPassword) => {
    try {
      setIsActionLoading(true);
      const { data } = await api({
        method: 'put',
        url: `/auth/users/${selectedUser._id}`,
        data: { ...formData, adminPassword }
      });
      if (data.success) {
        toast.success('User updated successfully');
        fetchUsers();
        setIsModalOpen(false);
        setShowConfirmEditModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleClick = (user) => {
    setUserToToggle(user);
    setShowToggleModal(true);
  };

  const confirmToggle = async (password) => {
    try {
      setIsActionLoading(true);
      const { data } = await api({
        method: 'patch',
        url: `/auth/users/${userToToggle._id}/toggle`,
        data: { password }
      });
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
        setShowToggleModal(false);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating status');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportData = users.map(u => ({
        'Full Name': u.name,
        'Email Address': u.email,
        'Role': u.role.toUpperCase(),
        'Joined Date': new Date(u.createdAt).toLocaleDateString(),
        'Status': u.isActive ? 'ACTIVE' : 'INACTIVE'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "System Users");

      XLSX.writeFile(workbook, `Staff_List_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Staff list exported!');
    } catch (e) {
      toast.error('Failed to export list');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', render: (row) => <span className="capitalize font-black text-brand tracking-tight">{row.role}</span> },
    { header: 'Joined', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Status', render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-500/10 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
              <svg size={24} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">System Users</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Manage administrative & staff access</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
            <button
              onClick={handleExportExcel}
              disabled={users.length === 0}
              title="Export Users List"
              className="w-10 h-10 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 shrink-0"
            >
              <svg size={18} className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={handleOpenModal}
                title="Create New User"
                className="flex items-center justify-center gap-2 px-6 h-10 bg-brand hover:bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20"
              >
                <svg size={16} className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="hidden sm:inline">Add User</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-xl overflow-hidden transition-all text-xs">
          <DataTable
            columns={columns}
            data={users}
            onEdit={currentUser?.role === 'admin' ? handleEditClick : null}
            onDelete={currentUser?.role === 'admin' ? handleToggleClick : null}
          />
        </div>
      )}

      {/* Note: onDelete acts as the 'toggle' trigger for users */}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? 'Edit System User' : 'Add System User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{isEditMode ? 'New Password (Leave blank to keep current)' : 'Password'}</label>
            <input type="text" required={!isEditMode} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm" placeholder={isEditMode ? "New password" : "Min 6 characters"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand focus:border-brand sm:text-sm">
              <option value="admin">Admin (Full Access)</option>
              <option value="manager">Manager (No Auth/Staff controls)</option>
              <option value="salesman">Salesman (Only POS & Products)</option>
            </select>
          </div>
          <div className="mt-5 sm:mt-6">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand text-base font-medium text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm transition-colors">
              {isEditMode ? 'Update User Information' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={showToggleModal}
        onClose={() => setShowToggleModal(false)}
        onConfirm={confirmToggle}
        loading={isActionLoading}
        title={userToToggle?.isActive ? `Deactivate ${userToToggle?.name}?` : `Activate ${userToToggle?.name}?`}
      />

      <ConfirmDeleteModal
        isOpen={showConfirmEditModal}
        onClose={() => setShowConfirmEditModal(false)}
        onConfirm={confirmEdit}
        loading={isActionLoading}
        title={`Update Info for ${selectedUser?.name}?`}
        description="For security, please enter your administrator password to confirm these changes."
        confirmText="Update Information"
        confirmColor="bg-brand hover:bg-brand-dark focus:ring-brand"
      />
    </div>
  );
}


