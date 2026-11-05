'use client';

import BackButton from '@/components/ui/BackButton';
import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Shield, Trash2, Edit, CheckCircle2, XCircle, X, Key, History, Clock, ChevronDown, ChevronUp, Mail, Lock, Eye, EyeOff, Crown, MapPin } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import gsap from 'gsap';

type UserItem = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status?: string;
  department?: string;
  area?: string;
  business_manager_email?: string;
  password_plain?: string;
  is_master?: boolean;
  created_at?: string;
};

type ActivityLog = {
  id: string;
  user_email: string;
  activity_type: string;
  description: string;
  created_at: string;
};

const MASTER_EMAIL = 'admin.master@perusahaan.com';

export default function UsersSettingsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userLogs, setUserLogs] = useState<ActivityLog[]>([]);
  const [isLogDropdownOpen, setIsLogDropdownOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'Staff',
    status: 'Aktif',
    area: 'Jakarta 1',
    business_manager_email: '',
    password_plain: '',
    new_password: ''
  });

  const supabase = createClient();

  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading]);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9, y: -30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
      );
    }
  }, [isModalOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat profil:', error.message);
    }

    if (data) {
      const processedUsers = data.map(u => ({
        ...u,
        is_master: u.email === MASTER_EMAIL || u.is_master === true
      }));
      setUsers(processedUsers);
    }
    setLoading(false);
  };

  const fetchUserLogs = async (email: string) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUserLogs(data);
    } else {
      setUserLogs([]);
    }
  };

  const logActivity = async (email: string, type: string, desc: string) => {
    await supabase.from('activity_logs').insert([
      { user_email: email, activity_type: type, description: desc }
    ]);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsChangingPassword(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setFormData({ 
      full_name: '', 
      email: '', 
      role: 'Staff', 
      status: 'Aktif', 
      area: 'Jakarta 1',
      business_manager_email: '', 
      password_plain: '', 
      new_password: '' 
    });
    setUserLogs([]);
    setIsLogDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setIsChangingPassword(false);
    setShowOldPassword(false);
    setShowNewPassword(false);
    setFormData({ 
      full_name: user.full_name || '', 
      email: user.email || '', 
      role: user.role || 'Staff', 
      status: user.status || 'Aktif',
      area: user.area || 'Jakarta 1',
      business_manager_email: user.business_manager_email || '',
      password_plain: user.password_plain || '-', 
      new_password: '' 
    });
    fetchUserLogs(user.email);
    setIsLogDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: sessionData } = await supabase.auth.getSession();
    const adminEmail = sessionData?.session?.user?.email || 'Admin';

    const isTargetMaster = editingUser?.email === MASTER_EMAIL || editingUser?.is_master;

    if (editingUser) {
      const updatedData: any = {
        full_name: formData.full_name,
        email: isTargetMaster ? MASTER_EMAIL : formData.email,
        role: isTargetMaster ? 'Admin GA' : formData.role,
        status: isTargetMaster ? 'Aktif' : formData.status,
        area: formData.area,
        business_manager_email: formData.business_manager_email,
        is_master: isTargetMaster
      };

      if (isChangingPassword && formData.new_password.trim() !== '') {
        updatedData.password_plain = formData.new_password;
      }

      const { error } = await supabase.from('profiles').update(updatedData).eq('id', editingUser.id);
      if (error) {
        alert('Gagal memperbarui pengguna: ' + error.message);
      } else {
        const passLogText = isChangingPassword ? ' Disertai Perubahan Password.' : '';
        const detailDesc = `Akun "${formData.full_name}" (${formData.email}) diperbarui oleh Admin (${adminEmail}). Area: ${formData.area}, Role: ${updatedData.role}, Status: ${updatedData.status}, Manager: ${formData.business_manager_email || '-'}.${passLogText}`;
        
        await logActivity(formData.email, 'UPDATE_USER', detailDesc);
        alert('Berhasil memperbarui data pengguna!');
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password_plain,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            area: formData.area,
            business_manager_email: formData.business_manager_email
          }
        }
      });

      if (authError) {
        alert('Gagal mendaftarkan ke sistem Auth: ' + authError.message);
        return;
      }

      const newUserId = authData.user?.id;

      if (!newUserId) {
        alert('Gagal mendapatkan ID pengguna dari Supabase.');
        return;
      }

      const { error: profileError } = await supabase.from('profiles').upsert([{
        id: newUserId,
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        area: formData.area,
        business_manager_email: formData.business_manager_email,
        password_plain: formData.password_plain,
        is_master: false
      }]);

      if (profileError) {
        alert('Gagal menyimpan profil ke database: ' + profileError.message);
        return;
      }

      const createDesc = `Akun baru "${formData.full_name}" (${formData.email}) berhasil dibuat oleh Admin (${adminEmail}). Area: ${formData.area}, Role: ${formData.role}, Status: ${formData.status}, Manager: ${formData.business_manager_email || '-'}`;
      
      await logActivity(formData.email, 'SIGNUP_OR_CREATED', createDesc);
      alert('Berhasil menambahkan pengguna baru!');
      setIsModalOpen(false);
      fetchUsers();
    }
  };

  const handleDelete = async (id: string, emailUser: string, isMasterUser?: boolean) => {
    if (emailUser === MASTER_EMAIL || isMasterUser) {
      alert('PERINGATAN KERAS: AKUN MASTER TIDAK DAPAT DIHAPUS DALAM KONDISI APAPUN!');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini dari database?')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus pengguna: ' + error.message);
      } else {
        alert('Pengguna berhasil dihapus.');
        fetchUsers();
      }
    }
  };

  const isCurrentEditingMaster = editingUser?.email === MASTER_EMAIL || editingUser?.is_master;

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

      <div className="min-h-screen animated-bg font-sans flex flex-col md:flex-row relative overflow-x-hidden text-slate-100">
        <Sidebar isHidden={isSidebarHidden} />
        
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-2"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-base">Manajemen Pengguna & Log Aktivitas</h1>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'users' && (
                <button 
                  onClick={handleOpenAddModal}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
                >
                  <UserPlus className="w-4 h-4" /> Tambah Pengguna
                </button>
              )}
              <BackButton fallbackUrl="/settings" />
            </div>
          </header>

          <main ref={containerRef} className="max-w-[95%] w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300 flex-shrink-0">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-white tracking-tight">Kelola Akun & Riwayat Aktivitas Per User</h1>
                  <p className="text-xs text-slate-300 mt-0.5">Kelola akun staf, proteksi akun master mutlak, dan pantau log aktivitas.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'users' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Daftar Pengguna (Akun)
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'permissions' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Konfigurasi Hak Akses (Roles)
              </button>
            </div>

            {activeTab === 'users' && (
              <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/50 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Nama & Akun</th>
                        <th className="py-4 px-6">Alamat Email</th>
                        <th className="py-4 px-6">Area / Penempatan</th>
                        <th className="py-4 px-6">Business Manager</th>
                        <th className="py-4 px-6">Posisi (Role)</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs font-medium text-slate-200">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                            Memuat data pengguna...
                          </td>
                        </tr>
                      ) : users.length > 0 ? (
                        users.map((user) => {
                          const statusVal = user.status || 'Aktif';
                          const isActive = statusVal.toLowerCase() === 'aktif';
                          const isMasterUser = user.email === MASTER_EMAIL || user.is_master;

                          return (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                                  isMasterUser ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300' : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                                }`}>
                                  {isMasterUser ? <Crown className="w-4 h-4 text-amber-400" /> : (user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U')}
                                </div>
                                <div className="flex flex-col">
                                  <span className="truncate flex items-center gap-1.5">
                                    {user.full_name || 'Tanpa Nama'}
                                    {isMasterUser && (
                                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                        MASTER ROOT
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-300 font-mono">{user.email}</td>
                              <td className="py-4 px-6 text-slate-300">{user.area || '-'}</td>
                              <td className="py-4 px-6 text-sky-300 font-mono text-[11px]">{user.business_manager_email || '-'}</td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                                  isMasterUser ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                  <Shield className="w-3 h-3" /> {user.role || 'Staff'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                {isActive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Aktif
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full">
                                    <XCircle className="w-3 h-3" /> Nonaktif
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleOpenEditModal(user)} className="p-2 text-slate-300 hover:text-sky-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer" title="Edit & Riwayat Log">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {!isMasterUser && (
                                    <button onClick={() => handleDelete(user.id, user.email, isMasterUser)} className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer" title="Hapus">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium italic">
                            Belum ada data pengguna terdaftar di database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Admin GA / IT</h3>
                      <p className="text-[11px] text-slate-300">Akses Sistem Penuh</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Mengedit, menambah, & menghapus semua data inventaris.</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Mengakses Menu Pengaturan Sistem.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Staff</h3>
                      <p className="text-[11px] text-slate-300">Akses Portal Karyawan</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Mengajukan permintaan ATK mandiri.</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Melihat riwayat pesanan sendiri.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Business Manager</h3>
                      <p className="text-[11px] text-slate-300">Akses Approval Khusus</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Memberikan persetujuan (approval) pengajuan staf.</li>
                  </ul>
                </div>
              </div>
            )}
          </main>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div ref={modalRef} className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden text-white relative">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 relative">
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  {isCurrentEditingMaster ? <Crown className="w-4 h-4 text-amber-400" /> : <Edit className="w-4 h-4 text-sky-400" />}
                  {editingUser ? (isCurrentEditingMaster ? `Edit Akun Master (Root): ${editingUser.full_name}` : `Edit Pengguna: ${editingUser.full_name}`) : 'Tambah Pengguna Baru'}
                </h3>

                <div className="flex items-center gap-2">
                  {editingUser && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsLogDropdownOpen(!isLogDropdownOpen)}
                        className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Log Aktivitas</span>
                        {isLogDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isLogDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-white/20 rounded-2xl shadow-2xl p-3 z-50 space-y-2 text-xs">
                          <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                            <span className="font-bold text-sky-300 uppercase tracking-wider text-[10px]">Detail Aktivitas User</span>
                            <span className="text-[10px] text-slate-400 font-mono">{userLogs.length} Catatan</span>
                          </div>
                          
                          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {userLogs.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic text-center py-3">Belum ada log aktivitas tercatat.</p>
                            ) : (
                              userLogs.map((log) => (
                                <div key={log.id} className="bg-slate-900/80 border border-white/10 rounded-xl p-2.5 space-y-1">
                                  <div className="flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-sky-400 font-mono">[{log.activity_type}]</span>
                                    <span className="text-slate-400 font-mono flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-[11px] leading-relaxed">{log.description}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {isCurrentEditingMaster && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-[11px] text-amber-300 font-bold flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Ini adalah Akun Master Mutlak (Root). Email, Role, dan Status Aktif terkunci permanen dan tidak dapat diturunkan.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alamat Email</label>
                    <input
                      type="email"
                      required
                      disabled={isCurrentEditingMaster}
                      placeholder="nama@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white placeholder-slate-400 outline-none transition ${
                        isCurrentEditingMaster ? 'opacity-50 cursor-not-allowed bg-slate-900' : 'focus:border-sky-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!editingUser ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-sky-400" /> Password Pengguna
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          required
                          autoComplete="new-password"
                          placeholder="Masukkan password"
                          value={formData.password_plain}
                          onChange={(e) => setFormData({ ...formData, password_plain: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition pr-12 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer p-0.5"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-sky-400" /> Password Saat Ini
                      </label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? 'text' : 'password'}
                          disabled
                          value={formData.password_plain}
                          className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-2xl text-xs font-bold text-slate-300 outline-none pr-12 cursor-not-allowed font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer p-0.5"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-indigo-300 uppercase mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Area / Penempatan
                    </label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-4 py-3 pr-10 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white cursor-pointer outline-none focus:border-sky-400 transition"
                    >
                      <optgroup label="Area Pulau Jawa" className="bg-slate-950 text-slate-400 font-bold">
                        <option value="Jakarta 1" className="bg-slate-900 text-white">Jakarta 1</option>
                        <option value="Jawa Timur" className="bg-slate-900 text-white">Jawa Timur</option>
                        <option value="Jawa Tengah" className="bg-slate-900 text-white">Jawa Tengah</option>
                        <option value="Jawa Barat" className="bg-slate-900 text-white">Jawa Barat</option>
                        <option value="Jakarta 6" className="bg-slate-900 text-white">Jakarta 6</option>
                        <option value="BPO Umum" className="bg-slate-900 text-white">BPO Umum</option>
                        <option value="Jakarta 5" className="bg-slate-900 text-white">Jakarta 5</option>
                      </optgroup>
                      <optgroup label="Area Luar Pulau Jawa" className="bg-slate-950 text-slate-400 font-bold">
                        <option value="Kalimantan" className="bg-slate-900 text-white">Kalimantan</option>
                        <option value="Sumbagsel" className="bg-slate-900 text-white">Sumbagsel</option>
                        <option value="Balinusra" className="bg-slate-900 text-white">Balinusra</option>
                        <option value="Sumbagteng" className="bg-slate-900 text-white">Sumbagteng</option>
                        <option value="Sumbagut" className="bg-slate-900 text-white">Sumbagut</option>
                        <option value="Sulampua" className="bg-slate-900 text-white">Sulampua</option>
                      </optgroup>
                      <optgroup label="Back Office" className="bg-slate-950 text-slate-400 font-bold">
                        <option value="Divisi IT" className="bg-slate-900 text-white">Divisi IT</option>
                        <option value="Divisi Finance" className="bg-slate-900 text-white">Divisi Finance</option>
                        <option value="Divisi Human Capital" className="bg-slate-900 text-white">Divisi Human Capital</option>
                        <option value="Divisi Payroll" className="bg-slate-900 text-white">Divisi Payroll</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {editingUser && (
                  <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChangingPassword}
                        onChange={(e) => setIsChangingPassword(e.target.checked)}
                        className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Ubah / Ganti Password Baru
                      </span>
                    </label>

                    {isChangingPassword && (
                      <div className="relative pt-1">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required={isChangingPassword}
                          autoComplete="new-password"
                          placeholder="Masukkan password baru..."
                          value={formData.new_password}
                          onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                          className="w-full px-4 py-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-xs font-bold text-white placeholder-amber-300/40 outline-none focus:border-amber-400 transition pr-12 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-4 text-amber-300/60 hover:text-amber-300 cursor-pointer p-0.5"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-emerald-300 uppercase mb-1.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email Business Manager
                    </label>
                    <input
                      type="email"
                      placeholder="manager@company.com"
                      value={formData.business_manager_email}
                      onChange={(e) => setFormData({ ...formData, business_manager_email: e.target.value })}
                      className="w-full px-4 py-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs font-bold text-white placeholder-emerald-300/40 outline-none focus:border-emerald-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Posisi / Hak Akses (Role)</label>
                    <select
                      value={formData.role}
                      disabled={isCurrentEditingMaster}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-4 py-3 pr-10 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white cursor-pointer outline-none ${
                        isCurrentEditingMaster ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''
                      }`}
                    >
                      <option value="Admin GA" className="bg-slate-900 text-white">Admin GA</option>
                      <option value="Staff" className="bg-slate-900 text-white">Staff</option>
                      <option value="Business Manager" className="bg-slate-900 text-white">Business Manager</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Status Akun</label>
                  <select
                    value={formData.status}
                    disabled={isCurrentEditingMaster}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-4 py-3 pr-10 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white cursor-pointer outline-none ${
                      isCurrentEditingMaster ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''
                    }`}
                  >
                    <option value="Aktif" className="bg-slate-900 text-white">Aktif</option>
                    <option value="Nonaktif" className="bg-slate-900 text-white">Nonaktif</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">
                    Batal
                  </button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">
                    Simpan Perubahan 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}