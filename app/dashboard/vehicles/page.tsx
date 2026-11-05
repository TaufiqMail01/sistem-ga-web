'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

type Vehicle = {
  id: string;
  plate_number: string;
  vehicle_name: string;
  category: string;
  ownership: string;
  manufacture_year: number;
  chassis_number: string;
  engine_number: string;
  color: string;
  purchase_date: string;
  purchase_price: number;
  tax_due_date: string;
  insurance_due_date: string | null;
  driver_in_charge: string;
  status: string;
};

type VehicleHistory = {
  id: string;
  vehicle_id: string;
  date: string;
  activity_type: string;
  description: string;
  cost: number;
};

export default function VehicleRegistrationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [historyList, setHistoryList] = useState<VehicleHistory[]>([]);
  
  // State ceklist pengunci untuk setiap kolom di form edit
  const [editableFields, setEditableFields] = useState({
    plate_number: false,
    vehicle_name: false,
    category: false,
    status: false,
    purchase_date: false,
    purchase_price: false,
    tax_due_date: false,
    driver_in_charge: false,
  });

  const toggleFieldEdit = (field: keyof typeof editableFields) => {
    setEditableFields(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  // History Form State
  const [historyForm, setHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activity_type: 'Servis / Perawatan Rutin',
    description: '',
    cost: 0,
  });

  // State Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [form, setForm] = useState({
    plate_number: '',
    vehicle_name: '',
    category: 'Mobil Operasional',
    ownership: 'Inventaris Kantor',
    manufacture_year: 2025,
    chassis_number: '',
    engine_number: '',
    color: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    tax_due_date: new Date().toISOString().split('T')[0],
    insurance_due_date: new Date().toISOString().split('T')[0],
    driver_in_charge: '',
    status: 'Tersedia',
  });

  const [noInsurance, setNoInsurance] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchVehicles();
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

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles_v2').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setVehicles(data);
    } else {
      setVehicles([]);
    }
    setLoading(false);
  };

  const handlePreSaveCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleSaveVehicleConfirmed = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    const payload = {
      ...form,
      insurance_due_date: noInsurance ? null : form.insurance_due_date,
    };

    const { data, error } = await supabase.from('vehicles_v2').insert([payload]).select();

    if (error) {
      alert('Gagal menyimpan data kendaraan: ' + error.message);
    } else if (data && data.length > 0) {
      setVehicles([data[0], ...vehicles]);
      
      await supabase.from('vehicle_history_v2').insert([{
        vehicle_id: data[0].id,
        date: form.purchase_date,
        activity_type: 'Pendaftaran / Pembelian Awal',
        description: `Kendaraan ${data[0].plate_number} (${data[0].vehicle_name}) mulai dibeli/didaftarkan.`,
        cost: form.purchase_price
      }]);

      alert('Berhasil mendaftarkan kendaraan baru!');
    }

    setLoading(false);
    setShowAddModal(false);
    setForm({
      plate_number: '',
      vehicle_name: '',
      category: 'Mobil Operasional',
      ownership: 'Inventaris Kantor',
      manufacture_year: 2025,
      chassis_number: '',
      engine_number: '',
      color: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_price: 0,
      tax_due_date: new Date().toISOString().split('T')[0],
      insurance_due_date: new Date().toISOString().split('T')[0],
      driver_in_charge: '',
      status: 'Tersedia',
    });
    setNoInsurance(false);
    fetchVehicles();
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    const { error } = await supabase.from('vehicles_v2').update(currentVehicle).eq('id', currentVehicle.id);
    if (error) {
      alert('Gagal memperbarui kendaraan: ' + error.message);
    } else {
      alert('Berhasil memperbarui data kendaraan!');
      setShowEditModal(false);
      fetchVehicles();
    }
  };

  const openHistoryModal = async (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setShowHistoryModal(true);
    const { data } = await supabase.from('vehicle_history_v2').select('*').eq('vehicle_id', vehicle.id).order('date', { ascending: false });
    if (data) {
      setHistoryList(data);
    } else {
      setHistoryList([]);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    const newHistItem = {
      vehicle_id: currentVehicle.id,
      ...historyForm,
      cost: Number(historyForm.cost)
    };

    const { data, error } = await supabase.from('vehicle_history_v2').insert([newHistItem]).select();
    if (error) {
      alert('Gagal menambahkan riwayat: ' + error.message);
    } else if (data) {
      setHistoryList([data[0], ...historyList]);
      alert('Riwayat aktivitas/servis berhasil ditambahkan!');
    }

    setHistoryForm({
      date: new Date().toISOString().split('T')[0],
      activity_type: 'Servis / Perawatan Rutin',
      description: '',
      cost: 0,
    });
  };

  const totalHistoryCost = historyList.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const exportAllDataToExcel = async () => {
    const { data: allVehicles } = await supabase.from('vehicles_v2').select('*');
    const { data: allHistories } = await supabase.from('vehicle_history_v2').select('*');

    const vehiclesToExport = allVehicles && allVehicles.length > 0 ? allVehicles : vehicles;

    let csvContent = "\uFEFF";
    csvContent += "Plat Nomor;Nama Kendaraan;Kategori;Kepemilikan;Tahun Pembuatan;Warna;No Rangka;No Mesin;Tanggal Beli;Harga Beli (Rp);Jatuh Tempo Pajak;Jatuh Tempo Asuransi;Penanggung Jawab;Status Kendaraan;Tanggal Aktivitas;Jenis Aktivitas;Deskripsi / Keterangan;Biaya Aktivitas (Rp)\n";

    vehiclesToExport.forEach(v => {
      const vHistories = allHistories ? allHistories.filter(h => h.vehicle_id === v.id) : [];

      if (vHistories.length === 0) {
        csvContent += `"${v.plate_number}";"${v.vehicle_name}";"${v.category}";"${v.ownership}";${v.manufacture_year};"${v.color}";"${v.chassis_number}";"${v.engine_number}";"${v.purchase_date || '-'}";${v.purchase_price || 0};"${v.tax_due_date}";"${v.insurance_due_date || 'Tidak Ada'}";"${v.driver_in_charge}";"${v.status}";"-";"-";"-";0\n`;
      } else {
        vHistories.forEach(h => {
          const desc = h.description ? h.description.replace(/"/g, '""') : '';
          csvContent += `"${v.plate_number}";"${v.vehicle_name}";"${v.category}";"${v.ownership}";${v.manufacture_year};"${v.color}";"${v.chassis_number}";"${v.engine_number}";"${v.purchase_date || '-'}";${v.purchase_price || 0};"${v.tax_due_date}";"${v.insurance_due_date || 'Tidak Ada'}";"${v.driver_in_charge}";"${v.status}";"${h.date}";"${h.activity_type}";"${desc}";${h.cost}\n`;
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Semua_Data_Kendaraan_Dan_Riwayat_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSingleVehicleHistory = () => {
    if (!currentVehicle) return;

    let csvContent = "\uFEFF";
    csvContent += `RIWAYAT KENDARAAN: ${currentVehicle.plate_number};${currentVehicle.vehicle_name}\n`;
    csvContent += `Tanggal Beli: ${currentVehicle.purchase_date};Harga Beli: Rp ${currentVehicle.purchase_price || 0};Driver: ${currentVehicle.driver_in_charge};Status: ${currentVehicle.status}\n\n`;
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
    link.setAttribute("download", `Riwayat_${currentVehicle.plate_number.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vehicle_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver_in_charge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.chassis_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
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
              <h1 className="font-extrabold text-white text-base">Manajemen Kendaraan & Pendaftaran</h1>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={exportAllDataToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                title="Unduh semua data kendaraan dan riwayat ke Excel"
              >
                <span>📥 Unduh Semua Excel</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
              >
                <span>+ Pendaftaran Kendaraan</span>
              </button>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <input 
                type="text" 
                placeholder="Cari plat nomor, nama kendaraan, driver, atau no rangka..." 
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
                    <option value="Mobil Operasional">Mobil Operasional</option>
                    <option value="Motor Operasional">Motor Operasional</option>
                    <option value="Kendaraan Direksi">Kendaraan Direksi</option>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer w-full appearance-none truncate pr-6"
                  >
                    <option value="All">Semua Status</option>
                    <option value="Tersedia">Tersedia</option>
                    <option value="Digunakan">Digunakan</option>
                    <option value="Dalam Perawatan">Dalam Perawatan</option>
                    <option value="Nonaktif / Arsip">Nonaktif / Arsip</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white text-[10px] font-bold">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'All') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setStatusFilter('All'); }}
                    className="bg-white/10 hover:bg-white/20 text-slate-200 px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border border-white/10 whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-black text-white text-sm uppercase">Daftar Inventaris Kendaraan</h3>
                <span className="text-xs text-slate-300 font-mono">Menampilkan: {filteredVehicles.length} dari {vehicles.length} Unit</span>
              </div>
              
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Plat Nomor & Kendaraan</th>
                      <th className="py-4 px-6">Kategori / Pemilik</th>
                      <th className="py-4 px-6">No. Rangka / Mesin</th>
                      <th className="py-4 px-6">Tanggal & Harga Beli</th>
                      <th className="py-4 px-6">Jatuh Tempo Pajak</th>
                      <th className="py-4 px-6">Jatuh Tempo Asuransi</th>
                      <th className="py-4 px-6">Penanggung Jawab</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Aksi & History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400 italic">Memuat data kendaraan...</td>
                      </tr>
                    ) : filteredVehicles.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400 italic">Tidak ada data kendaraan yang cocok dengan pencarian atau filter.</td>
                      </tr>
                    ) : (
                      filteredVehicles.map((v) => {
                        const statusColor = 
                          v.status === 'Tersedia' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          v.status === 'Digunakan' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          v.status === 'Dalam Perawatan' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-500/20 text-slate-300 border border-slate-500/30';

                        return (
                          <tr key={v.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6">
                              <span className="font-bold text-white block text-sm">{v.plate_number}</span>
                              <span className="text-[11px] font-medium text-slate-300">{v.vehicle_name} ({v.manufacture_year})</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-white block">{v.category}</span>
                              <span className="text-[10px] text-slate-400">{v.ownership}</span>
                            </td>
                            <td className="py-4 px-6 font-mono text-[11px] text-slate-300">
                              <div>Rangka: {v.chassis_number}</div>
                              <div>Mesin: {v.engine_number}</div>
                            </td>
                            <td className="py-4 px-6 font-mono">
                              <div className="font-bold text-white">{v.purchase_date || '-'}</div>
                              <div className="text-[11px] font-bold text-emerald-400 mt-0.5">{formatRupiah(v.purchase_price || 0)}</div>
                            </td>
                            <td className="py-4 px-6 font-mono font-bold text-white">{v.tax_due_date}</td>
                            <td className="py-4 px-6 font-mono">
                              {v.insurance_due_date ? (
                                <span className="text-white font-bold">{v.insurance_due_date}</span>
                              ) : (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  Tidak Ada Asuransi
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-slate-200 font-semibold">{v.driver_in_charge}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${statusColor}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => { 
                                    setCurrentVehicle(v); 
                                    setEditableFields({
                                      plate_number: false,
                                      vehicle_name: false,
                                      category: false,
                                      status: false,
                                      purchase_date: false,
                                      purchase_price: false,
                                      tax_due_date: false,
                                      driver_in_charge: false,
                                    });
                                    setShowEditModal(true); 
                                  }}
                                  className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md cursor-pointer border border-sky-400/30"
                                  title="Edit Data & Status"
                                >
                                  ✏️ Edit
                                </button>
                                <button 
                                  onClick={() => openHistoryModal(v)}
                                  className="bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer border border-white/10"
                                  title="Riwayat Servis & Catatan Edit"
                                >
                                  📋 History
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
            </div>
          </main>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Formulir Pendaftaran Kendaraan Rinci</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handlePreSaveCheck} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Plat Nomor *</label>
                    <input 
                      type="text" 
                      placeholder="B 1234 XYZ" 
                      value={form.plate_number} 
                      onChange={(e) => setForm({...form, plate_number: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold uppercase outline-none focus:border-sky-400" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama / Merk Kendaraan *</label>
                    <input 
                      type="text" 
                      placeholder="Toyota Avanza / Honda Beat" 
                      value={form.vehicle_name}
                      onChange={(e) => setForm({...form, vehicle_name: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategori</label>
                    <select 
                      value={form.category}
                      onChange={(e) => setForm({...form, category: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      <option value="Mobil Operasional">Mobil Operasional</option>
                      <option value="Motor Operasional">Motor Operasional</option>
                      <option value="Kendaraan Direksi">Kendaraan Direksi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kepemilikan</label>
                    <select 
                      value={form.ownership}
                      onChange={(e) => setForm({...form, ownership: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      <option value="Inventaris Kantor">Inventaris Kantor</option>
                      <option value="Sewa / Leasing">Sewa / Leasing</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Tahun Pembuatan *</label>
                    <input 
                      type="number" 
                      value={form.manufacture_year}
                      onChange={(e) => setForm({...form, manufacture_year: Number(e.target.value)})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold font-mono outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Warna *</label>
                    <input 
                      type="text" 
                      placeholder="Hitam Metallic" 
                      value={form.color}
                      onChange={(e) => setForm({...form, color: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nomor Rangka *</label>
                    <input 
                      type="text" 
                      placeholder="MHK123..." 
                      value={form.chassis_number}
                      onChange={(e) => setForm({...form, chassis_number: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nomor Mesin *</label>
                    <input 
                      type="text" 
                      placeholder="MH1KF21..." 
                      value={form.engine_number}
                      onChange={(e) => setForm({...form, engine_number: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Tanggal Beli / Awal Beli *</label>
                    <input 
                      type="date" 
                      value={form.purchase_date}
                      onChange={(e) => setForm({...form, purchase_date: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs text-white font-bold outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Harga Beli (Rp) *</label>
                    <input 
                      type="text"
                      placeholder="250.000.000"
                      value={formatThousand(form.purchase_price)}
                      onChange={(e) => setForm({...form, purchase_price: parseThousand(e.target.value)})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs text-white font-bold font-mono outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Jatuh Tempo Pajak *</label>
                    <input 
                      type="date" 
                      value={form.tax_due_date}
                      onChange={(e) => setForm({...form, tax_due_date: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs text-white font-bold outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Jatuh Tempo Asuransi</label>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={noInsurance} 
                          onChange={(e) => setNoInsurance(e.target.checked)}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Tidak Ada Asuransi
                      </label>
                    </div>
                    <input 
                      type="date" 
                      disabled={noInsurance}
                      value={form.insurance_due_date || ''}
                      onChange={(e) => setForm({...form, insurance_due_date: e.target.value})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${noInsurance ? 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed' : 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Penanggung Jawab / Driver *</label>
                    <input 
                      type="text" 
                      placeholder="Andi Wijaya (Pool)" 
                      value={form.driver_in_charge}
                      onChange={(e) => setForm({...form, driver_in_charge: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Status Kendaraan</label>
                    <select 
                      value={form.status}
                      onChange={(e) => setForm({...form, status: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-3 py-3 text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Digunakan">Digunakan</option>
                      <option value="Dalam Perawatan">Dalam Perawatan</option>
                      <option value="Nonaktif / Arsip">Nonaktif / Arsip</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">Simpan Kendaraan 🚀</button>
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
                <h3 className="font-black text-white text-base">Konfirmasi Kebenaran Data</h3>
                <p className="text-xs text-slate-300">Pastikan data kendaraan di bawah ini sudah benar dan tidak ada kesalahan sebelum disimpan ke sistem:</p>
              </div>

              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-left text-xs space-y-1.5 font-medium text-slate-300">
                <div><strong className="text-white">Plat Nomor:</strong> {form.plate_number}</div>
                <div><strong className="text-white">Kendaraan:</strong> {form.vehicle_name} ({form.manufacture_year})</div>
                <div><strong className="text-white">No. Rangka:</strong> {form.chassis_number}</div>
                <div><strong className="text-white">No. Mesin:</strong> {form.engine_number}</div>
                <div><strong className="text-white">Tanggal Beli:</strong> {form.purchase_date}</div>
                <div><strong className="text-white">Harga Beli:</strong> {formatRupiah(form.purchase_price)}</div>
                <div><strong className="text-white">Driver:</strong> {form.driver_in_charge}</div>
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
                  onClick={handleSaveVehicleConfirmed} 
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg cursor-pointer flex-1 border border-emerald-400/30"
                >
                  Ya, Data Sudah Benar ✓
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && currentVehicle && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Edit Data Kendaraan: {currentVehicle.plate_number}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Plat Nomor *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.plate_number} 
                          onChange={() => toggleFieldEdit('plate_number')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="text" 
                      disabled={!editableFields.plate_number}
                      value={currentVehicle.plate_number} 
                      onChange={(e) => setCurrentVehicle({...currentVehicle, plate_number: e.target.value})} 
                      className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold uppercase ${editableFields.plate_number ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Nama / Merk Kendaraan *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.vehicle_name} 
                          onChange={() => toggleFieldEdit('vehicle_name')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="text" 
                      disabled={!editableFields.vehicle_name}
                      value={currentVehicle.vehicle_name}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, vehicle_name: e.target.value})}
                      className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold ${editableFields.vehicle_name ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Kategori</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.category} 
                          onChange={() => toggleFieldEdit('category')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <select 
                      disabled={!editableFields.category}
                      value={currentVehicle.category}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, category: e.target.value})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.category ? 'bg-slate-950/60 border-white/15 text-white cursor-pointer outline-none' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                    >
                      <option value="Mobil Operasional">Mobil Operasional</option>
                      <option value="Motor Operasional">Motor Operasional</option>
                      <option value="Kendaraan Direksi">Kendaraan Direksi</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Status Kendaraan</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.status} 
                          onChange={() => toggleFieldEdit('status')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <select 
                      disabled={!editableFields.status}
                      value={currentVehicle.status}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, status: e.target.value})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.status ? 'bg-slate-950/60 border-white/15 text-white cursor-pointer outline-none' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Digunakan">Digunakan</option>
                      <option value="Dalam Perawatan">Dalam Perawatan</option>
                      <option value="Nonaktif / Arsip">Nonaktif / Arsip</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Tanggal Beli / Awal Beli *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.purchase_date} 
                          onChange={() => toggleFieldEdit('purchase_date')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="date" 
                      disabled={!editableFields.purchase_date}
                      value={currentVehicle.purchase_date}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, purchase_date: e.target.value})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.purchase_date ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Harga Beli (Rp) *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.purchase_price} 
                          onChange={() => toggleFieldEdit('purchase_price')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="text" 
                      disabled={!editableFields.purchase_price}
                      value={formatThousand(currentVehicle.purchase_price)}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, purchase_price: parseThousand(e.target.value)})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-mono font-bold ${editableFields.purchase_price ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Jatuh Tempo Pajak *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.tax_due_date} 
                          onChange={() => toggleFieldEdit('tax_due_date')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="date" 
                      disabled={!editableFields.tax_due_date}
                      value={currentVehicle.tax_due_date}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, tax_due_date: e.target.value})}
                      className={`w-full border rounded-2xl px-3 py-3 text-xs font-bold ${editableFields.tax_due_date ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase">Penanggung Jawab / Driver *</label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-sky-400 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editableFields.driver_in_charge} 
                          onChange={() => toggleFieldEdit('driver_in_charge')}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Ubah
                      </label>
                    </div>
                    <input 
                      type="text" 
                      disabled={!editableFields.driver_in_charge}
                      value={currentVehicle.driver_in_charge}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, driver_in_charge: e.target.value})}
                      className={`w-full border rounded-2xl px-4 py-3 text-xs font-bold ${editableFields.driver_in_charge ? 'bg-slate-950/60 border-white/15 text-white outline-none focus:border-sky-400' : 'bg-slate-800 text-slate-500 border-white/10 cursor-not-allowed'}`}
                      required 
                    />
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

        {showHistoryModal && currentVehicle && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-black text-white text-base">Riwayat, Catatan Edit & Servis: {currentVehicle.plate_number}</h3>
                  <p className="text-xs text-slate-300">
                    {currentVehicle.vehicle_name} — Tanggal Beli: {currentVehicle.purchase_date} ({formatRupiah(currentVehicle.purchase_price || 0)}) — Driver: {currentVehicle.driver_in_charge}
                  </p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 backdrop-blur-sm">
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 uppercase block">Total Biaya Tercatat (Termasuk Harga Beli)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{formatRupiah(totalHistoryCost)}</span>
                </div>
                <button 
                  onClick={exportSingleVehicleHistory}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/30"
                  title="Unduh riwayat kendaraan ini ke Excel"
                >
                  <span>📊 Unduh Excel Kendaraan Ini</span>
                </button>
              </div>

              <form onSubmit={handleAddHistory} className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-3">
                <h4 className="font-bold text-xs text-slate-200 uppercase">+ Tambah Catatan Servis / Perawatan / Aktivitas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal</label>
                    <input 
                      type="date" 
                      value={historyForm.date}
                      onChange={(e) => setHistoryForm({...historyForm, date: e.target.value})}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Aktivitas</label>
                    <select 
                      value={historyForm.activity_type}
                      onChange={(e) => setHistoryForm({...historyForm, activity_type: e.target.value})}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer outline-none"
                    >
                      <option value="Servis / Perawatan Rutin">Servis / Perawatan Rutin</option>
                      <option value="Perbaikan Berat">Perbaikan Berat</option>
                      <option value="Perpanjangan Pajak Tahunan">Perpanjangan Pajak Tahunan</option>
                      <option value="Klaim Asuransi">Klaim Asuransi</option>
                      <option value="Pembaruan Data / Edit Kendaraan">Pembaruan Data / Edit Kendaraan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Biaya (Rp)</label>
                    <input 
                      type="text" 
                      value={formatThousand(historyForm.cost)}
                      onChange={(e) => setHistoryForm({...historyForm, cost: parseThousand(e.target.value)})}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan / Deskripsi Pekerjaan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Ganti oli mesin, filter udara, dan tune up"
                    value={historyForm.description}
                    onChange={(e) => setHistoryForm({...historyForm, description: e.target.value})}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white font-medium outline-none"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer border border-sky-400/30">
                    + Simpan Catatan
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-200 uppercase">Daftar Riwayat Aktivitas, Servis & Perubahan ({historyList.length})</h4>
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
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-slate-400 italic">Belum ada riwayat aktivitas atau catatan edit untuk kendaraan ini.</td>
                        </tr>
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
                <button onClick={() => setShowHistoryModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}