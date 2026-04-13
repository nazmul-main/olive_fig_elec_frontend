'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { Save, Store, Mail, Phone, MapPin, Building, Link as LinkIcon, DollarSign } from 'lucide-react';
import Loading from '@/components/ui/Loading';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    businessName: '',
    phone: '',
    email: '',
    address: '',
    vatPercentage: 0,
    logoUrl: '',
    currency: '৳',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (user?.role !== 'admin') {
      return toast.error('Only admins can update settings');
    }
    
    setSaving(true);
    const toastId = toast.loading('Saving business settings...');
    try {
      const { data } = await api.put('/settings', settings);
      if (data.success) {
        toast.success('Settings updated successfully', { id: toastId });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update settings', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border dark:border-slate-700 shadow-xl shadow-gray-200/40 dark:shadow-none transition-all">
        <div className="flex items-center gap-4 border-b border-gray-100 dark:border-slate-700 pb-6 mb-6">
          <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0">
            <Store size={28} />
          </div>
          <div>
             <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Business Profile</h1>
             <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">Manage system-wide configuration & invoice details</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Business Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Building size={14} /> Business Name
              </label>
              <input 
                type="text" 
                value={settings.businessName}
                onChange={e => setSettings({...settings, businessName: e.target.value})}
                disabled={user?.role !== 'admin'}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                value={settings.email}
                onChange={e => setSettings({...settings, email: e.target.value})}
                disabled={user?.role !== 'admin'}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Phone size={14} /> Contact Number
              </label>
              <input 
                type="text" 
                value={settings.phone}
                onChange={e => setSettings({...settings, phone: e.target.value})}
                disabled={user?.role !== 'admin'}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <DollarSign size={14} /> Currency Symbol
              </label>
              <input 
                type="text" 
                value={settings.currency}
                onChange={e => setSettings({...settings, currency: e.target.value})}
                disabled={user?.role !== 'admin'}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <MapPin size={14} /> Primary Address
              </label>
              <textarea 
                value={settings.address}
                onChange={e => setSettings({...settings, address: e.target.value})}
                disabled={user?.role !== 'admin'}
                rows={2}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* VAT */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                % Global VAT Percentage
              </label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={settings.vatPercentage}
                onChange={e => setSettings({...settings, vatPercentage: Number(e.target.value)})}
                disabled={user?.role !== 'admin'}
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
              <p className="text-[10px] text-gray-400">Used as default VAT % in new invoices.</p>
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                <LinkIcon size={14} /> Logo URL / Path
              </label>
              <input 
                type="text" 
                value={settings.logoUrl}
                onChange={e => setSettings({...settings, logoUrl: e.target.value})}
                disabled={user?.role !== 'admin'}
                placeholder="/only-logo.png"
                className="w-full bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all disabled:opacity-50"
              />
              <p className="text-[10px] text-gray-400">Enter a public image URL or a local path like <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">/only-logo.png</code></p>
            </div>
            
          </div>

          {user?.role === 'admin' && (
            <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
               <button 
                 type="submit"
                 disabled={saving}
                 className="w-full md:w-auto px-8 h-12 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-70"
               >
                 {saving ? (
                   <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</>
                 ) : (
                   <><Save size={16} /> Save Settings</>
                 )}
               </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
