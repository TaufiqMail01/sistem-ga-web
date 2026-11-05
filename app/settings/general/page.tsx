'use client';

import BackButton from '@/components/ui/BackButton';
import { useState, useEffect } from 'react';
import { Settings2, Save, Building2, Hash, Bell } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

export default function GeneralConfigPage() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    assetPrefix: '',
    atkPrefix: '',
    enableEmail: false,
    enableWa: false,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data, error } = await supabase.from('app_settings').select('*').single();
    if (!error && data) {
      setFormData({
        companyName: data.company_name || '',
        companyAddress: data.company_address || '',
        assetPrefix: data.asset_prefix || '',
        atkPrefix: data.atk_prefix || '',
        enableEmail: data.enable_email || false,
        enableWa: data.enable_wa || false,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cek apakah data sudah ada atau perlu upsert
    const payload = {
      company_name: formData.companyName,
      company_address: formData.companyAddress,
      asset_prefix: formData.assetPrefix,
      atk_prefix: formData.atkPrefix,
      enable_email: formData.enableEmail,
      enable_wa: formData.enableWa,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('app_settings').upsert({ id: 1, ...payload });

    if (error) {
      alert('Gagal menyimpan konfigurasi ke database: ' + error.message);
    } else {
      alert('Konfigurasi standar berhasil disimpan ke database!');
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
              <h1 className="font-extrabold text-white text-base">Konfigurasi Standar Aplikasi</h1>
            </div>

            <div className="flex items-center gap-3">
              <BackButton fallbackUrl="/settings" />
            </div>
          </header>

          <main className="max-w-5xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            {/* Header / Info Halaman */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-300 flex-shrink-0">
                <Settings2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">Konfigurasi Standar Aplikasi</h1>
                <p className="text-xs text-slate-300 mt-0.5">Kelola identitas instansi, format penomoran otomatis, dan preferensi notifikasi terhubung database.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Seksi 1: Profil */}
              <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase">
                  <Building2 className="w-4 h-4 text-sky-400" /> Profil Instansi (Kop Laporan)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Instansi</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama instansi..."
                      value={formData.companyName} 
                      onChange={e => setFormData({...formData, companyName: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alamat Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan alamat lengkap..."
                      value={formData.companyAddress} 
                      onChange={e => setFormData({...formData, companyAddress: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition" 
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Penomoran */}
              <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase">
                  <Hash className="w-4 h-4 text-sky-400" /> Format Penomoran Otomatis (Sequencer)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Prefix Kode Aset (Contoh: AST-)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: AST-"
                      value={formData.assetPrefix} 
                      onChange={e => setFormData({...formData, assetPrefix: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-mono font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Prefix Pengajuan ATK (Contoh: REQ-ATK-)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: REQ-ATK-"
                      value={formData.atkPrefix} 
                      onChange={e => setFormData({...formData, atkPrefix: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-mono font-bold text-white placeholder-slate-400 outline-none focus:border-sky-400 transition" 
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Notifikasi */}
              <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase">
                  <Bell className="w-4 h-4 text-sky-400" /> Sistem Notifikasi
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-white/15 cursor-pointer hover:border-sky-400/50 transition">
                    <input 
                      type="checkbox" 
                      checked={formData.enableEmail} 
                      onChange={e => setFormData({...formData, enableEmail: e.target.checked})} 
                      className="w-4 h-4 text-sky-500 rounded border-white/20 bg-slate-900 focus:ring-sky-400 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-200">Kirim Peringatan Stok Kritis & Servis via Email</span>
                  </label>
                  <label className="flex items-center gap-3 p-3.5 bg-slate-950/60 rounded-2xl border border-white/15 cursor-pointer hover:border-sky-400/50 transition">
                    <input 
                      type="checkbox" 
                      checked={formData.enableWa} 
                      onChange={e => setFormData({...formData, enableWa: e.target.checked})} 
                      className="w-4 h-4 text-sky-500 rounded border-white/20 bg-slate-900 focus:ring-sky-400 cursor-pointer" 
                    />
                    <span className="text-xs font-bold text-slate-200">Kirim Peringatan Stok Kritis & Servis via WhatsApp</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer border border-sky-400/30">
                  <Save className="w-4 h-4" /> Simpan Konfigurasi 🚀
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </>
  );
}