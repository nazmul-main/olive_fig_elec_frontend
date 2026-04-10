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
  Speaker,
  Gamepad,
  Headphones,
  Webcam,
  Server,
  Cable
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
    { Icon: Cpu, top: '5%', left: '5%', size: 90, delay: '0s', rotate: 12 },
    { Icon: Zap, top: '10%', left: '85%', size: 70, delay: '1.2s', rotate: -15 },
    { Icon: Settings, top: '75%', left: '10%', size: 100, delay: '0.8s', rotate: 25 },
    { Icon: Smartphone, top: '70%', left: '80%', size: 80, delay: '2.5s', rotate: -10 },
    { Icon: Monitor, top: '40%', left: '88%', size: 110, delay: '1.8s', rotate: 5 },
    { Icon: CircuitBoard, top: '25%', left: '3%', size: 120, delay: '3s', rotate: -20 },
    { Icon: Radio, top: '5%', left: '45%', size: 60, delay: '0.5s', rotate: 45 },
    { Icon: Microchip, top: '85%', left: '55%', size: 95, delay: '2.2s', rotate: -5 },
    { Icon: Battery, top: '60%', left: '2%', size: 80, delay: '1.5s', rotate: -12 },
    { Icon: Bluetooth, top: '20%', left: '92%', size: 50, delay: '0.5s', rotate: 15 },
    { Icon: Wifi, top: '80%', left: '30%', size: 90, delay: '3.5s', rotate: 10 },
    { Icon: Power, top: '2%', left: '75%', size: 70, delay: '2s', rotate: -30 },
    { Icon: HardDrive, top: '55%', left: '95%', size: 80, delay: '1s', rotate: 20 },
    { Icon: Mouse, top: '35%', left: '15%', size: 60, delay: '2.2s', rotate: 0 },
    { Icon: Gamepad, top: '82%', left: '12%', size: 65, delay: '4s', rotate: -10 },
    { Icon: Headphones, top: '15%', left: '35%', size: 55, delay: '1.8s', rotate: 30 },
    { Icon: Webcam, top: '45%', left: '5%', size: 45, delay: '2s', rotate: 20 },
    { Icon: Server, top: '65%', left: '45%', size: 55, delay: '3.2s', rotate: 0 },
    { Icon: Cable, top: '92%', left: '85%', size: 70, delay: '1.5s', rotate: 45 },
  ];

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-slate-950 transition-colors duration-500 overflow-hidden relative">
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.85); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .animate-twinkle {
          animation: twinkle infinite ease-in-out;
        }
        .bg-grid {
          background-image: 
            linear-gradient(to right, rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }
      `}</style>
      
      {/* Tech Grid Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>

      {/* Brighter Twinkling Electronic Stars */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {bgIcons.map((item, idx) => (
          <div 
            key={idx}
            className="absolute animate-twinkle text-brand-light/40"
            style={{ 
              top: item.top, 
              left: item.left, 
              animationDuration: `${(idx % 4 + 2)}s`,
              animationDelay: item.delay,
              transform: `rotate(${item.rotate}deg)`
            }}
          >
            <item.Icon size={item.size} strokeWidth={0.8} />
          </div>
        ))}
        {/* Deep Atmosphere Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Ultra-Compact Minimalist Login Card */}
      <div className="w-full max-w-[400px] bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] border border-white/10 p-10 sm:p-12 transition-all duration-500 hover:border-brand/40 group relative z-10 mx-4">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative mb-6">
             <div className="absolute inset-0 bg-brand/30 blur-2xl rounded-full"></div>
             <img className="h-24 sm:h-28 w-auto object-contain relative transition-transform duration-500 group-hover:scale-105" src="/logo.png" alt="Logo" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[0.15em] uppercase drop-shadow-2xl">Login</h1>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand transition-colors">
              <Mail size={20} />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-14 pr-5 py-4 border border-white/5 rounded-2xl bg-black/40 text-white text-base focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none placeholder:text-white/20 focus:bg-black/60"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-white/30 group-focus-within:text-brand transition-colors">
              <Lock size={20} />
            </div>
            <input
              type="password"
              required
              className="block w-full pl-14 pr-5 py-4 border border-white/5 rounded-2xl bg-black/40 text-white text-base focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none placeholder:text-white/20 focus:bg-black/60"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-5 bg-brand hover:bg-brand-dark text-white rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-xl shadow-brand/20 mt-4 overflow-hidden relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
            {isLoading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
