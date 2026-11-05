'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { GLOBAL_CONFIG } from '@/lib/config';

export default function DistributionPage() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'ready', 'active', 'history'
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchDistributions();
  }, []);

  const fetchDistributions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('asset_distributions').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setDistributions(data);
      } else {
        setDistributions([]);
      }
    } catch (err) {
      console.error('Error fetching distributions:', err);
      setDistributions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistributions = distributions.filter(item => {
    const matchesSearch = 
      item.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.borrower?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row relative overflow-x-hidden transition-colors duration-300">
      <Sidebar isHidden={isSidebarHidden} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        
        {/* HEADER */}
        <header className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 p-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              <span>☰ Menu</span>
            </button>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-base">Manajemen Distribusi & Peminjaman Aset</h1>
          </div>
          
          <button 
            onClick={() => alert('Fitur Ekspor Excel')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>📊 Unduh Detail Excel</span>
          </button>
        </header>

        <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
          
          {/* TAB NAVIGASI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('ready')}
              className={`p-4 rounded-2xl border text-left transition font-bold text-xs flex justify-between items-center cursor-pointer ${activeTab === 'ready' ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <span>📦 Barang Siap Dipinjam</span>
              <span className="px-2.5 py-1 rounded-full bg-black/20 text-xs">0</span>
            </button>

            <button 
              onClick={() => setActiveTab('active')}
              className={`p-4 rounded-2xl border text-left transition font-bold text-xs flex justify-between items-center cursor-pointer ${activeTab === 'active' ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <span>⏳ Barang Sedang Dipinjam</span>
              <span className="px-2.5 py-1 rounded-full bg-black/20 text-xs">0</span>
            </button>

            <button 
              onClick={() => setActiveTab('history')}
              className={`p-4 rounded-2xl border text-left transition font-bold text-xs flex justify-between items-center cursor-pointer ${activeTab === 'history' ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <span>📋 Riwayat Peminjaman</span>
              <span className="px-2.5 py-1 rounded-full bg-black/20 text-xs">{distributions.length}</span>
            </button>
          </div>

          {/* FILTER & TABEL */}
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 space-y-6 shadow-xs">
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <input 
                  type="text" 
                  placeholder="Cari nama barang, peminjam, divisi, atau kelengkapan..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 w-full outline-none focus:border-sky-500 transition"
                />
                <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-400 text-[11px] uppercase border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6">Kode Aset</th>
                    <th className="py-4 px-6">Nama Aset</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Peminjam</th>
                    <th className="py-4 px-6">Divisi / Unit</th>
                    <th className="py-4 px-6">Kelengkapan Unit</th>
                    <th className="py-4 px-6">Tanggal Pengembalian</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Keterangan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">Memuat data peminjaman...</td>
                    </tr>
                  ) : filteredDistributions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16 text-slate-400 font-medium">
                        <div className="space-y-2">
                          <span className="text-3xl block">📭</span>
                          <p>Belum ada data peminjaman atau riwayat tersimpan di database.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDistributions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-4 px-6 font-mono font-bold text-sky-600 dark:text-sky-400">{item.asset_code}</td>
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{item.asset_name}</td>
                        <td className="py-4 px-6">{item.category}</td>
                        <td className="py-4 px-6 font-semibold">{item.borrower}</td>
                        <td className="py-4 px-6 text-slate-500">{item.unit}</td>
                        <td className="py-4 px-6 text-slate-500 text-[11px] max-w-xs">{item.kelengkapan || '-'}</td>
                        <td className="py-4 px-6 font-mono text-[11px]">{item.return_date || '-'}</td>
                        <td className="py-4 px-6">
                          <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full font-bold text-[10px] border border-emerald-200 dark:border-emerald-900">
                            {item.status || 'Dikembalikan'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right italic text-slate-400 text-[11px]">{item.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}