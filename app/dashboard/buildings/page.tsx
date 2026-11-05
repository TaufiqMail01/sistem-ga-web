'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

type BuildingItem = {
  id: string;
  facility_name: string;
  category: string;
  room_code: string;
  location_zone: string;
  area_size: string;
  max_capacity: string;
  supporting_facilities: string;
  condition: string;
  pic: string;
  acquisition_date: string;
  acquisition_cost: number;
};

type BuildingHistory = {
  id: string;
  building_id: string;
  date: string;
  activity_type: string;
  description: string;
  cost: number;
};

export default function BuildingsFacilitiesPage() {
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [currentBuilding, setCurrentBuilding] = useState<BuildingItem | null>(null);
  const [historyList, setHistoryList] = useState<BuildingHistory[]>([]);
  
  // State ceklist pengunci untuk setiap kolom di form edit
  const [editableFields, setEditableFields] = useState({
    facility_name: false,
    category: false,
    room_code: false,
    location_zone: false,
    area_size: false,
    max_capacity: false,
    supporting_facilities: false,
    condition: false,
    pic: false,
    acquisition_date: false,
    acquisition_cost: false,
  });

  const toggleFieldEdit = (field: keyof typeof editableFields) => {
    setEditableFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // History / Maintenance Form State
  const [historyForm, setHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activity_type: 'Perawatan / Servis Rutin',
    description: '',
    cost: 0,
  });

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');

  const [formData, setFormData] = useState({
    facility_name: '',
    category: 'Ruang Rapat / Meeting',
    room_code: '',
    location_zone: '',
    area_size: '',
    max_capacity: '',
    supporting_facilities: '',
    condition: 'Baik',
    pic: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    acquisition_cost: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchBuildings();
  }, []);

  const formatThousand = (val: number | string) => {
    if (val === '' || val === null || val === undefined) return '';
    const num = String(val).replace(/\D/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('id-ID');
  };

  const parseThousand = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? Number(num) : 0;
  };

  const fetchBuildings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('operational_buildings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBuildings(data);
    } else {
      setBuildings([]);
    }
    setLoading(false);
  };

  const handlePreSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleSaveBuildingConfirmed = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    const { data, error } = await supabase.from('operational_buildings').insert([formData]).select();

    if (error) {
      alert('Gagal menyimpan data fasilitas: ' + error.message);
    } else if (data && data.length > 0) {
      setBuildings([data[0], ...buildings]);

      await supabase.from('building_history').insert([{
        building_id: data[0].id,
        date: formData.acquisition_date,
        activity_type: 'Pendaftaran / Pengadaan Awal',
        description: `Fasilitas ${data[0].facility_name} (${data[0].room_code}) resmi didaftarkan.`,
        cost: formData.acquisition_cost
      }]);

      alert('Berhasil mendaftarkan fasilitas baru!');
    }

    setLoading(false);
    setShowAddModal(false);
    setFormData({
      facility_name: '',
      category: 'Ruang Rapat / Meeting',
      room_code: '',
      location_zone: '',
      area_size: '',
      max_capacity: '',
      supporting_facilities: '',
      condition: 'Baik',
      pic: '',
      acquisition_date: new Date().toISOString().split('T')[0],
      acquisition_cost: 0,
    });
    fetchBuildings();
  };

  const handleUpdateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBuilding) return;

    const { error } = await supabase.from('operational_buildings').update(currentBuilding).eq('id', currentBuilding.id);
    if (error) {
      alert('Gagal memperbarui fasilitas: ' + error.message);
    } else {
      alert('Berhasil memperbarui data fasilitas!');
      setShowEditModal(false);
      fetchBuildings();
    }
  };

  const openHistoryModal = async (building: BuildingItem) => {
    setCurrentBuilding(building);
    setShowHistoryModal(true);
    const { data, error } = await supabase.from('building_history').select('*').eq('building_id', building.id).order('date', { ascending: false });
    if (!error && data) {
      setHistoryList(data);
    } else {
      setHistoryList([]);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBuilding) return;

    const newHistItem = {
      building_id: currentBuilding.id,
      ...historyForm,
      cost: Number(historyForm.cost)
    };

    const { data, error } = await supabase.from('building_history').insert([newHistItem]).select();
    if (error) {
      alert('Gagal menambahkan riwayat: ' + error.message);
    } else if (data) {
      setHistoryList([data[0], ...historyList]);
      alert('Catatan perawatan/renovasi berhasil ditambahkan!');
    }

    setHistoryForm({
      date: new Date().toISOString().split('T')[0],
      activity_type: 'Perawatan / Servis Rutin',
      description: '',
      cost: 0,
    });
  };

  const totalHistoryCost = historyList.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const exportAllDataToExcel = async () => {
    const { data: allBuildings } = await supabase.from('operational_buildings').select('*');
    const { data: allHistories } = await supabase.from('building_history').select('*');

    const listToExport = allBuildings && allBuildings.length > 0 ? allBuildings : buildings;

    let csvContent = "\uFEFF";
    csvContent += "Nama Fasilitas;Kode Ruangan;Kategori;Zona Lokasi;Luas Area;Kapasitas;Fasilitas Pendukung;Kondisi;PIC;Tanggal Pengadaan;Biaya Pengadaan (Rp);Tanggal Aktivitas;Jenis Aktivitas;Deskripsi / Keterangan;Biaya Aktivitas (Rp)\n";

    listToExport.forEach(b => {
      const bHistories = allHistories ? allHistories.filter(h => h.building_id === b.id) : [];

      if (bHistories.length === 0) {
        csvContent += `"${b.facility_name}";"${b.room_code}";"${b.category}";"${b.location_zone}";"${b.area_size}";"${b.max_capacity}";"${b.supporting_facilities}";"${b.condition}";"${b.pic}";"${b.acquisition_date || '-'}";${b.acquisition_cost || 0};"-";"-";"-";0\n`;
      } else {
        bHistories.forEach(h => {
          const desc = h.description ? h.description.replace(/"/g, '""') : '';
          csvContent += `"${b.facility_name}";"${b.room_code}";"${b.category}";"${b.location_zone}";"${b.area_size}";"${b.max_capacity}";"${b.supporting_facilities}";"${b.condition}";"${b.pic}";"${b.acquisition_date || '-'}";${b.acquisition_cost || 0};"${h.date}";"${h.activity_type}";"${desc}";${h.cost}\n`;
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Semua_Data_Gedung_Dan_Fasilitas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSingleBuildingHistory = () => {
    if (!currentBuilding) return;

    let csvContent = "\uFEFF";
    csvContent += `RIWAYAT FASILITAS: ${currentBuilding.room_code};${currentBuilding.facility_name}\n`;
    csvContent += `Tanggal Pengadaan: ${currentBuilding.acquisition_date};Biaya Pengadaan: Rp ${currentBuilding.acquisition_cost || 0};PIC: ${currentBuilding.pic};Kondisi: ${currentBuilding.condition}\n\n`;
    csvContent += "Tanggal;Jenis Aktivitas;Deskripsi / Keterangan;Biaya (Rp)\n";

    historyList.forEach(h => {
      const desc = h.description ? h.description.replace(/"/g, '""') : '';
      csvContent += `"${h.date}";"${h.activity_type}";"${desc}";${h.cost}\n`;
    });

    csvContent += `\n;;TOTAL BIAYA TERCATAT;${totalHistoryCost}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Riwayat_${currentBuilding.room_code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBuildings = buildings.filter(b => {
    const matchesSearch = 
      b.facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location_zone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || b.category === categoryFilter;
    const matchesCondition = conditionFilter === 'All' || b.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesCondition;
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
        select option {
          background-color: #0b1329 !important;
          color: #ffffff !important;
          padding: 12px 16px !important;
          font-weight: 700 !important;
        }
        select option:hover, select option:checked, select option:focus {
          background-color: #2563eb !important;
          color: #ffffff !important;
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
              <h1 className="font-extrabold text-white text-base">Gedung & Fasilitas Kantor</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportAllDataToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                title="Unduh semua data fasilitas & riwayat ke Excel"
              >
                <span>📥 Unduh Semua Excel</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
              >
                <span>+ Tambah Fasilitas Baru</span>
              </button>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <input 
                type="text" 
                placeholder="Cari nama ruangan, kode, PIC, atau zona lokasi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-400 font-medium w-full lg:w-96 outline-none focus:border-sky-400 transition"
              />
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0b1329] border border-white/15 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg relative w-full sm:w-56">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">FILTER</span>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full appearance-none truncate pr-6"
                  >
                    <option value="All">Semua Kategori</option>
                    <option value="Ruang Rapat / Meeting">Ruang Rapat / Meeting</option>
                    <option value="Area Kerja / Workspace">Area Kerja / Workspace</option>
                    <option value="Fasilitas Umum">Fasilitas Umum</option>
                    <option value="Gudang Penyimpanan">Gudang Penyimpanan</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white text-[10px] font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#0b1329] border border-white/15 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg relative w-full sm:w-52">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">FILTER</span>
                  <select 
                    value={conditionFilter}
                    onChange={(e) => setConditionFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full appearance-none truncate pr-6"
                  >
                    <option value="All">Semua Kondisi</option>
                    <option value="Baik">Baik</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white text-[10px] font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {(searchQuery || categoryFilter !== 'All' || conditionFilter !== 'All') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setConditionFilter('All'); }}
                    className="bg-white/10 hover:bg-white/20 text-slate-200 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border border-white/10 whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-white text-sm uppercase">Daftar Ruangan & Area Fasilitas</h3>
                  <p className="text-xs text-slate-300">Kelola informasi zona, fasilitas pendukung, kapasitas, dan PIC.</p>
                </div>
                <span className="text-xs text-slate-300 font-mono">Menampilkan: {filteredBuildings.length} dari {buildings.length} Unit</span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Nama Ruangan & Kode</th>
                      <th className="py-4 px-6">Kategori & Zona</th>
                      <th className="py-4 px-6">Luas / Kapasitas</th>
                      <th className="py-4 px-6">Pengadaan & Biaya</th>
                      <th className="py-4 px-6">Fasilitas Pendukung</th>
                      <th className="py-4 px-6">Penanggung Jawab</th>
                      <th className="py-4 px-6 text-center">Kondisi</th>
                      <th className="py-4 px-6 text-center">Aksi & History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400 italic">Memuat data fasilitas...</td></tr>
                    ) : filteredBuildings.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400 italic">Tidak ada data fasilitas yang cocok dengan pencarian atau filter.</td></tr>
                    ) : (
                      filteredBuildings.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6">
                            <span className="font-bold text-white block text-sm">{item.facility_name}</span>
                            <span className="font-mono text-[11px] text-sky-400 font-bold">{item.room_code}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-white block">{item.category}</span>
                            <span className="text-[10px] text-slate-400">{item.location_zone}</span>
                          </td>
                          <td className="py-4 px-6 text-slate-200 font-semibold">
                            <div>{item.area_size}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{item.max_capacity}</div>
                          </td>
                          <td className="py-4 px-6 font-mono">
                            <div className="font-bold text-white">{item.acquisition_date || '-'}</div>
                            <div className="text-[11px] font-bold text-emerald-400 mt-0.5">{formatRupiah(item.acquisition_cost || 0)}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-300 max-w-xs truncate" title={item.supporting_facilities}>{item.supporting_facilities}</td>
                          <td className="py-4 px-6 text-slate-200 font-semibold">{item.pic}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${item.condition === 'Baik' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => { 
                                  setCurrentBuilding(item); 
                                  setEditableFields({
                                    facility_name: false,
                                    category: false,
                                    room_code: false,
                                    location_zone: false,
                                    area_size: false,
                                    max_capacity: false,
                                    supporting_facilities: false,
                                    condition: false,
                                    pic: false,
                                    acquisition_date: false,
                                    acquisition_cost: false,
                                  });
                                  setShowEditModal(true); 
                                }}
                                className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md cursor-pointer border border-sky-400/30"
                                title="Edit Data & Kondisi"
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => openHistoryModal(item)}
                                className="bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer border border-white/10"
                                title="Riwayat Perawatan & Biaya"
                              >
                                📋 History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Formulir Pendaftaran Fasilitas Rinci</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handlePreSaveCheck} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Fasilitas / Ruangan <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Ruang Rapat Eksekutif" value={formData.facility_name} onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kode Ruangan <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="ROM-M301" value={formData.room_code} onChange={(e) => setFormData({ ...formData, room_code: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono font-bold uppercase outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategori</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none">
                      <option value="Ruang Rapat / Meeting">Ruang Rapat / Meeting</option>
                      <option value="Area Kerja / Workspace">Area Kerja / Workspace</option>
                      <option value="Fasilitas Umum">Fasilitas Umum</option>
                      <option value="Gudang Penyimpanan">Gudang Penyimpanan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Zona / Lokasi Gedung <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Lantai 3 Gedung Utama" value={formData.location_zone} onChange={(e) => setFormData({ ...formData, location_zone: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Luas Area <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="60 m²" value={formData.area_size} onChange={(e) => setFormData({ ...formData, area_size: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kapasitas Maksimal <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="30 Orang" value={formData.max_capacity} onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Tanggal Pengadaan *</label>
                    <input type="date" required value={formData.acquisition_date} onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Biaya Pengadaan (Rp) *</label>
                    <input type="text" required placeholder="75.000.000" value={formatThousand(formData.acquisition_cost)} onChange={(e) => setFormData({ ...formData, acquisition_cost: parseThousand(e.target.value) })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Fasilitas Pendukung <span className="text-rose-400">*</span></label>
                  <input type="text" required placeholder="AC Inverter, Proyektor, Smart TV, Sound System" value={formData.supporting_facilities} onChange={(e) => setFormData({ ...formData, supporting_facilities: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-medium outline-none focus:border-sky-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kondisi</label>
                    <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none">
                      <option value="Baik">Baik</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Penanggung Jawab (PIC) <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Facility Management Team" value={formData.pic} onChange={(e) => setFormData({ ...formData, pic: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">Simpan Fasilitas 🚀</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center text-white">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
              <div className="space-y-1">
                <h3 className="font-black text-white text-base">Konfirmasi Kebenaran Data Fasilitas</h3>
                <p className="text-xs text-slate-300">Pastikan informasi gedung dan fasilitas di bawah ini sudah benar sebelum disimpan:</p>
              </div>

              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-1.5 font-medium text-slate-300">
                <div><strong className="text-white">Nama Fasilitas:</strong> {formData.facility_name} ({formData.room_code})</div>
                <div><strong className="text-white">Kategori / Zona:</strong> {formData.category} — {formData.location_zone}</div>
                <div><strong className="text-white">Luas / Kapasitas:</strong> {formData.area_size} / {formData.max_capacity}</div>
                <div><strong className="text-white">Tanggal Pengadaan:</strong> {formData.acquisition_date}</div>
                <div><strong className="text-white">Biaya Pengadaan:</strong> {formatRupiah(formData.acquisition_cost)}</div>
                <div><strong className="text-white">Penanggung Jawab:</strong> {formData.pic}</div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowConfirmModal(false)} 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer flex-1 border border-white/10"
                >
                  Periksa Kembali
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveBuildingConfirmed} 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg cursor-pointer flex-1 border border-emerald-400/30"
                >
                  Ya, Data Sudah Benar ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && currentBuilding && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Edit Data Fasilitas: {currentBuilding.room_code}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleUpdateBuilding} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Nama Fasilitas *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.facility_name} onChange={() => toggleFieldEdit('facility_name')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="text" disabled={!editableFields.facility_name} value={currentBuilding.facility_name} onChange={(e) => setCurrentBuilding({...currentBuilding, facility_name: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold ${editableFields.facility_name ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Kode Ruangan *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.room_code} onChange={() => toggleFieldEdit('room_code')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="text" disabled={!editableFields.room_code} value={currentBuilding.room_code} onChange={(e) => setCurrentBuilding({...currentBuilding, room_code: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 text-xs font-mono font-bold uppercase ${editableFields.room_code ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Kategori</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.category} onChange={() => toggleFieldEdit('category')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <select disabled={!editableFields.category} value={currentBuilding.category} onChange={(e) => setCurrentBuilding({...currentBuilding, category: e.target.value})} className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.category ? 'bg-slate-950/60 border-white/15 text-white cursor-pointer outline-none' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}>
                      <option value="Ruang Rapat / Meeting">Ruang Rapat / Meeting</option>
                      <option value="Area Kerja / Workspace">Area Kerja / Workspace</option>
                      <option value="Fasilitas Umum">Fasilitas Umum</option>
                      <option value="Gudang Penyimpanan">Gudang Penyimpanan</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Kondisi</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.condition} onChange={() => toggleFieldEdit('condition')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <select disabled={!editableFields.condition} value={currentBuilding.condition} onChange={(e) => setCurrentBuilding({...currentBuilding, condition: e.target.value})} className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.condition ? 'bg-slate-950/60 border-white/15 text-white cursor-pointer outline-none' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}>
                      <option value="Baik">Baik</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Tanggal Pengadaan *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.acquisition_date} onChange={() => toggleFieldEdit('acquisition_date')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="date" disabled={!editableFields.acquisition_date} value={currentBuilding.acquisition_date} onChange={(e) => setCurrentBuilding({...currentBuilding, acquisition_date: e.target.value})} className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.acquisition_date ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Biaya Pengadaan (Rp) *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.acquisition_cost} onChange={() => toggleFieldEdit('acquisition_cost')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="text" disabled={!editableFields.acquisition_cost} value={formatThousand(currentBuilding.acquisition_cost)} onChange={(e) => setCurrentBuilding({...currentBuilding, acquisition_cost: parseThousand(e.target.value)})} className={`w-full border rounded-2xl px-3 py-3 text-xs font-mono font-bold ${editableFields.acquisition_cost ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Penanggung Jawab / PIC *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.pic} onChange={() => toggleFieldEdit('pic')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="text" disabled={!editableFields.pic} value={currentBuilding.pic} onChange={(e) => setCurrentBuilding({...currentBuilding, pic: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold ${editableFields.pic ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Zona Lokasi *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input type="checkbox" checked={editableFields.location_zone} onChange={() => toggleFieldEdit('location_zone')} className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer" />
                        Ubah
                      </label>
                    </div>
                    <input type="text" disabled={!editableFields.location_zone} value={currentBuilding.location_zone} onChange={(e) => setCurrentBuilding({...currentBuilding, location_zone: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold ${editableFields.location_zone ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`} required />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">Simpan Perubahan 🚀</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistoryModal && currentBuilding && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-black text-white text-base">Riwayat Perawatan & Renovasi: {currentBuilding.room_code}</h3>
                  <p className="text-xs text-slate-300">
                    {currentBuilding.facility_name} — Pengadaan: {currentBuilding.acquisition_date} ({formatRupiah(currentBuilding.acquisition_cost || 0)}) — PIC: {currentBuilding.pic}
                  </p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 backdrop-blur-sm">
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 uppercase block">Total Akumulasi Biaya (Termasuk Pengadaan)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatRupiah(totalHistoryCost)}</span>
                </div>
                <button 
                  onClick={exportSingleBuildingHistory}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                  title="Unduh riwayat fasilitas ini ke Excel"
                >
                  <span>📊 Unduh Excel Fasilitas Ini</span>
                </button>
              </div>

              <form onSubmit={handleAddHistory} className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <h4 className="font-bold text-xs text-slate-200 uppercase">+ Tambah Catatan Perawatan / Renovasi / Aktivitas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal</label>
                    <input type="date" value={historyForm.date} onChange={(e) => setHistoryForm({...historyForm, date: e.target.value})} className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Aktivitas</label>
                    <select value={historyForm.activity_type} onChange={(e) => setHistoryForm({...historyForm, activity_type: e.target.value})} className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer outline-none">
                      <option value="Perawatan / Servis Rutin">Perawatan / Servis Rutin</option>
                      <option value="Renovasi / Perbaikan Besar">Renovasi / Perbaikan Besar</option>
                      <option value="Penggantian Inventaris Ruangan">Penggantian Inventaris Ruangan</option>
                      <option value="Pemeriksaan Berkala">Pemeriksaan Berkala</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Biaya (Rp)</label>
                    <input type="text" value={formatThousand(historyForm.cost)} onChange={(e) => setHistoryForm({...historyForm, cost: parseThousand(e.target.value)})} className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan / Deskripsi Pekerjaan</label>
                  <input type="text" placeholder="Contoh: Perbaikan AC bocor dan pengecatan ulang dinding" value={historyForm.description} onChange={(e) => setHistoryForm({...historyForm, description: e.target.value})} className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white font-medium outline-none" required />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer border border-sky-400/30">+ Simpan Catatan</button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-200 uppercase">Daftar Riwayat Perawatan & Aktivitas ({historyList.length})</h4>
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/60 text-slate-400 text-[10px] uppercase border-b border-white/10">
                        <th className="py-3 px-4">Tanggal</th>
                        <th className="py-3 px-4">Jenis Aktivitas</th>
                        <th className="py-3 px-4">Deskripsi / Perubahan</th>
                        <th className="py-3 px-4 text-right">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {historyList.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 italic">Belum ada catatan riwayat untuk fasilitas ini.</td></tr>
                      ) : (
                        historyList.map(h => (
                          <tr key={h.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-200">{h.date}</td>
                            <td className="py-3 px-4 font-bold text-sky-400">{h.activity_type}</td>
                            <td className="py-3 px-4 text-slate-300">{h.description}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatRupiah(h.cost)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowHistoryModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}