'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { FileText, Download, Plus, Search, Truck, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';

type ShippingRecord = {
  id: string;
  resi_code: string;
  shipping_type: 'Dalam Kota' | 'Luar Kota';
  sender_name: string;
  sender_dept: string;
  recipient_name: string;
  recipient_address: string;
  city: string;
  courier: string;
  receipt_number?: string;
  status: string;
  date: string;
  notes?: string;
};

export default function DocumentShippingPage() {
  const [activeTab, setActiveTab] = useState<'dalam-kota' | 'luar-kota'>('dalam-kota');
  const [shippingList, setShippingList] = useState<ShippingRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // FORM TERPISAH BERDASARKAN TAB AKTIF
  const [modalType, setModalType] = useState<'Dalam Kota' | 'Luar Kota'>('Dalam Kota');

  const [formDalamKota, setFormDalamKota] = useState({
    sender_name: '',
    sender_dept: 'HR & General Affairs',
    recipient_name: '',
    recipient_address: '',
    courier: 'Kurir Internal Kantor (Motor/Mobil)',
    notes: '',
  });

  const [formLuarKota, setFormLuarKota] = useState({
    sender_name: '',
    sender_dept: 'HR & General Affairs',
    recipient_name: '',
    recipient_address: '',
    city: '',
    courier: 'JNE / J&T / TIKI / SiCepat',
    receipt_number: '',
    notes: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchShippings();
  }, []);

  const fetchShippings = async () => {
    const { data } = await supabase.from('document_shipping_v2').select('*').order('created_at', { ascending: false });
    if (data) setShippingList(data);
  };

  const handleSaveDalamKota = async (e: React.FormEvent) => {
    e.preventDefault();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const resiCode = `SHP-DOM-${randomNum}`;

    const newRecord = {
      resi_code: resiCode,
      shipping_type: 'Dalam Kota' as const,
      sender_name: formDalamKota.sender_name,
      sender_dept: formDalamKota.sender_dept,
      recipient_name: formDalamKota.recipient_name,
      recipient_address: formDalamKota.recipient_address,
      city: 'Jakarta / Lokal',
      courier: formDalamKota.courier,
      receipt_number: '-',
      status: 'Terkirim / Dalam Proses',
      date: new Date().toISOString().split('T')[0],
      notes: formDalamKota.notes || '-'
    };

    const { error } = await supabase.from('document_shipping_v2').insert([newRecord]);
    if (error) {
      alert('Gagal menyimpan pengiriman: ' + error.message);
    } else {
      alert(`Berhasil mencatat pengiriman Dalam Kota dengan Resi: ${resiCode}!`);
      setShowAddModal(false);
      setFormDalamKota({
        sender_name: '',
        sender_dept: 'HR & General Affairs',
        recipient_name: '',
        recipient_address: '',
        courier: 'Kurir Internal Kantor (Motor/Mobil)',
        notes: '',
      });
      fetchShippings();
    }
  };

  const handleSaveLuarKota = async (e: React.FormEvent) => {
    e.preventDefault();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const resiCode = `SHP-EXT-${randomNum}`;

    const newRecord = {
      resi_code: resiCode,
      shipping_type: 'Luar Kota' as const,
      sender_name: formLuarKota.sender_name,
      sender_dept: formLuarKota.sender_dept,
      recipient_name: formLuarKota.recipient_name,
      recipient_address: formLuarKota.recipient_address,
      city: formLuarKota.city,
      courier: formLuarKota.courier,
      receipt_number: formLuarKota.receipt_number || '-',
      status: 'Terkirim / Dalam Proses',
      date: new Date().toISOString().split('T')[0],
      notes: formLuarKota.notes || '-'
    };

    const { error } = await supabase.from('document_shipping_v2').insert([newRecord]);
    if (error) {
      alert('Gagal menyimpan pengiriman: ' + error.message);
    } else {
      alert(`Berhasil mencatat pengiriman Luar Kota dengan Resi: ${resiCode}!`);
      setShowAddModal(false);
      setFormLuarKota({
        sender_name: '',
        sender_dept: 'HR & General Affairs',
        recipient_name: '',
        recipient_address: '',
        city: '',
        courier: 'JNE / J&T / TIKI / SiCepat',
        receipt_number: '',
        notes: '',
      });
      fetchShippings();
    }
  };

  const downloadExcelReport = (type: 'Dalam Kota' | 'Luar Kota') => {
    const filtered = shippingList.filter(s => s.shipping_type === type);
    const exportData = filtered.map((item, index) => ({
      No: index + 1,
      'Kode / Resi': item.resi_code,
      Tanggal: item.date,
      'Jenis Kirim': item.shipping_type,
      'Pengirim': item.sender_name,
      'Departemen Pengirim': item.sender_dept,
      'Penerima': item.recipient_name,
      'Alamat Tujuan': item.recipient_address,
      'Kota Tujuan': item.city,
      'Kurir / Ekspedisi': item.courier,
      'No Resi Ekspedisi': item.receipt_number,
      Status: item.status,
      Catatan: item.notes
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Pengiriman ${type}`);
    XLSX.writeFile(workbook, `Laporan_Pengiriman_${type.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredList = shippingList.filter(item => {
    const matchType = activeTab === 'dalam-kota' ? item.shipping_type === 'Dalam Kota' : item.shipping_type === 'Luar Kota';
    const matchSearch = item.resi_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.recipient_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.sender_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const countDalamKota = shippingList.filter(s => s.shipping_type === 'Dalam Kota').length;
  const countLuarKota = shippingList.filter(s => s.shipping_type === 'Luar Kota').length;

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
              <h1 className="font-extrabold text-white text-lg">Form Pengiriman Dokumen Kantor</h1>
            </div>

            <button 
              onClick={() => {
                setModalType(activeTab === 'dalam-kota' ? 'Dalam Kota' : 'Luar Kota');
                setShowAddModal(true);
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2 border border-sky-400/30 backdrop-blur-md"
            >
              <Plus className="w-4 h-4" /> Catat Pengiriman Baru
            </button>
          </header>

          <main className="max-w-7xl w-full mx-auto px-6 md:px-12 pt-10 space-y-8 pb-20">
            
            {/* TAB PEMISAH DALAM KOTA & LUAR KOTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/70 backdrop-blur-xl p-2 rounded-3xl border border-white/10 w-full shadow-2xl">
              <button 
                onClick={() => setActiveTab('dalam-kota')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'dalam-kota' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Truck className="w-4 h-4" /> Pengiriman Dalam Kota ({countDalamKota})
              </button>
              <button 
                onClick={() => setActiveTab('luar-kota')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'luar-kota' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <MapPin className="w-4 h-4" /> Pengiriman Luar Kota ({countLuarKota})
              </button>
            </div>

            {/* KOTAK KONTROL PENCARIAN & DOWNLOAD EXCEL */}
            <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari resi, penerima, atau pengirim..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/15 rounded-2xl pl-12 pr-5 py-3.5 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner"
                />
              </div>

              <button
                onClick={() => downloadExcelReport(activeTab === 'dalam-kota' ? 'Dalam Kota' : 'Luar Kota')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer w-full md:w-auto justify-center border border-emerald-400/30 backdrop-blur-md"
              >
                <Download className="w-4 h-4" /> Download Excel {activeTab === 'dalam-kota' ? 'Dalam Kota' : 'Luar Kota'} 📥
              </button>
            </div>

            {/* TABEL DATA PENGIRIMAN */}
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-950/50 border-b border-white/10 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">
                  Riwayat Pengiriman: <strong className="text-sky-400">{activeTab === 'dalam-kota' ? 'Dalam Kota' : 'Luar Kota'} ({filteredList.length} dokumen)</strong>
                </span>
                <span className="text-slate-400 italic">Tabel dan catatan terpisah secara profesional</span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                      <th className="py-5 px-8">Kode / Resi</th>
                      <th className="py-5 px-8">Pengirim & Dept</th>
                      <th className="py-5 px-8">Penerima & Alamat Tujuan</th>
                      <th className="py-5 px-8">{activeTab === 'dalam-kota' ? 'Kurir Internal' : 'Ekspedisi & Resi'}</th>
                      <th className="py-5 px-8">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400 italic">
                          Belum ada riwayat pengiriman {activeTab === 'dalam-kota' ? 'dalam kota' : 'luar kota'} yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition">
                          <td className="py-5 px-8">
                            <span className="font-mono font-black text-sky-400 block">{item.resi_code}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{item.date}</span>
                          </td>
                          <td className="py-5 px-8">
                            <span className="font-bold text-white block">{item.sender_name}</span>
                            <span className="text-[11px] text-slate-400">{item.sender_dept}</span>
                          </td>
                          <td className="py-5 px-8">
                            <span className="font-bold text-white block">{item.recipient_name}</span>
                            <span className="text-[11px] text-slate-300 block mt-0.5">{item.recipient_address} {item.city !== 'Jakarta / Lokal' && `(${item.city})`}</span>
                          </td>
                          <td className="py-5 px-8">
                            <span className="font-bold text-slate-200 block">{item.courier}</span>
                            {item.receipt_number && item.receipt_number !== '-' && (
                              <span className="font-mono text-[10px] text-emerald-400 block mt-0.5">Resi: {item.receipt_number}</span>
                            )}
                          </td>
                          <td className="py-5 px-8">
                            <span className="px-3.5 py-1.5 bg-sky-500/20 text-sky-300 rounded-full text-[10px] font-black uppercase inline-block border border-sky-500/30">
                              {item.status}
                            </span>
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

        {/* MODAL CATAT PENGIRIMAN BARU DENGAN FORM TERPISAH */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-5">
                <div>
                  <h3 className="font-black text-white text-base">Catat Pengiriman Dokumen Baru</h3>
                  <span className="text-[11px] text-sky-400 font-bold">Pilih formulir sesuai tujuan pengiriman</span>
                </div>
                <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-white/15 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setModalType('Dalam Kota')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${modalType === 'Dalam Kota' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    Dalam Kota
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('Luar Kota')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${modalType === 'Luar Kota' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-300 hover:bg-white/5'}`}
                  >
                    Luar Kota
                  </button>
                </div>
              </div>

              {/* FORM DALAM KOTA */}
              {modalType === 'Dalam Kota' ? (
                <form onSubmit={handleSaveDalamKota} className="space-y-4">
                  <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-500/30 text-xs text-sky-200 font-medium backdrop-blur-md">
                    🛵 <strong>Form Khusus Pengiriman Dalam Kota:</strong> Menggunakan kurir internal kantor, go-send, atau pengantaran lokal wilayah Jabodetabek.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Pengirim *</label>
                      <input type="text" placeholder="Cth: Budi Santoso" value={formDalamKota.sender_name} onChange={(e) => setFormDalamKota({...formDalamKota, sender_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Departemen Pengirim *</label>
                      <select value={formDalamKota.sender_dept} onChange={(e) => setFormDalamKota({...formDalamKota, sender_dept: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-sky-400 shadow-inner cursor-pointer">
                        <option value="HR & General Affairs" className="bg-slate-900 text-white">HR & General Affairs</option>
                        <option value="Tim IT Support" className="bg-slate-900 text-white">Tim IT Support</option>
                        <option value="Finance & Accounting" className="bg-slate-900 text-white">Finance & Accounting</option>
                        <option value="Operational & Marketing" className="bg-slate-900 text-white">Operational & Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Penerima / Instansi Tujuan *</label>
                    <input type="text" placeholder="Cth: PT Mitra Sejahtera / Ibu Siska" value={formDalamKota.recipient_name} onChange={(e) => setFormDalamKota({...formDalamKota, recipient_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alamat Lengkap Tujuan Dalam Kota *</label>
                    <textarea rows={2} placeholder="Jl. Sudirman No. 10, Jakarta Selatan..." value={formDalamKota.recipient_address} onChange={(e) => setFormDalamKota({...formDalamKota, recipient_address: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kurir Pengantar *</label>
                    <input type="text" placeholder="Cth: Kurir Internal Kantor / GoSend Instant" value={formDalamKota.courier} onChange={(e) => setFormDalamKota({...formDalamKota, courier: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Catatan Dokumen Dalam Kota</label>
                    <textarea rows={2} placeholder="Keterangan dokumen..." value={formDalamKota.notes} onChange={(e) => setFormDalamKota({...formDalamKota, notes: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                    <button type="submit" className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 cursor-pointer shadow-lg border border-sky-400/30">Simpan Pengiriman Dalam Kota</button>
                  </div>
                </form>
              ) : (
                /* FORM LUAR KOTA */
                <form onSubmit={handleSaveLuarKota} className="space-y-4">
                  <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 text-xs text-amber-200 font-medium backdrop-blur-md">
                    ✈️ <strong>Form Khusus Pengiriman Luar Kota:</strong> Menggunakan jasa ekspedisi pihak ketiga (JNE, J&T, TIKI, SiCepat) lengkap dengan nomor resi pengiriman.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Pengirim *</label>
                      <input type="text" placeholder="Cth: Budi Santoso" value={formLuarKota.sender_name} onChange={(e) => setFormLuarKota({...formLuarKota, sender_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Departemen Pengirim *</label>
                      <select value={formLuarKota.sender_dept} onChange={(e) => setFormLuarKota({...formLuarKota, sender_dept: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-sky-400 shadow-inner cursor-pointer">
                        <option value="HR & General Affairs" className="bg-slate-900 text-white">HR & General Affairs</option>
                        <option value="Tim IT Support" className="bg-slate-900 text-white">Tim IT Support</option>
                        <option value="Finance & Accounting" className="bg-slate-900 text-white">Finance & Accounting</option>
                        <option value="Operational & Marketing" className="bg-slate-900 text-white">Operational & Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Penerima / Perusahaan *</label>
                      <input type="text" placeholder="Cth: PT Sinar Abadi / Bpk. Rahmat" value={formLuarKota.recipient_name} onChange={(e) => setFormLuarKota({...formLuarKota, recipient_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kota Tujuan *</label>
                      <input type="text" placeholder="Cth: Surabaya / Bandung / Medan" value={formLuarKota.city} onChange={(e) => setFormLuarKota({...formLuarKota, city: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alamat Lengkap Tujuan Luar Kota *</label>
                    <textarea rows={2} placeholder="Jl. Raya Diponegoro No. 45, Surabaya..." value={formLuarKota.recipient_address} onChange={(e) => setFormLuarKota({...formLuarKota, recipient_address: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Ekspedisi / Jasa Kirim *</label>
                      <input type="text" placeholder="Cth: JNE Express / J&T / TIKI" value={formLuarKota.courier} onChange={(e) => setFormLuarKota({...formLuarKota, courier: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nomor Resi Ekspedisi *</label>
                      <input type="text" placeholder="Cth: JP8839201928" value={formLuarKota.receipt_number} onChange={(e) => setFormLuarKota({...formLuarKota, receipt_number: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Catatan Dokumen Luar Kota</label>
                    <textarea rows={2} placeholder="Keterangan paket dokumen..." value={formLuarKota.notes} onChange={(e) => setFormLuarKota({...formLuarKota, notes: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl p-4 text-xs text-white placeholder-slate-400 focus:outline-sky-400 shadow-inner" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                    <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-3 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                    <button type="submit" className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 cursor-pointer shadow-lg border border-sky-400/30">Simpan Pengiriman Luar Kota</button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}