'use client';
import { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      toast.success('Login Successful');
      router.push('/');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-500 overflow-hidden">
      <div className="w-full max-w-[380px] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700/50 p-8 sm:p-10 transform transition-all">
        <div className="text-center mb-6 flex flex-col items-center">
          <img className="h-28 w-auto object-contain mb-4 transition-transform hover:scale-105" src="/logo.png" alt="Logo" />
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-[0.2em] uppercase">Login</h1>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
              <Mail size={16} />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700/30 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand transition-colors">
              <Lock size={16} />
            </div>
            <input
              type="password"
              required
              className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-700/30 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-brand hover:brightness-110 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center shadow-lg shadow-brand/20 mt-2"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ...
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}



