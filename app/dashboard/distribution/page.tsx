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

type DistributionRecord = {
  id: string;
  asset_name: string;
  asset_code: string;
  category?: string;
  borrower: string;
  department: string;
  borrow_timestamp: string;
  return_timestamp?: string;
  completeness: string;
  status: string;
};

// Daftar checklist spesifik berdasarkan kategori aset
const GET_CHECKLIST_BY_CATEGORY = (category?: string) => {
  if (category === 'Furniture Kantor') {
    return [
      'Unit Utama Furniture (Meja / Kursi / Lemari)',
      'Kunci Laci / Pintu Kabinet (Set)',
      'Roda / Kaki Pendukung',
      'Baut & Komponen Perakitan Lengkap',
      'Buku Panduan / Manual Pemasangan'
    ];
  } else if (category === 'Electronics / Elektronik') {
    return [
      'Unit Utama Elektronik',
      'Kabel Power / Adaptor Daya',
      'Remote Control',
      'Kabel HDMI / VGA / Audio',
      'Stand / Kaki / Ceiling Bracket',
      'Dongle Wireless / Transmitter',
      'Buku Manual & Kartu Garansi'
    ];
  } else {
    // Default: Hardware / IT
    return [
      'Unit Utama (Perangkat)',
      'Charger / Adaptor Daya',
      'Tas / Softcase / Pouch',
      'Mouse Wireless',
      'Keyboard Wireless',
      'USB Receiver / Dongle',
      'Presenter / Laser Pointer',
      'Kabel Power / AC Cord',
      'Kabel HDMI / DisplayPort',
      'Kabel VGA / DVI',
      'Kabel LAN / Ethernet (RJ45)',
      'Kabel USB Extension / Data',
      'Kabel Type-C to Type-C / Converter',
      'Kabel Audio / AUX 3.5mm',
      'Dongle / USB Hub / Multiport',
      'Stand / Kaki / Bracket',
      'Buku Manual & Kartu Garansi'
    ];
  }
};

