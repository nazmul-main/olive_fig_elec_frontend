'use client';
import { useState } from 'react';
import Modal from './Modal';

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Deletion', 
  description = 'This action is irreversible. For security, please enter your administrator password to confirm deletion.',
  confirmText = 'Delete Permanently',
  confirmColor = 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  loading = false 
}) {
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
          {description}
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
            className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmColor}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
