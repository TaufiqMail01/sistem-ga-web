'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { GLOBAL_CONFIG } from '@/lib/config';
import { UserPlus, Lock, Mail, User, Eye, EyeOff, ShieldCheck, ArrowLeft, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [businessManagerEmail, setBusinessManagerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Memastikan semua state input dikosongkan secara eksplisit saat halaman direfresh (F5)
  useEffect(() => {
    setFullName('');
    setEmail('');
    setBusinessManagerEmail('');
    setPassword('');
    setArea('');
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) {
      alert('Silakan pilih Area / Penempatan terlebih dahulu.');
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_manager_email: businessManagerEmail,
          area: area,
        }
      }
    });

    if (authError) {
      alert('Gagal Mendaftar: ' + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      alert('Pendaftaran mandiri berhasil! Akun Anda terdaftar sebagai Staf Biasa. Silakan login.');
      router.push('/login');
    }
    setLoading(false);
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
            className="inline-flex items-center gap-2 bg-slate-900/65 hover:bg-slate-900/85 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-md backdrop-blur-md cursor-pointer"
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
                <div className="bg-sky-500/25 text-sky-300 border border-sky-500/30 font-black px-4 py-2.5 rounded-xl text-sm tracking-wider shadow-md">
                  {GLOBAL_CONFIG.logoText}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{GLOBAL_CONFIG.companyName}</h1>
              <p className="text-[11px] text-slate-300 font-medium uppercase tracking-wide mt-0.5">{GLOBAL_CONFIG.departmentName}</p>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Lengkap *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  autoComplete="off"
                  name="signup_fullname_guard"
                  placeholder="Nama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Perusahaan *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  autoComplete="off"
                  name="signup_email_guard"
                  placeholder="Nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Business Manager *</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  autoComplete="off"
                  name="signup_manager_email_guard"
                  placeholder="manager@perusahaan.com"
                  value={businessManagerEmail}
                  onChange={(e) => setBusinessManagerEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 transition"
                />
              </div>
            </div>

            {/* KOLOM AREA / PENEMPATAN DENGAN SEMUA OPSI LENGKAP SEBELUMNYA DAN DEFAULT KOSONG */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Area / Penempatan *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 z-10" />
                <select
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white focus:outline-sky-400 transition cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">-- Pilih Area Penempatan --</option>
                  
                  <optgroup label="Area Pulau Jawa" className="bg-slate-900 text-white font-bold">
                    <option value="Jakarta 1">Jakarta 1</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jakarta 6">Jakarta 6</option>
                    <option value="BPO Umum">BPO Umum</option>
                    <option value="Jakarta 5">Jakarta 5</option>
                  </optgroup>

                  <optgroup label="Area Luar Pulau Jawa" className="bg-slate-900 text-white font-bold">
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Sumbagsel">Sumbagsel</option>
                    <option value="Balinusra">Balinusra</option>
                    <option value="Sumbagteng">Sumbagteng</option>
                    <option value="Sumbagut">Sumbagut</option>
                    <option value="Sulampua">Sulampua</option>
                  </optgroup>

                  <optgroup label="Back Office" className="bg-slate-900 text-white font-bold">
                    <option value="Divisi IT">Divisi IT</option>
                    <option value="Divisi Finance">Divisi Finance</option>
                    <option value="Divisi Human Capital">Divisi Human Capital</option>
                    <option value="Divisi Payroll">Divisi Payroll</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="bg-sky-950/40 border border-sky-500/30 rounded-2xl p-3.5 space-y-1.5 text-xs text-sky-200 backdrop-blur-sm">
              <div className="flex items-center gap-2 font-bold text-sky-300">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Ketentuan Akun Jalur Mandiri:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Akun yang dibuat melalui pendaftaran mandiri otomatis terdaftar sebagai <strong className="text-white">Staf Biasa (Staff)</strong> untuk akses Portal Karyawan.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  name="signup_password_guard"
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-emerald-400/30"
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Akun Mandiri 📋'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-300">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-sky-400 font-bold hover:underline">
              Login di Sini
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}