export default function DistributionPage() {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
  const [distributionList, setDistributionList] = useState<DistributionRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newDistribution, setNewDistribution] = useState({
    asset_id: '',
    asset_name: '',
    asset_code: '',
    category: 'Hardware / IT',
    borrower: '',
    department: '',
    borrow_date: new Date().toISOString().split('T')[0],
  });

  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);

  const [returningItem, setReturningItem] = useState<DistributionRecord | null>(null);
  const [checkedReturnItems, setCheckedReturnItems] = useState<string[]>([]);
  const [returnNotes, setReturnNotes] = useState('Kondisi fisik unit baik dan lengkap sesuai saat dipinjam.');

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

    const { data: distData, error: distError } = await supabase
      .from('distributions')
      .select('*')
      .order('borrow_timestamp', { ascending: false });

    if (!distError && distData) {
      setDistributionList(distData);
    } else {
      setDistributionList([]);
    }
    setLoading(false);
  };

  const handleOpenModalForAsset = (asset: Asset) => {
    const assetCategory = asset.category || 'Hardware / IT';
    setNewDistribution({
      ...newDistribution,
      asset_id: asset.id,
      asset_name: asset.name,
      asset_code: asset.asset_code,
      category: assetCategory,
      borrow_date: new Date().toISOString().split('T')[0],
    });
    
    const defaultList = GET_CHECKLIST_BY_CATEGORY(assetCategory);
    setSelectedChecklist([defaultList[0], defaultList[1] || '']);
    setShowLendModal(true);
  };

  const handleToggleChecklist = (item: string) => {
    if (selectedChecklist.includes(item)) {
      setSelectedChecklist(selectedChecklist.filter(i => i !== item));
    } else {
      setSelectedChecklist([...selectedChecklist, item]);
    }
  };

  const handleToggleReturnChecklist = (item: string) => {
    if (checkedReturnItems.includes(item)) {
      setCheckedReturnItems(checkedReturnItems.filter(i => i !== item));
    } else {
      setCheckedReturnItems([...checkedReturnItems, item]);
    }
  };

  const handleAddDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedTimestamp = `${newDistribution.borrow_date} ${hours}:${minutes}:${seconds} WIB`;
    
    const completenessString = selectedChecklist.length > 0 ? selectedChecklist.join(', ') : 'Unit Utama Saja';

    const payload = {
      asset_name: newDistribution.asset_name,
      asset_code: newDistribution.asset_code,
      category: newDistribution.category,
      borrower: newDistribution.borrower,
      department: newDistribution.department,
      borrow_timestamp: formattedTimestamp,
      completeness: completenessString,
      status: 'Dipinjam Aktif',
    };

    const { error } = await supabase.from('distributions').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Gagal menyimpan peminjaman: ' + error.message);
    } else {
      fetchData();
    }

    setShowLendModal(false);
    setNewDistribution({
      asset_id: '',
      asset_name: '',
      asset_code: '',
      category: 'Hardware / IT',
      borrower: '',
      department: '',
      borrow_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleOpenReturnModal = (item: DistributionRecord) => {
    setReturningItem(item);
    const originalItems = item.completeness ? item.completeness.split(', ').map(s => s.trim()) : [];
    setCheckedReturnItems(originalItems);
    setReturnNotes('Kondisi fisik unit baik dan lengkap sesuai saat dipinjam.');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningItem) return;

    setLoading(true);
    
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const returnDateStr = `${currentDateStr} ${hours}:${minutes}:${seconds} WIB`;

    const { error } = await supabase
      .from('distributions')
      .update({ 
        status: 'Dikembalikan',
        return_timestamp: returnDateStr 
      })
      .eq('id', returningItem.id);

    setLoading(false);

    if (error) {
      alert('Gagal memproses pengembalian: ' + error.message);
    } else {
      fetchData();
    }

    setShowReturnModal(false);
    setReturningItem(null);
  };

  const exportToExcel = () => {
    let csvContent = "\uFEFF";
    if (activeTab === 'available') {
      csvContent += "Kode Aset;Nama Aset;Kategori;Lokasi Penempatan;Kondisi\n";
      filteredAvailableAssets.forEach(item => {
        csvContent += `"${item.asset_code}";"${item.name}";"${item.category || 'Hardware / IT'}";"${item.location}";"${item.condition}"\n`;
      });
    } else if (activeTab === 'active') {
      csvContent += "Kode Aset;Nama Aset;Kategori;Peminjam;Divisi / Unit;Kelengkapan Unit;Waktu Pinjam;Status\n";
      filteredActiveLoans.forEach(item => {
        csvContent += `"${item.asset_code}";"${item.asset_name}";"${item.category || 'Hardware / IT'}";"${item.borrower}";"${item.department}";"${item.completeness}";"${item.borrow_timestamp}";"${item.status}"\n`;
      });
    } else {
      csvContent += "Kode Aset;Nama Aset;Kategori;Peminjam;Divisi / Unit;Kelengkapan Unit;Tanggal Pengembalian;Status\n";
      filteredHistory.forEach(item => {
        csvContent += `"${item.asset_code}";"${item.asset_name}";"${item.category || 'Hardware / IT'}";"${item.borrower}";"${item.department}";"${item.completeness}";"${item.return_timestamp || item.borrow_timestamp}";"${item.status}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Distribusi_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeAssetCodes = distributionList
    .filter(item => item.status === 'Dipinjam Aktif')
    .map(item => item.asset_code);

  const availableAssets = assets.filter(asset => !activeAssetCodes.includes(asset.asset_code));

  const filteredAvailableAssets = availableAssets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeLoansList = distributionList.filter(item => item.status === 'Dipinjam Aktif');
  const filteredActiveLoans = activeLoansList.filter(item => {
    const matchesSearch = item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.borrower.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.completeness.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    const matchesStartDate = !startDate || item.borrow_timestamp >= startDate;
    const matchesEndDate = !endDate || item.borrow_timestamp <= endDate;
    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
  });

  const historyList = distributionList.filter(item => item.status === 'Dikembalikan');
  const filteredHistory = historyList.filter(item => {
    const matchesSearch = item.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.borrower.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.completeness.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    const returnTime = item.return_timestamp || item.borrow_timestamp;
    const matchesStartDate = !startDate || returnTime >= startDate;
    const matchesEndDate = !endDate || returnTime <= endDate;
    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
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
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition flex items-center gap-3 cursor-pointer border border-white/10"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-lg">Manajemen Distribusi & Peminjaman Aset</h1>
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
                <span>Barang Siap Dipinjam ({availableAssets.length})</span>
              </button>
              <button 
                onClick={() => setActiveTab('active')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'active' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span>🔄</span>
                <span>Barang Sedang Dipinjam ({activeLoansList.length})</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'history' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <span>📋</span>
                <span>Riwayat Peminjaman ({historyList.length})</span>
              </button>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              
              <div className="p-8 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <input 
                  type="text" 
                  placeholder={activeTab === 'available' ? "Cari nama aset, kode, atau lokasi..." : "Cari nama barang, peminjam, divisi, atau kelengkapan..."}
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

              {activeTab === 'available' && (
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
                        <tr><td colSpan={6} className="text-center py-16 text-slate-400">Tidak ada aset tersedia di gudang.</td></tr>
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
                                onClick={() => handleOpenModalForAsset(asset)}
                                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer border border-sky-400/30"
                              >
                                🤝 Pinjamkan Barang Ini
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'active' && (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1250px]">
                    <thead>
                      <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                        <th className="py-5 px-8">KODE ASET</th>
                        <th className="py-5 px-8">NAMA ASET</th>
                        <th className="py-5 px-8">KATEGORI</th>
                        <th className="py-5 px-8">PEMINJAM</th>
                        <th className="py-5 px-8">DIVISI / UNIT</th>
                        <th className="py-5 px-8">KELENGKAPAN UNIT</th>
                        <th className="py-5 px-8">WAKTU PINJAM</th>
                        <th className="py-5 px-8">STATUS</th>
                        <th className="py-5 px-8 text-center">FORM PENGEMBALIAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs">
                      {filteredActiveLoans.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-16 text-slate-400">Tidak ada barang yang sedang dipinjam saat ini.</td></tr>
                      ) : (
                        filteredActiveLoans.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-5 px-8 font-mono text-sky-400 font-bold">{item.asset_code}</td>
                            <td className="py-5 px-8 font-bold text-white">{item.asset_name}</td>
                            <td className="py-5 px-8 font-medium text-slate-300">{item.category || 'Hardware / IT'}</td>
                            <td className="py-5 px-8 font-bold text-white">{item.borrower}</td>
                            <td className="py-5 px-8 text-slate-300">{item.department}</td>
                            <td className="py-5 px-8 text-slate-300 font-medium max-w-xs">
                              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px] text-slate-200 inline-block leading-relaxed border border-white/10">
                                {item.completeness || 'Unit Utama'}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-slate-300 font-semibold">
                              {item.borrow_timestamp}
                            </td>
                            <td className="py-5 px-8">
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-center">
                              <button 
                                onClick={() => handleOpenReturnModal(item)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5 mx-auto border border-emerald-400/30"
                              >
                                <span>✓</span>
                                <span>Proses Pengembalian</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1250px]">
                    <thead>
                      <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                        <th className="py-5 px-8">KODE ASET</th>
                        <th className="py-5 px-8">NAMA ASET</th>
                        <th className="py-5 px-8">KATEGORI</th>
                        <th className="py-5 px-8">PEMINJAM</th>
                        <th className="py-5 px-8">DIVISI / UNIT</th>
                        <th className="py-5 px-8">KELENGKAPAN UNIT</th>
                        <th className="py-5 px-8">TANGGAL PENGEMBALIAN</th>
                        <th className="py-5 px-8">STATUS</th>
                        <th className="py-5 px-8 text-center">KETERANGAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs">
                      {filteredHistory.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-16 text-slate-400">Belum ada riwayat peminjaman selesai.</td></tr>
                      ) : (
                        filteredHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-5 px-8 font-mono text-sky-400 font-bold">{item.asset_code}</td>
                            <td className="py-5 px-8 font-bold text-white">{item.asset_name}</td>
                            <td className="py-5 px-8 font-medium text-slate-300">{item.category || 'Hardware / IT'}</td>
                            <td className="py-5 px-8 font-bold text-white">{item.borrower}</td>
                            <td className="py-5 px-8 text-slate-300">{item.department}</td>
                            <td className="py-5 px-8 text-slate-300 font-medium max-w-xs">
                              <span className="bg-white/10 px-2.5 py-1 rounded-lg text-[11px] text-slate-200 inline-block leading-relaxed border border-white/10">
                                {item.completeness || 'Unit Utama'}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-slate-300 font-semibold">
                              {item.return_timestamp || item.borrow_timestamp}
                            </td>
                            <td className="py-5 px-8">
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-center">
                              <span className="text-xs font-bold text-slate-400 italic">Selesai Dikembalikan</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </main>
        </div>

        {/* MODAL PEMINJAMAN DENGAN CHECKLIST KATEGORI DINAMIS */}
        {showLendModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-extrabold text-white text-base">Form Peminjaman Barang</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                      {newDistribution.asset_code}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {newDistribution.asset_name}
                    </span>
                    <span className="text-[10px] font-extrabold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                      {newDistribution.category}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLendModal(false)} 
                  className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition cursor-pointer border border-white/10"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddDistribution} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nama Peminjam <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: Budi Santoso" 
                      value={newDistribution.borrower} 
                      onChange={e => setNewDistribution({...newDistribution, borrower: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Divisi / Unit <span className="text-rose-400">*</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Contoh: Tim IT Support" 
                      value={newDistribution.department} 
                      onChange={e => setNewDistribution({...newDistribution, department: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Peminjaman <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    required 
                    type="date" 
                    value={newDistribution.borrow_date} 
                    onChange={e => setNewDistribution({...newDistribution, borrow_date: e.target.value})} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-sky-400 shadow-inner" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Kelengkapan Unit ({newDistribution.category})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/60 p-4 rounded-2xl border border-white/15 max-h-56 overflow-y-auto shadow-inner">
                    {GET_CHECKLIST_OPTIONS_FOR(newDistribution.category).map((item: string) => (
                      <label key={item} className="flex items-center gap-3 text-xs font-medium text-slate-300 cursor-pointer select-none hover:bg-white/5 p-1.5 rounded-xl transition">
                        <input 
                          type="checkbox"
                          checked={selectedChecklist.includes(item)}
                          onChange={() => handleToggleChecklist(item)}
                          className="w-4 h-4 rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowLendModal(false)} 
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-sky-400/30"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Peminjaman'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PENGEMBALIAN DENGAN CHECKLIST KATEGORI DINAMIS */}
        {showReturnModal && returningItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-extrabold text-white text-base">Form Pengembalian Aset</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                      {returningItem.asset_code}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {returningItem.asset_name}
                    </span>
                    <span className="text-[10px] font-extrabold bg-white/10 text-slate-200 px-2 py-0.5 rounded-md border border-white/10">
                      {returningItem.category || 'Hardware / IT'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReturnModal(false)} 
                  className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition cursor-pointer border border-white/10"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleConfirmReturn} className="space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/15 space-y-2 text-xs shadow-inner">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Nama Peminjam:</span>
                    <span className="font-bold text-white">{returningItem.borrower} ({returningItem.department})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Waktu Pinjam:</span>
                    <span className="font-bold text-white">{returningItem.borrow_timestamp}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-slate-400 font-semibold block mb-1">Kelengkapan Saat Dipinjam:</span>
                    <span className="font-medium text-sky-400 italic block">{returningItem.completeness || 'Unit Utama Saja'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    Cek Fisik & Kelengkapan Saat Kembali ({returningItem.category || 'Hardware / IT'})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/60 p-4 rounded-2xl border border-white/15 max-h-52 overflow-y-auto shadow-inner">
                    {GET_CHECKLIST_OPTIONS_FOR(returningItem.category).map((item: string) => (
                      <label key={item} className="flex items-center gap-3 text-xs font-medium text-slate-300 cursor-pointer select-none hover:bg-white/5 p-1.5 rounded-xl transition">
                        <input 
                          type="checkbox"
                          checked={checkedReturnItems.includes(item)}
                          onChange={() => handleToggleReturnChecklist(item)}
                          className="w-4 h-4 rounded border-white/20 bg-slate-950 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Catatan Kondisi / Keterangan Pengembalian <span className="text-rose-400">*</span>
                  </label>
                  <textarea 
                    required 
                    rows={2}
                    value={returnNotes} 
                    onChange={e => setReturnNotes(e.target.value)} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white placeholder-slate-400 focus:outline-emerald-400 shadow-inner" 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button 
                    type="button" 
                    onClick={() => setShowReturnModal(false)} 
                    className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50 border border-emerald-400/30"
                  >
                    {loading ? 'Memproses...' : 'Konfirmasi & Selesaikan Pengembalian'}
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

// Helper function untuk mengambil checklist sesuai kategori
function GET_CHECKLIST_OPTIONS_FOR(category?: string) {
  return GET_CHECKLIST_BY_CATEGORY(category);
}