'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

type Asset = {
  id: string;
  asset_code: string;
  name: string;
  category?: string;
  location: string;
  condition: string;
};

type MaintenanceItem = {
  id: string;
  asset_id?: string;
  item_name: string;
  asset_code: string;
  category: string;
  service_type: string;
  technician_name: string;
  cost: number;
  service_date: string;
  completion_date?: string;
  status: 'Pending' | 'Sedang Dikerjakan' | 'Selesai';
  notes?: string;
};

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'history'>('available');
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingItem, setCompletingItem] = useState<MaintenanceItem | null>(null);

  const [serviceForm, setServiceForm] = useState({
    asset_id: '',
    item_name: '',
    asset_code: '',
    category: 'Hardware / IT',
    service_type: 'Perbaikan / Maintenance',
    technician_name: '',
    cost: 0,
    service_date: new Date().toISOString().split('T')[0],
    status: 'Pending' as 'Pending' | 'Sedang Dikerjakan' | 'Selesai',
    notes: '',
  });

  const [completionForm, setCompletionForm] = useState({
    cost: 0,
    notes: 'Perbaikan selesai, unit berfungsi normal.',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: assetsData, error: assetError } = await supabase
      .from('assets')
      .select('id, asset_code, name, category, location, condition');

    if (!assetError && assetsData) {
      setAssets(assetsData);
    } else {
      setAssets([]);
    }

    const { data, error } = await supabase.from('equipment_services').select('*').order('service_date', { ascending: false });
    if (!error && data) {
      setMaintenanceList(data);
    } else {
      setMaintenanceList([]);
    }
    setLoading(false);
  };

  const handleOpenServiceModal = (asset: Asset) => {
    setServiceForm({
      asset_id: asset.id,
      item_name: asset.name,
      asset_code: asset.asset_code,
      category: asset.category || 'Hardware / IT',
      service_type: 'Perbaikan / Maintenance',
      technician_name: '',
      cost: 0,
      service_date: new Date().toISOString().split('T')[0],
      status: 'Sedang Dikerjakan',
      notes: '',
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('equipment_services').insert([serviceForm]);
    setLoading(false);

    if (error) {
      alert('Gagal menyimpan pengajuan servis: ' + error.message);
    } else {
      fetchData();
    }

    setShowServiceModal(false);
  };

  const handleOpenCompleteModal = (item: MaintenanceItem) => {
    setCompletingItem(item);
    setCompletionForm({
      cost: item.cost || 0,
      notes: item.notes || 'Perbaikan selesai dengan baik.',
    });
    setShowCompleteModal(true);
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingItem) return;

    setLoading(true);
    const now = new Date();
    const completionDateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;

    const { error } = await supabase.from('equipment_services').update({
      status: 'Selesai',
      cost: Number(completionForm.cost),
      notes: completionForm.notes,
      completion_date: completionDateStr,
    }).eq('id', completingItem.id);

    setLoading(false);

    if (error) {
      alert('Gagal menyelesaikan servis: ' + error.message);
    } else {
      fetchData();
    }

    setShowCompleteModal(false);
    setCompletingItem(null);
  };

  const exportToExcel = () => {
    let csvContent = "\uFEFF";
    if (activeTab === 'available') {
      csvContent += "Kode Aset;Nama Aset;Kategori;Lokasi Penempatan;Kondisi\n";
      filteredAvailableAssets.forEach(item => {
        csvContent += `"${item.asset_code}";"${item.name}";"${item.category || 'Hardware / IT'}";"${item.location}";"${item.condition}"\n`;
      });
    } else {
      csvContent += "Kode Aset;Nama Barang/Aset;Kategori;Jenis Servis;Teknisi / Vendor;Biaya (Rp);Tanggal;Status;Catatan\n";
      filteredMaintenanceItems.forEach(item => {
        csvContent += `"${item.asset_code}";"${item.item_name}";"${item.category}";"${item.service_type}";"${item.technician_name}";${item.cost};"${item.service_date}";"${item.status}";"${item.notes || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Perawatan_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleCostInput = (e: React.ChangeEvent<HTMLInputElement>, isComplete = false) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    if (isComplete) {
      setCompletionForm({ ...completionForm, cost: numericValue });
    } else {
      setServiceForm({ ...serviceForm, cost: numericValue });
    }
  };

  const activeServiceAssetCodes = maintenanceList
    .filter(i => i.status !== 'Selesai')
    .map(i => i.asset_code);

  const availableAssets = assets.filter(asset => !activeServiceAssetCodes.includes(asset.asset_code));

  const filteredAvailableAssets = availableAssets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const ongoingList = maintenanceList.filter(i => i.status !== 'Selesai');
  const completedList = maintenanceList.filter(i => i.status === 'Selesai');

  const filteredMaintenanceItems = maintenanceList.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.technician_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    const matchesStartDate = !startDate || item.service_date >= startDate;
    const matchesEndDate = !endDate || item.service_date <= endDate;
    
    const matchesTab = 
      activeTab === 'ongoing' ? item.status !== 'Selesai' :
      activeTab === 'history' ? item.status === 'Selesai' : true;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate && matchesTab;
  });

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
          
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-24 px-8 md:px-12 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-lg">Perawatan & Servis Aset Kantor</h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2.5 cursor-pointer border border-emerald-400/30 backdrop-blur-md"
              >
                <span>📥 Unduh Detail Excel</span>
              </button>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-6 md:px-12 pt-10 space-y-8 pb-20">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/70 backdrop-blur-xl p-2 rounded-3xl border border-white/10 w-full shadow-2xl">
              <button 
                onClick={() => setActiveTab('available')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'available' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span>📦</span>
                <span>Aset Siap Diservis ({availableAssets.length})</span>
              </button>
              <button 
                onClick={() => setActiveTab('ongoing')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'ongoing' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span>🛠️</span>
                <span>Sedang Dalam Perawatan ({ongoingList.length})</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'history' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span>📋</span>
                <span>Riwayat Servis Selesai ({completedList.length})</span>
              </button>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              
              <div className="p-8 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <input 
                  type="text" 
                  placeholder={activeTab === 'available' ? "Cari nama aset, kode, atau lokasi..." : "Cari nama barang, kode, jenis servis, atau teknisi..."} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full lg:w-96 bg-slate-950/60 border border-white/15 rounded-2xl px-5 py-3.5 text-xs text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner"
                />

                <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                  {activeTab !== 'available' && (
                    <>
                      <div className="flex-1 sm:flex-none">
                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">DARI TANGGAL</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full sm:w-auto bg-slate-950/60 border border-white/15 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-inner"
                        />
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">SAMPAI TANGGAL</label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full sm:w-auto bg-slate-950/60 border border-white/15 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-inner"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">KATEGORI</label>
                    <select 
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto bg-slate-950/60 border border-white/15 rounded-2xl px-5 py-3 text-xs font-bold text-white cursor-pointer shadow-inner"
                    >
                      <option value="All" className="bg-slate-900 text-white">Semua Kategori</option>
                      <option value="Hardware / IT" className="bg-slate-900 text-white">Hardware / IT</option>
                      <option value="Furniture Kantor" className="bg-slate-900 text-white">Furniture Kantor</option>
                      <option value="Electronics / Elektronik" className="bg-slate-900 text-white">Electronics / Elektronik</option>
                    </select>
                  </div>
                  {(startDate || endDate || selectedCategoryFilter !== 'All') && (
                    <button 
                      onClick={() => { setStartDate(''); setEndDate(''); setSelectedCategoryFilter('All'); }}
                      className="self-end bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border border-white/10 backdrop-blur-md"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {activeTab === 'available' ? (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                        <th className="py-5 px-8">KODE ASET</th>
                        <th className="py-5 px-8">NAMA ASET</th>
                        <th className="py-5 px-8">KATEGORI</th>
                        <th className="py-5 px-8">LOKASI PENEMPATAN</th>
                        <th className="py-5 px-8">KONDISI</th>
                        <th className="py-5 px-8 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs">
                      {filteredAvailableAssets.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-16 text-slate-400">Tidak ada aset tersedia untuk diservis.</td></tr>
                      ) : (
                        filteredAvailableAssets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-white/5 transition">
                            <td className="py-5 px-8 font-mono text-sky-400 font-bold">{asset.asset_code}</td>
                            <td className="py-5 px-8 font-bold text-white">{asset.name}</td>
                            <td className="py-5 px-8 font-medium text-slate-300">{asset.category || 'Hardware / IT'}</td>
                            <td className="py-5 px-8 text-slate-300">{asset.location}</td>
                            <td className="py-5 px-8">
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {asset.condition || 'Good'}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-center">
                              <button 
                                onClick={() => handleOpenServiceModal(asset)}
                                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer inline-flex items-center gap-2 border border-sky-400/30"
                              >
                                <span>🛠️</span>
                                <span>Ajukan Servis Ini</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1250px]">
                    <thead>
                      <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                        <th className="py-5 px-8">KODE ASET</th>
                        <th className="py-5 px-8">NAMA ASET & KATEGORI</th>
                        <th className="py-5 px-8">JENIS PERAWATAN / SERVIS</th>
                        <th className="py-5 px-8">TEKNISI / VENDOR</th>
                        <th className="py-5 px-8">BIAYA SERVIS</th>
                        <th className="py-5 px-8">TANGGAL</th>
                        <th className="py-5 px-8">STATUS</th>
                        <th className="py-5 px-8 text-center">{activeTab === 'ongoing' ? 'FORM PENYELESAIAN' : 'KETERANGAN'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs">
                      {filteredMaintenanceItems.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-16 text-slate-400">Tidak ada data servis ditemukan.</td></tr>
                      ) : (
                        filteredMaintenanceItems.map((item) => {
                          const statusBg = 
                            item.status === 'Selesai' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            item.status === 'Sedang Dikerjakan' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30';

                          return (
                            <tr key={item.id} className="hover:bg-white/5 transition">
                              <td className="py-5 px-8 font-mono text-sky-400 font-bold">{item.asset_code}</td>
                              <td className="py-5 px-8">
                                <span className="font-bold text-white block">{item.item_name}</span>
                                <span className="font-semibold text-[11px] text-sky-400">{item.category}</span>
                              </td>
                              <td className="py-5 px-8 font-semibold text-slate-200">
                                {item.service_type}
                                {item.notes && <span className="block text-[11px] text-slate-400 font-normal mt-0.5">Catatan: {item.notes}</span>}
                              </td>
                              <td className="py-5 px-8 text-slate-300 font-semibold">{item.technician_name}</td>
                              <td className="py-5 px-8 font-mono font-bold text-emerald-400">{formatRupiah(item.cost)}</td>
                              <td className="py-5 px-8 font-mono text-slate-300">{item.service_date}</td>
                              <td className="py-5 px-8">
                                <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${statusBg}`}>
                                  • {item.status}
                                </span>
                              </td>
                              <td className="py-5 px-8 text-center">
                                {activeTab === 'ongoing' ? (
                                  <button 
                                    onClick={() => handleOpenCompleteModal(item)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5 mx-auto border border-emerald-400/30"
                                  >
                                    <span>✓</span>
                                    <span>Proses Penyelesaian</span>
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400 italic">Selesai Servis</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </main>
        </div>

        {showServiceModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-extrabold text-white text-base">Form Pengajuan Perawatan & Servis Aset</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                      {serviceForm.asset_code}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {serviceForm.item_name}
                    </span>
                    <span className="text-[10px] font-extrabold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                      {serviceForm.category}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowServiceModal(false)} 
                  className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition cursor-pointer border border-white/10"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Jenis Perawatan / Servis <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: Ganti SSD / Cuci AC" 
                      value={serviceForm.service_type} 
                      onChange={e => setServiceForm({...serviceForm, service_type: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Teknisi / Vendor
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nama Teknisi / Toko Servis" 
                      value={serviceForm.technician_name} 
                      onChange={e => setServiceForm({...serviceForm, technician_name: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Biaya Servis (Rp) <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={serviceForm.cost ? serviceForm.cost.toLocaleString('id-ID') : ''} 
                      onChange={e => handleCostInput(e, false)} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Tanggal Servis <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      required 
                      type="date" 
                      value={serviceForm.service_date} 
                      onChange={e => setServiceForm({...serviceForm, service_date: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Status <span className="text-rose-400">*</span>
                    </label>
                    <select 
                      value={serviceForm.status} 
                      onChange={e => setServiceForm({...serviceForm, status: e.target.value as any})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-sky-400 shadow-inner cursor-pointer"
                    >
                      <option value="Pending" className="bg-slate-900 text-white">Pending</option>
                      <option value="Sedang Dikerjakan" className="bg-slate-900 text-white">Sedang Dikerjakan</option>
                      <option value="Selesai" className="bg-slate-900 text-white">Selesai</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Catatan Tambahan
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Rincian perbaikan atau komponen yang diganti..." 
                    value={serviceForm.notes} 
                    onChange={e => setServiceForm({...serviceForm, notes: e.target.value})} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowServiceModal(false)} 
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-sky-400/30"
                  >
                    {loading ? 'Menyimpan...' : 'Ajukan Servis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCompleteModal && completingItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-extrabold text-white text-base">Form Penyelesaian Servis & Input Biaya</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                      {completingItem.asset_code}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {completingItem.item_name}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCompleteModal(false)} 
                  className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition cursor-pointer border border-white/10"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleConfirmCompletion} className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/15 space-y-2 text-xs shadow-inner">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Jenis Servis:</span>
                    <span className="font-bold text-white">{completingItem.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Teknisi / Vendor:</span>
                    <span className="font-bold text-white">{completingItem.technician_name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Tanggal Masuk:</span>
                    <span className="font-bold text-white">{completingItem.service_date}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Biaya / Tarif Servis Aktual (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={completionForm.cost ? completionForm.cost.toLocaleString('id-ID') : ''} 
                    onChange={e => handleCostInput(e, true)} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-emerald-400 shadow-inner" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Catatan Penyelesaian & Hasil Servis <span className="text-rose-400">*</span>
                  </label>
                  <textarea 
                    required 
                    rows={3}
                    value={completionForm.notes} 
                    onChange={e => setCompletionForm({...completionForm, notes: e.target.value})} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-emerald-400 shadow-inner" 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowCompleteModal(false)} 
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-emerald-400/30"
                  >
                    {loading ? 'Memproses...' : 'Konfirmasi & Selesaikan Servis'}
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