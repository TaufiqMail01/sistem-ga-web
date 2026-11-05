'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

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
  description?: string;
};

type ProcurementItem = { 
  id: string; 
  item_name: string; 
  category: string; 
  quantity: string; 
  estimated_cost: string; 
  status: string; 
  requester: string; 
};

type VehicleItem = { 
  id: string; 
  plate_number: string; 
  vehicle_name: string; 
  holder: string; 
  tax_due_date: string; 
  status: string; 
};

type VendorItem = {
  id: string;
  vendor_name: string;
  category: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: string;
};

type MaintenanceItem = {
  id: string;
  item_name: string;
  asset_code: string;
  category: string;
  service_type: string;
  technician_name: string;
  cost: number;
  service_date: string;
  status: 'Pending' | 'Sedang Dikerjakan' | 'Selesai';
  notes?: string;
};

type DistributionItem = {
  id: string;
  asset_code: string;
  item_name: string;
  borrower: string;
  department: string;
  borrow_date: string;
  status: string;
};

export default function ComprehensiveReportsPage() {
  const [activeReport, setActiveReport] = useState<'mutasi' | 'aset' | 'pengadaan' | 'kendaraan' | 'vendor' | 'perawatan' | 'peminjaman'>('mutasi');
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  
  const [mutations, setMutations] = useState<MutationItem[]>([]);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [procurements, setProcurements] = useState<ProcurementItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [allRegisteredAssets, setAllRegisteredAssets] = useState<AssetItem[]>([]);
  
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [formData, setFormData] = useState({ asset_name: '', previous_holder: '', new_holder: '', mutation_date: new Date().toISOString().split('T')[0], reason: '', status: 'Disetujui' });

  const supabase = createClient();

  useEffect(() => {
    fetchActiveReportData();
    fetchRegisteredAssets();
  }, [activeReport]);

  const fetchActiveReportData = async () => {
    setLoading(true);
    if (activeReport === 'mutasi') {
      const { data } = await supabase.from('asset_mutations').select('*').order('created_at', { ascending: false });
      if (data) setMutations(data);
    } else if (activeReport === 'aset') {
      const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (data) setAssets(data);
    } else if (activeReport === 'pengadaan') {
      const { data } = await supabase.from('procurements').select('*').order('created_at', { ascending: false });
      if (data) setProcurements(data);
    } else if (activeReport === 'kendaraan') {
      const { data } = await supabase.from('operational_vehicles').select('*').order('created_at', { ascending: false });
      if (data) setVehicles(data);
    } else if (activeReport === 'vendor') {
      const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
      if (data) setVendors(data);
    } else if (activeReport === 'perawatan') {
      const { data } = await supabase.from('equipment_services').select('*').order('service_date', { ascending: false });
      if (data) setMaintenances(data);
    } else if (activeReport === 'peminjaman') {
      const { data } = await supabase.from('distributions').select('*').order('borrow_date', { ascending: false });
      if (data) setDistributions(data);
    }
    setLoading(false);
  };

  const fetchRegisteredAssets = async () => {
    const { data } = await supabase.from('assets').select('*').order('name', { ascending: true });
    if (data) setAllRegisteredAssets(data);
  };

  const handleAssetDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const found = allRegisteredAssets.find(a => a.asset_code === selectedCode);
    if (found) {
      setFormData(prev => ({
        ...prev,
        asset_name: `${found.name} (${found.asset_code})`,
        previous_holder: found.holder || '-'
      }));
    } else {
      setFormData(prev => ({ ...prev, asset_name: '', previous_holder: '' }));
    }
  };

  const handleMutationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mutationCode = `MUT-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from('asset_mutations').insert([{ ...formData, mutation_code: mutationCode }]);
    
    if (error) alert('Gagal mencatat mutasi: ' + error.message);
    else {
      alert(`Berhasil mencatat mutasi! (Kode: ${mutationCode})`);
      setShowMutationModal(false);
      fetchActiveReportData();
    }
  };

  const handleApproveMutation = async (id: string) => {
    const { error } = await supabase
      .from('asset_mutations')
      .update({ status: 'Disetujui' })
      .eq('id', id);

    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
    } else {
      alert('Mutasi berhasil disetujui!');
      fetchActiveReportData();
    }
  };

  const formatRupiah = (val: string | number | null | undefined) => {
    if (!val) return 'Rp 0';
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    return isNaN(num) ? String(val) : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const exportToExcel = () => {
    let rows: string[][] = [];
    let filename = `laporan_lengkap_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'mutasi') {
      rows.push(["Kode Mutasi", "Nama Aset", "Pemegang Lama", "Pemegang Baru", "Tanggal Mutasi", "Alasan / Keterangan", "Status"]);
      mutations.forEach(m => rows.push([m.mutation_code, m.asset_name, m.previous_holder, m.new_holder, m.mutation_date, m.reason || '-', m.status]));
    } else if (activeReport === 'aset') {
      rows.push([
        "Kode Aset", "Nama Aset", "Kategori", "Merk", "Nomor Seri (S/N)", 
        "Spesifikasi Detail", "Tanggal Perolehan", "Harga Perolehan", 
        "Supplier / Vendor", "Lokasi Penempatan", "Penanggung Jawab", "Kondisi", "Keterangan"
      ]);
      assets.forEach(a => rows.push([
        a.asset_code, a.name, a.category, a.brand || '-', a.serial_number || '-', 
        a.specification || '-', a.purchase_date || '-', a.purchase_cost, 
        a.supplier || '-', a.location || '-', a.holder, a.condition, a.description || '-'
      ]));
    } else if (activeReport === 'pengadaan') {
      rows.push(["Item Pengadaan", "Kategori", "Jumlah", "Estimasi Biaya", "Pemohon", "Status"]);
      procurements.forEach(p => rows.push([p.item_name, p.category, p.quantity, p.estimated_cost, p.requester, p.status]));
    } else if (activeReport === 'kendaraan') {
      rows.push(["Plat Nomor", "Nama Kendaraan", "Penanggung Jawab", "Jatuh Tempo Pajak", "Status"]);
      vehicles.forEach(v => rows.push([v.plate_number, v.vehicle_name, v.holder, v.tax_due_date, v.status]));
    } else if (activeReport === 'vendor') {
      rows.push(["Nama Vendor / PT", "Kategori Jasa", "Kontak PIC", "Nomor Telepon", "Email Vendor", "Alamat Kantor", "Status Kerjasama"]);
      vendors.forEach(v => rows.push([v.vendor_name, v.category, v.contact_person, v.phone, v.email, v.address, v.status]));
    } else if (activeReport === 'perawatan') {
      rows.push(["Kode Aset", "Nama Barang", "Kategori", "Jenis Servis", "Teknisi / Vendor", "Biaya", "Tanggal", "Status", "Catatan"]);
      maintenances.forEach(m => rows.push([m.asset_code, m.item_name, m.category, m.service_type, m.technician_name, String(m.cost), m.service_date, m.status, m.notes || '-']));
    } else if (activeReport === 'peminjaman') {
      rows.push(["Kode Aset", "Nama Aset", "Peminjam", "Divisi / Unit", "Tanggal Pinjam", "Status"]);
      distributions.forEach(d => rows.push([d.asset_code, d.item_name, d.borrower, d.department, d.borrow_date, d.status]));
    }

    const csvContent = rows.map(row => 
      row.map(e => `"${String(e || '').replace(/"/g, '""')}"`).join(";")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <h1 className="font-extrabold text-white text-base">📊 Pusat Laporan Manajerial</h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={exportToExcel} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <span>📥 Download Excel (Lengkap)</span>
              </button>
              {activeReport === 'mutasi' && (
                <button 
                  onClick={() => setShowMutationModal(true)} 
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
                >
                  <span>+ Catat Mutasi Baru</span>
                </button>
              )}
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            <div className="bg-slate-900/70 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-xl flex flex-wrap gap-2">
              {[
                { id: 'mutasi', label: 'Laporan Mutasi Aset', icon: '🔄' },
                { id: 'aset', label: 'Buku Inventaris Utama', icon: '📦' },
                { id: 'pengadaan', label: 'Rekap Pengadaan ATK', icon: '🛒' },
                { id: 'kendaraan', label: 'Status Kendaraan', icon: '🚗' },
                { id: 'vendor', label: 'Vendor & Rekanan', icon: '🤝' },
                { id: 'perawatan', label: 'Laporan Perawatan', icon: '🛠️' },
                { id: 'peminjaman', label: 'Laporan Peminjaman', icon: '📋' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveReport(tab.id as any)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${activeReport === tab.id ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 shadow-lg' : 'bg-slate-950/40 text-slate-400 hover:bg-white/5 border-white/10'}`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-white text-sm uppercase">
                    {activeReport === 'mutasi' ? 'Histori Serah Terima & Mutasi' : 
                     activeReport === 'aset' ? 'Laporan Keseluruhan Aset Kantor (Komprehensif)' : 
                     activeReport === 'pengadaan' ? 'Laporan Permintaan & Pengadaan Barang' : 
                     activeReport === 'kendaraan' ? 'Laporan Status Kendaraan Operasional' :
                     activeReport === 'vendor' ? 'Direktori Vendor & Rekanan Perusahaan' :
                     activeReport === 'perawatan' ? 'Laporan Perawatan & Servis Aset' :
                     'Laporan Distribusi & Peminjaman Aset'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">Seluruh kolom terekam secara lengkap untuk keperluan audit dan pembukuan.</p>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      {activeReport === 'mutasi' && (
                        <><th className="py-4 px-6">Kode Mutasi</th><th className="py-4 px-6">Nama Aset</th><th className="py-4 px-6">Pemegang Lama</th><th className="py-4 px-6">Pemegang Baru</th><th className="py-4 px-6">Tanggal</th><th className="py-4 px-6">Alasan</th><th className="py-4 px-6">Status</th><th className="py-4 px-6 text-center">Aksi</th></>
                      )}
                      {activeReport === 'aset' && (
                        <>
                          <th className="py-4 px-6">Kode Aset</th>
                          <th className="py-4 px-6">Nama & Kategori</th>
                          <th className="py-4 px-6">Merk / S/N</th>
                          <th className="py-4 px-6">Spesifikasi Detail</th>
                          <th className="py-4 px-6">Tgl / Harga Perolehan</th>
                          <th className="py-4 px-6">Supplier / Lokasi</th>
                          <th className="py-4 px-6">Kondisi / User</th>
                        </>
                      )}
                      {activeReport === 'pengadaan' && (
                        <><th className="py-4 px-6">Item Pengadaan</th><th className="py-4 px-6">Kategori</th><th className="py-4 px-6">Jumlah</th><th className="py-4 px-6">Est. Biaya</th><th className="py-4 px-6">Pemohon</th><th className="py-4 px-6">Status</th></>
                      )}
                      {activeReport === 'kendaraan' && (
                        <><th className="py-4 px-6">Plat Nomor</th><th className="py-4 px-6">Kendaraan</th><th className="py-4 px-6">Penanggung Jawab</th><th className="py-4 px-6">Jatuh Tempo Pajak</th><th className="py-4 px-6">Status</th></>
                      )}
                      {activeReport === 'vendor' && (
                        <><th className="py-4 px-6">Nama Vendor / PT</th><th className="py-4 px-6">Kategori Jasa</th><th className="py-4 px-6">Kontak PIC</th><th className="py-4 px-6">Telepon / Email</th><th className="py-4 px-6">Alamat Kantor</th><th className="py-4 px-6">Status Kerjasama</th></>
                      )}
                      {activeReport === 'perawatan' && (
                        <><th className="py-4 px-6">Kode & Aset</th><th className="py-4 px-6">Kategori</th><th className="py-4 px-6">Jenis Servis</th><th className="py-4 px-6">Teknisi / Vendor</th><th className="py-4 px-6">Biaya</th><th className="py-4 px-6">Tanggal</th><th className="py-4 px-6">Status</th></>
                      )}
                      {activeReport === 'peminjaman' && (
                        <><th className="py-4 px-6">Kode Aset</th><th className="py-4 px-6">Nama Aset</th><th className="py-4 px-6">Peminjam</th><th className="py-4 px-6">Divisi / Unit</th><th className="py-4 px-6">Tanggal Pinjam</th><th className="py-4 px-6">Status</th></>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-10 text-slate-400">Memuat laporan lengkap...</td></tr>
                    ) : (
                      <>
                        {activeReport === 'mutasi' && mutations.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-mono text-sky-400 font-bold">{item.mutation_code}</td>
                            <td className="py-4 px-6 font-bold text-white">{item.asset_name}</td>
                            <td className="py-4 px-6 text-slate-300">{item.previous_holder}</td>
                            <td className="py-4 px-6 text-white font-bold">→ {item.new_holder}</td>
                            <td className="py-4 px-6 text-slate-300">{item.mutation_date}</td>
                            <td className="py-4 px-6 text-slate-300">{item.reason || '-'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${item.status === 'Disetujui' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {item.status === 'Menunggu Persetujuan' ? (
                                <button 
                                  onClick={() => handleApproveMutation(item.id)} 
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md cursor-pointer border border-emerald-400/30"
                                >
                                  ✓ Setujui
                                </button>
                              ) : (
                                <span className="text-slate-500 font-medium italic text-[11px]">Selesai</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {activeReport === 'aset' && assets.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition align-top">
                            <td className="py-4 px-6 font-mono text-sky-400 font-bold">{item.asset_code}</td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-white block">{item.name}</span>
                              <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded-md inline-block mt-1">{item.category}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-slate-200 block">{item.brand || '-'}</span>
                              <span className="text-[10px] font-mono text-slate-400">S/N: {item.serial_number || '-'}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-300 max-w-xs truncate" title={item.specification}>
                              {item.specification || '-'}
                            </td>
                            <td className="py-4 px-6 font-mono">
                              <span className="text-emerald-400 font-bold block">{formatRupiah(item.purchase_cost)}</span>
                              <span className="text-[10px] text-slate-400">Tgl: {item.purchase_date || '-'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-slate-200 block">Vendor: {item.supplier || '-'}</span>
                              <span className="text-[10px] text-slate-400">Lokasi: {item.location || '-'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-white/10 inline-block mb-1">{item.condition}</span>
                              <span className="text-slate-300 block text-[11px]">User: {item.holder}</span>
                            </td>
                          </tr>
                        ))}

                        {activeReport === 'pengadaan' && procurements.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-bold text-white">{item.item_name}</td>
                            <td className="py-4 px-6 text-slate-300">{item.category}</td>
                            <td className="py-4 px-6 font-semibold text-slate-200">{item.quantity}</td>
                            <td className="py-4 px-6 font-mono text-emerald-400 font-bold">{formatRupiah(item.estimated_cost)}</td>
                            <td className="py-4 px-6 text-slate-300">{item.requester}</td>
                            <td className="py-4 px-6"><span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-block tracking-wider">{item.status}</span></td>
                          </tr>
                        ))}

                        {activeReport === 'kendaraan' && vehicles.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-mono text-sky-400 font-bold">{item.plate_number}</td>
                            <td className="py-4 px-6 font-bold text-white">{item.vehicle_name}</td>
                            <td className="py-4 px-6 text-slate-300">{item.holder}</td>
                            <td className="py-4 px-6 font-mono text-rose-400 font-semibold">{item.tax_due_date}</td>
                            <td className="py-4 px-6"><span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-white/10 inline-block tracking-wider">{item.status}</span></td>
                          </tr>
                        ))}

                        {activeReport === 'vendor' && vendors.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-bold text-white">{item.vendor_name}</td>
                            <td className="py-4 px-6 text-slate-300 font-semibold">{item.category}</td>
                            <td className="py-4 px-6 text-slate-200">{item.contact_person}</td>
                            <td className="py-4 px-6 text-slate-300">
                              <span className="block font-mono text-sky-400">{item.phone}</span>
                              <span className="text-[11px]">{item.email}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-300 max-w-xs truncate" title={item.address}>{item.address}</td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${item.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {activeReport === 'perawatan' && maintenances.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-mono text-sky-400 font-bold">{item.asset_code} <span className="block text-white font-normal">{item.item_name}</span></td>
                            <td className="py-4 px-6 text-slate-300">{item.category}</td>
                            <td className="py-4 px-6 font-semibold text-slate-200">{item.service_type} {item.notes && <span className="block text-[11px] text-slate-400 font-normal">{item.notes}</span>}</td>
                            <td className="py-4 px-6 text-slate-300">{item.technician_name}</td>
                            <td className="py-4 px-6 font-mono font-bold text-emerald-400">{formatRupiah(item.cost)}</td>
                            <td className="py-4 px-6 font-mono text-slate-300">{item.service_date}</td>
                            <td className="py-4 px-6"><span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${item.status === 'Selesai' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}`}>{item.status}</span></td>
                          </tr>
                        ))}

                        {activeReport === 'peminjaman' && distributions.map((item) => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6 font-mono text-sky-400 font-bold">{item.asset_code}</td>
                            <td className="py-4 px-6 font-bold text-white">{item.item_name}</td>
                            <td className="py-4 px-6 text-slate-200 font-semibold">{item.borrower}</td>
                            <td className="py-4 px-6 text-slate-300">{item.department}</td>
                            <td className="py-4 px-6 font-mono text-slate-300">{item.borrow_date}</td>
                            <td className="py-4 px-6"><span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block tracking-wider">{item.status}</span></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {showMutationModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Form Berita Acara Serah Terima (Mutasi)</h3>
                <button onClick={() => setShowMutationModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleMutationSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Pilih / Cari Aset yang Dimutasi <span className="text-rose-400">*</span></label>
                  <select 
                    required 
                    onChange={handleAssetDropdownChange}
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none"
                  >
                    <option value="" className="bg-slate-900 text-white">-- Pilih dari Daftar Aset Terdaftar --</option>
                    {allRegisteredAssets.map((asset) => (
                      <option key={asset.id} value={asset.asset_code} className="bg-slate-900 text-white">
                        {asset.name} ({asset.asset_code}) - Pemegang: {asset.holder || '-'}
                      </option>
                    ))}
                  </select>
                  {formData.asset_name && (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">Terpilih: {formData.asset_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Pemegang Lama (Dari) <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Otomatis terisi dari data aset" value={formData.previous_holder} onChange={(e) => setFormData({ ...formData, previous_holder: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Pemegang Baru (Ke) <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Contoh: Siti (Finance)" value={formData.new_holder} onChange={(e) => setFormData({ ...formData, new_holder: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Tanggal Mutasi <span className="text-rose-400">*</span></label>
                    <input type="date" required value={formData.mutation_date} onChange={(e) => setFormData({ ...formData, mutation_date: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Status Serah Terima</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none">
                      <option value="Disetujui" className="bg-slate-900 text-white">Selesai (Disetujui)</option>
                      <option value="Menunggu Persetujuan" className="bg-slate-900 text-white">Menunggu Persetujuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alasan / Keterangan Mutasi <span className="text-rose-400">*</span></label>
                  <textarea rows={2} required placeholder="Contoh: Karyawan resign, aset dialihkan ke staf baru..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-medium outline-none focus:border-sky-400" />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowMutationModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">Rekam Mutasi 🚀</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}