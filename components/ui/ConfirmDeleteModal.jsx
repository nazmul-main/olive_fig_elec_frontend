'use client';
import { useState } from 'react';
import Modal from './Modal';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = 'Confirm Deletion', loading = false }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
    setPassword('');
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">
          This action is irreversible. For security, please enter your administrator password to confirm deletion.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
