'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

type AssetItem = {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  brand?: string;
  serial_number?: string;
  specification?: string;
  purchase_date?: string;
  purchase_cost: string;
  supplier?: string;
  location?: string;
  condition: string;
  holder: string;
  updated_at?: string;
};

type MutationItem = {
  id: string;
  mutation_code: string;
  asset_name: string;
  previous_holder: string;
  new_holder: string;
  mutation_date: string;
  status: string;
  reason?: string;
};

export default function InventoryPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedQRAsset, setSelectedQRAsset] = useState<AssetItem | null>(null);
  const [currentAsset, setCurrentAsset] = useState<AssetItem | null>(null);
  const [assetHistories, setAssetHistories] = useState<MutationItem[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchAssets();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setAssets(data);
      } else {
        setAssets([
          {
            id: '1',
            asset_code: 'GA-IT-2026-0001',
            name: 'Laptop ThinkPad T14',
            category: 'Hardware / IT',
            brand: 'Lenovo',
            serial_number: 'TP-14029384',
            purchase_date: '2026-01-15',
            purchase_cost: '14500000',
            supplier: 'PT Computama Jaya',
            location: 'Ruang Server Lt. 3',
            condition: 'Good',
            holder: 'Taufiq Ismail',
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: AssetItem) => {
    setCurrentAsset(item);
    setShowEditModal(true);
  };

  const handleOpenHistory = async (item: AssetItem) => {
    setCurrentAsset(item);
    try {
      const { data } = await supabase.from('asset_mutations').select('*').order('created_at', { ascending: false });
      if (data) {
        const filtered = data.filter(m => 
          m.asset_name?.toLowerCase().includes(item.name.toLowerCase()) || 
          m.asset_name?.toLowerCase().includes(item.asset_code.toLowerCase())
        );
        setAssetHistories(filtered);
      } else {
        setAssetHistories([]);
      }
    } catch {
      setAssetHistories([]);
    }
    setShowHistoryModal(true);
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset) return;

    try {
      const { error } = await supabase.from('assets').update({
        name: currentAsset.name,
        category: currentAsset.category,
        brand: currentAsset.brand,
        serial_number: currentAsset.serial_number,
        condition: currentAsset.condition,
        holder: currentAsset.holder,
        location: currentAsset.location,
        purchase_cost: currentAsset.purchase_cost,
      }).eq('id', currentAsset.id);

      if (error) {
        showNotification('Gagal mengupdate aset: ' + error.message, 'error');
      } else {
        showNotification('Berhasil memperbarui data aset!', 'success');
        setShowEditModal(false);
        fetchAssets();
      }
    } catch (err: any) {
      showNotification('Terjadi kesalahan: ' + err.message, 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} aset yang dipilih?`)) return;

    try {
      const { error } = await supabase.from('assets').delete().in('id', selectedRows);
      if (error) {
        showNotification('Gagal menghapus data: ' + error.message, 'error');
      } else {
        showNotification('Berhasil menghapus aset terpilih!', 'success');
        setSelectedRows([]);
        fetchAssets();
      }
    } catch (err: any) {
      showNotification('Terjadi kesalahan: ' + err.message, 'error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedAssets.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedAssets.map(a => a.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const filteredAssets = assets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.holder.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1;
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          
          {/* HEADER */}
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-2"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-base">Master Data Assets</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-500/30 border border-sky-400/40 text-sky-200 font-bold text-xs flex items-center justify-center shadow-inner">
                GA
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-white">General Affairs</span>
                <span className="block text-[10px] text-slate-300 font-medium">Administrator</span>
              </div>
            </div>
          </header>

          {/* NOTIFICATION TOAST */}
          {notification && (
            <div className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition animate-in fade-in slide-in-from-top-4 duration-300 border backdrop-blur-md ${notification.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/40' : 'bg-rose-600/90 border-rose-400/40'}`}>
              {notification.message}
            </div>
          )}

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            {/* TOOLBAR SECTION */}
            <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-1">
                    <span>Dashboard</span>
                    <span>/</span>
                    <span className="text-white font-semibold">Master Assets</span>
                  </div>
                  <h2 className="font-black text-white text-xl tracking-tight">Master Data Assets</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Klik 2x pada baris tabel untuk melihat detail dan QR Code aset secara instan.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {selectedRows.length > 0 && (
                    <button 
                      onClick={handleDeleteSelected}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-md"
                    >
                      <span>🗑️ Hapus ({selectedRows.length})</span>
                    </button>
                  )}

                  <div className="relative flex-1 sm:flex-initial">
                    <input 
                      type="text" 
                      placeholder="Cari aset, kode, atau holder..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950/60 border border-white/15 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white font-medium w-full sm:w-64 outline-none focus:border-sky-400 transition placeholder-slate-400"
                    />
                    <span className="absolute left-3.5 top-3 text-slate-400 text-xs">🔍</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/60 border border-white/15 px-3.5 py-2.5 rounded-2xl backdrop-blur-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter</span>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="All" className="bg-slate-900 text-white">Semua Kategori</option>
                      <option value="Hardware / IT" className="bg-slate-900 text-white">Hardware / IT</option>
                      <option value="Furniture Kantor" className="bg-slate-900 text-white">Furniture Kantor</option>
                      <option value="Electronics / Elektronik" className="bg-slate-900 text-white">Electronics / Elektronik</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLE SECTION */}
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.length === paginatedAssets.length && paginatedAssets.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-6">Assets Name</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Updated Date</th>
                      <th className="py-4 px-6">Inspector</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Memuat data aset dari database...</td></tr>
                    ) : paginatedAssets.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Tidak ada data aset ditemukan.</td></tr>
                    ) : (
                      paginatedAssets.map((item, idx) => {
                        const isSelected = selectedRows.includes(item.id);
                        const isEven = idx % 2 === 0;

                        return (
                          <tr 
                            key={item.id} 
                            onDoubleClick={() => setSelectedQRAsset(item)}
                            title="Klik 2x untuk melihat QR Code & Detail Aset"
                            className={`transition cursor-pointer select-none ${
                              isSelected 
                                ? 'bg-sky-500/20 text-sky-200 border-l-4 border-sky-400' 
                                : isEven 
                                  ? 'bg-transparent hover:bg-white/5' 
                                  : 'bg-white/[0.02] hover:bg-white/5'
                            }`}
                          >
                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelectRow(item.id)}
                                className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 cursor-pointer"
                              />
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 border border-sky-500/30 shadow-inner">
                                  {item.name ? item.name.charAt(0).toUpperCase() : '📦'}
                                </div>
                                <div>
                                  <span className="font-bold text-white block">{item.name}</span>
                                  <span className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                                    📍 {item.location || item.supplier || 'Main Office'} ({item.asset_code})
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-bold">
                                  <span className={item.condition === 'Good' || item.condition === 'Baik' ? 'text-emerald-300' : 'text-amber-300'}>
                                    {item.condition === 'Good' || item.condition === 'Baik' ? 'Operational / Ready' : 'In Repair / Maintenance'}
                                  </span>
                                  <span className="text-slate-400 font-mono">
                                    {item.condition === 'Good' || item.condition === 'Baik' ? '100%' : '65%'}
                                  </span>
                                </div>
                                <div className="w-32 bg-slate-950/80 h-1.5 rounded-full overflow-hidden border border-white/10">
                                  <div className={`h-full rounded-full ${item.condition === 'Good' || item.condition === 'Baik' ? 'bg-emerald-400 w-full' : 'bg-amber-400 w-[65%]'}`}></div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                                🏢 {item.category || 'Hardware'}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-slate-300 font-mono text-[11px]">
                              <span className="block font-bold text-white">08:30 AM</span>
                              <span>{item.purchase_date || 'Aug 31, 2026'}</span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900 shadow-sm">
                                    {item.holder ? item.holder.charAt(0).toUpperCase() : 'T'}
                                  </div>
                                  <div className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-slate-900 shadow-sm">
                                    GA
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-slate-200">{item.holder || 'General Staff'}</span>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleOpenHistory(item)}
                                  className="bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer border border-white/10"
                                >
                                  <span>📜 Histori</span>
                                </button>

                                <button 
                                  onClick={() => handleOpenEdit(item)}
                                  className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md inline-flex items-center gap-1 cursor-pointer border border-sky-400/30"
                                >
                                  <span>✏️ Edit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION & SHOW */}
              <div className="p-4 border-t border-white/10 flex flex-wrap justify-between items-center text-xs text-slate-300 bg-slate-950/40 gap-4">
                <span>Showing {filteredAssets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} entries</span>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-900/80 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value={8} className="bg-slate-900 text-white">8</option>
                      <option value={16} className="bg-slate-900 text-white">16</option>
                      <option value={24} className="bg-slate-900 text-white">24</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900/80 font-bold text-slate-200 disabled:opacity-50 cursor-pointer"
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                      <button 
                        key={num} 
                        onClick={() => setCurrentPage(num)}
                        className={`w-8 h-8 rounded-xl font-bold transition ${currentPage === num ? 'bg-sky-500 text-white shadow-md border border-sky-400/30' : 'hover:bg-white/10 text-slate-300'}`}
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-xl border border-white/15 bg-slate-900/80 font-bold text-slate-200 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>

        {/* MODAL QR CODE & DETAIL ASET */}
        {selectedQRAsset && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-sm">Detail & QR Code Aset</h3>
                <button 
                  onClick={() => setSelectedQRAsset(null)}
                  className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/15 flex flex-col items-center shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      typeof window !== 'undefined' 
                        ? `${window.location.origin}/asset/${selectedQRAsset.asset_code}` 
                        : `https://domainanda.com/asset/${selectedQRAsset.asset_code}`
                    )}`}
                    alt="QR Code Aset" 
                    className="w-36 h-36 object-contain bg-white p-2 rounded-xl border border-slate-200"
                  />
                  <span className="mt-2 font-mono text-xs font-bold text-sky-400">{selectedQRAsset.asset_code}</span>
                </div>

                <div className="w-full space-y-2 text-xs bg-slate-950/50 p-4 rounded-2xl border border-white/10">
                  <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Nama Barang:</span><strong className="text-white">{selectedQRAsset.name}</strong></div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Merk / Brand:</span><strong className="text-white">{selectedQRAsset.brand || '-'}</strong></div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Serial Number:</span><strong className="text-white font-mono">{selectedQRAsset.serial_number || '-'}</strong></div>
                  <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Lokasi / User:</span><strong className="text-white">{selectedQRAsset.location} ({selectedQRAsset.holder})</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Kondisi:</span><strong className="text-emerald-400 font-bold">{selectedQRAsset.condition}</strong></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <a 
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    typeof window !== 'undefined' 
                      ? `${window.location.origin}/asset/${selectedQRAsset.asset_code}` 
                      : `https://domainanda.com/asset/${selectedQRAsset.asset_code}`
                  )}`}
                  download={`QR-${selectedQRAsset.asset_code}.png`}
                  className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>📥 Download QR</span>
                </a>

                <button 
                  type="button" 
                  onClick={() => setSelectedQRAsset(null)}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg border border-sky-400/30"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT ASET */}
        {showEditModal && currentAsset && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-sm">Edit Data Aset: {currentAsset.asset_code}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleUpdateAsset} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Barang / Aset</label>
                  <input type="text" value={currentAsset.name} onChange={(e) => setCurrentAsset({...currentAsset, name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategori</label>
                    <input type="text" value={currentAsset.category} onChange={(e) => setCurrentAsset({...currentAsset, category: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kondisi</label>
                    <select value={currentAsset.condition} onChange={(e) => setCurrentAsset({...currentAsset, condition: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none cursor-pointer">
                      <option value="Good" className="bg-slate-900 text-white">Good (Baik)</option>
                      <option value="Maintenance" className="bg-slate-900 text-white">Maintenance (Perawatan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Penanggung Jawab (Holder)</label>
                    <input type="text" value={currentAsset.holder} onChange={(e) => setCurrentAsset({...currentAsset, holder: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Lokasi Penempatan</label>
                    <input type="text" value={currentAsset.location || ''} onChange={(e) => setCurrentAsset({...currentAsset, location: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg border border-sky-400/30 cursor-pointer">Simpan Perubahan 🚀</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL HISTORI ASET */}
        {showHistoryModal && currentAsset && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-black text-white text-sm">Histori Mutasi & Pergerakan Aset</h3>
                  <p className="text-xs text-sky-400 font-mono font-bold mt-0.5">{currentAsset.name} ({currentAsset.asset_code})</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                {assetHistories.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 text-xs">Belum ada catatan mutasi atau perpindahan untuk aset ini.</p>
                ) : (
                  assetHistories.map(h => (
                    <div key={h.id} className="bg-slate-950/50 border border-white/10 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-sky-400 font-bold">{h.mutation_code}</span>
                        <span className="text-slate-400 font-mono">{h.mutation_date}</span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold flex items-center gap-2">
                        <span>Pemegang Lama: <strong className="text-slate-400">{h.previous_holder}</strong></span>
                        <span>→</span>
                        <span>Pemegang Baru: <strong className="text-sky-400">{h.new_holder}</strong></span>
                      </div>
                      <p className="text-xs text-slate-400 italic">Alasan: {h.reason || '-'}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 flex justify-end border-t border-white/10">
                <button onClick={() => setShowHistoryModal(false)} className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-white/10">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}