'use client';
import { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  Cpu,
  Settings,
  Zap,
  Smartphone,
  Monitor,
  CircuitBoard,
  Radio,
  Microchip,
  Waves,
  Battery,
  Bluetooth,
  Wifi,
  Power,
  HardDrive,
  Mouse,
  Keyboard,
  Headset,
  Speaker
} from 'lucide-react';

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

  const bgIcons = [
    { Icon: Cpu, top: '5%', left: '5%', size: 90, duration: '8s', delay: '0s', rotate: 12 },
    { Icon: Zap, top: '10%', left: '85%', size: 70, duration: '10s', delay: '1.2s', rotate: -15 },
    { Icon: Settings, top: '75%', left: '10%', size: 100, duration: '12s', delay: '0.8s', rotate: 25 },
    { Icon: Smartphone, top: '70%', left: '80%', size: 80, duration: '9s', delay: '2.5s', rotate: -10 },
    { Icon: Monitor, top: '40%', left: '88%', size: 110, duration: '11s', delay: '1.8s', rotate: 5 },
    { Icon: CircuitBoard, top: '25%', left: '3%', size: 120, duration: '15s', delay: '3s', rotate: -20 },
    { Icon: Radio, top: '5%', left: '45%', size: 60, duration: '7s', delay: '0.5s', rotate: 45 },
    { Icon: Microchip, top: '85%', left: '55%', size: 95, duration: '13s', delay: '2.2s', rotate: -5 },
    { Icon: Battery, top: '60%', left: '2%', size: 80, duration: '10s', delay: '1.5s', rotate: -12 },
    { Icon: Bluetooth, top: '20%', left: '92%', size: 50, duration: '8s', delay: '0.5s', rotate: 15 },
    { Icon: Wifi, top: '85%', left: '30%', size: 90, duration: '9s', delay: '3.5s', rotate: 10 },
    { Icon: Power, top: '2%', left: '75%', size: 70, duration: '11s', delay: '2s', rotate: -30 },
    { Icon: HardDrive, top: '55%', left: '95%', size: 80, duration: '14s', delay: '1s', rotate: 20 },
    { Icon: Mouse, top: '35%', left: '15%', size: 60, duration: '10s', delay: '2.2s', rotate: 0 },
  ];

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-slate-950 transition-colors duration-500 overflow-hidden relative">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-40px) rotate(15deg); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
        .bg-grid {
          background-image: 
            linear-gradient(to right, rgba(59,130,246,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.05) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
      
      {/* Tech Grid Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>

      {/* Dynamic Electronic Universe */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {bgIcons.map((item, idx) => (
          <div 
            key={idx}
            className="absolute animate-float text-brand/10"
            style={{ 
              top: item.top, 
              left: item.left, 
              animationDuration: item.duration,
              animationDelay: item.delay,
              transform: `rotate(${item.rotate}deg)`
            }}
          >
            <item.Icon size={item.size} strokeWidth={0.5} />
          </div>
        ))}
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
      </div>

      {/* Premium Compact Login Card */}
      <div className="w-full max-w-[400px] bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.9)] border border-white/10 p-8 sm:p-10 transition-all duration-500 hover:border-brand/40 group relative z-10 mx-4">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-brand/40 blur-3xl rounded-full"></div>
             <img className="h-24 sm:h-28 w-auto object-contain relative transition-transform duration-500 group-hover:scale-105" src="/logo.png" alt="Logo" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] uppercase drop-shadow-2xl">Login</h1>
          <div className="h-1 w-12 bg-brand rounded-full mt-3 mx-auto group-hover:w-16 transition-all duration-500"></div>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleLogin}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand transition-colors">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-5 py-3.5 sm:py-4 border border-white/5 rounded-2xl bg-black/40 text-white text-sm sm:text-base focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none placeholder:text-white/20 focus:bg-black/60 shadow-inner"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand transition-colors">
              <Lock size={18} />
            </div>
            <input
              type="password"
              required
              className="block w-full pl-12 pr-5 py-3.5 sm:py-4 border border-white/5 rounded-2xl bg-black/40 text-white text-sm sm:text-base focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none placeholder:text-white/20 focus:bg-black/60 shadow-inner"
              placeholder="Secure Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black text-sm sm:text-base uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-2xl shadow-brand/40 mt-4 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            {isLoading ? (
              <div className="flex items-center text-white text-sm">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </div>
            ) : (
              "Secure Entrance"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
