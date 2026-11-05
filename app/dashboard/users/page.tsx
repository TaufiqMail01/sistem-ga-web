'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { Users, UserPlus, Shield, Mail, Building, Lock, Eye, EyeOff } from 'lucide-react';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  created_at: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Staff', // Default Staff (Hanya akses portal)
    department: 'HR & General Affairs',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      alert('Gagal membuat akun: ' + error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          department: form.department,
        }
      ]);

      if (profileError) {
        alert('Gagal menyimpan profil: ' + profileError.message);
      } else {
        alert(`Berhasil membuat akun untuk ${form.full_name}!`);
        setShowModal(false);
        setForm({ email: '', password: '', full_name: '', role: 'Staff', department: 'HR & General Affairs' });
        fetchUsers();
      }
    }
  };

  return (
    <>
      {/* STYLE CSS ANIMASI GRADASI WARNA-WARNI KONSISTEN */}
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

      <div className="min-h-screen animated-bg font-sans flex flex-col md:flex-row text-slate-100 relative overflow-x-hidden">
        <Sidebar isHidden={isSidebarHidden} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-2"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-base">Manajemen Pengguna & Hak Akses</h1>
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
            >
              <UserPlus className="w-4 h-4" /> Buat Akun Baru
            </button>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-white text-sm uppercase">Daftar Akun Pengguna Terdaftar</h3>
                  <p className="text-xs text-slate-300 mt-1">Kelola pembagian peran hak akses staf dan admin di dalam sistem.</p>
                </div>
                <span className="px-3.5 py-1.5 bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {users.length} Pengguna Aktif
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Nama & Email</th>
                      <th className="py-4 px-6">Departemen</th>
                      <th className="py-4 px-6">Hak Akses (Role)</th>
                      <th className="py-4 px-6">Tanggal Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {users.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-400 italic">Belum ada pengguna terdaftar.</td></tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6">
                            <span className="font-bold text-white block">{u.full_name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-300">{u.department}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider border ${u.role === 'Admin GA' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : u.role === 'Manager' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-300 border-white/10'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono">{u.created_at?.split('T')[0]}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* MODAL BUAT AKUN DENGAN KETERANGAN ROLE */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Buat Akun Baru & Atur Peran</h3>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-full uppercase border border-sky-500/30">Panel Admin GA</span>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Lengkap *</label>
                  <input type="text" required placeholder="Siska Melina" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-sky-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Email Perusahaan *</label>
                  <input type="email" required placeholder="siska@perusahaan.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-sky-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      placeholder="••••••••" 
                      value={form.password} 
                      onChange={(e) => setForm({...form, password: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 pr-10 text-xs font-bold text-white outline-none focus:border-sky-400" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Departemen *</label>
                    <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs font-bold text-white cursor-pointer outline-none">
                      <option value="HR & General Affairs" className="bg-slate-900 text-white">HR & General Affairs</option>
                      <option value="Tim IT Support" className="bg-slate-900 text-white">Tim IT Support</option>
                      <option value="Finance & Accounting" className="bg-slate-900 text-white">Finance & Accounting</option>
                      <option value="Operational & Marketing" className="bg-slate-900 text-white">Operational & Marketing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Hak Akses (Role) *</label>
                    <select 
                      value={form.role} 
                      onChange={(e) => setForm({...form, role: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      <option value="Staff" className="bg-slate-900 text-white">Staff (Akses Portal Saja)</option>
                      <option value="Manager" className="bg-slate-900 text-white">Manager (Approval Pesanan)</option>
                      <option value="Admin GA" className="bg-slate-900 text-white">Admin GA (Akses Seluruh Sistem)</option>
                    </select>
                  </div>
                </div>

                {/* KETERANGAN JELAS PEMBAGIAN ROLE */}
                <div className="bg-sky-500/10 border border-sky-500/20 p-3.5 rounded-2xl text-[11px] text-sky-300 space-y-1">
                  <p>ℹ️ <strong>Keterangan Hak Akses:</strong></p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                    <li><strong>Staff:</strong> Hanya dapat mengakses Portal Karyawan untuk mengajukan pesanan ATK.</li>
                    <li><strong>Admin GA / Manager:</strong> Memiliki akses penuh mengelola dashboard operasional, inventaris, dan verifikasi sistem.</li>
                  </ul>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/25 text-slate-300 cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 cursor-pointer shadow-lg border border-sky-400/30">Simpan & Buat Akun</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}