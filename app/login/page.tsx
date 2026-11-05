'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { GLOBAL_CONFIG } from '@/lib/config';
import { LogIn, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Memastikan kolom email dan password dikosongkan secara eksplisit saat halaman direfresh (F5)
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Gagal Login: ' + error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes dynamicGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, #0f172a, #312e81, #581c87, #0f766e, #1e1b4b);
          background-size: 400% 400%;
          animation: dynamicGradient 15s ease infinite;
        }
      `}</style>

      <div className="min-h-screen animated-bg font-sans flex flex-col items-center justify-center p-4 text-slate-100 relative overflow-hidden">
        
        <div className="absolute top-6 left-6 md:top-8 md:left-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-slate-900/60 hover:bg-slate-900/80 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-md backdrop-blur-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>

        <div className="max-w-md w-full bg-slate-900/70 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6 mt-12 md:mt-0 text-white">
          
          <div className="space-y-3 text-center">
            <div className="flex justify-center mb-2">
              {GLOBAL_CONFIG.logoType === 'image' ? (
                <img src={GLOBAL_CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="bg-sky-500/20 text-sky-300 border border-sky-500/30 font-black px-4 py-2.5 rounded-xl text-sm tracking-wider shadow-md">
                  {GLOBAL_CONFIG.logoText}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{GLOBAL_CONFIG.companyName}</h1>
              <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wide mt-0.5">{GLOBAL_CONFIG.departmentName}</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Perusahaan</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  autoComplete="off"
                  name="login_email_guard"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  name="login_password_guard"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-12 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-sky-400/30"
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem 🚀'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-300">
            Belum punya akun?{' '}
            <Link href="/signup" className="text-sky-400 font-bold hover:underline">
              Daftar Mandiri di Sini
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}