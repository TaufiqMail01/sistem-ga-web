'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

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

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendor_name: '',
    category: 'Supplier IT & Elektronik',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'Aktif',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vendors').select('*').order('created_at', { ascending: false });
    if (!error && data) setVendors(data);
    setLoading(false);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      vendor_name: '',
      category: 'Supplier IT & Elektronik',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      status: 'Aktif',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: VendorItem) => {
    setEditingId(item.id);
    setFormData({
      vendor_name: item.vendor_name,
      category: item.category,
      contact_person: item.contact_person,
      phone: item.phone,
      email: item.email,
      address: item.address,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Update data vendor yang sudah ada
      const { error } = await supabase.from('vendors').update(formData).eq('id', editingId);
      if (error) {
        alert('Gagal memperbarui vendor: ' + error.message);
      } else {
        alert('Berhasil memperbarui data rekanan / vendor!');
        setShowModal(false);
        setEditingId(null);
        fetchVendors();
      }
    } else {
      // Tambah vendor baru
      const { error } = await supabase.from('vendors').insert([formData]);
      if (error) {
        alert('Gagal menyimpan vendor: ' + error.message);
      } else {
        alert('Berhasil mendaftarkan vendor/rekanan baru!');
        setShowModal(false);
        fetchVendors();
      }
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
              <h1 className="font-extrabold text-white text-base">Direktori Vendor & Rekanan</h1>
            </div>
            <button 
              onClick={handleOpenAddModal} 
              className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg flex items-center gap-2 cursor-pointer border border-sky-400/30"
            >
              <span>+ Tambah Rekanan Baru</span>
            </button>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-white text-sm uppercase">Daftar Vendor & Rekanan</h3>
                  <p className="text-xs text-slate-300">Kelola data penyedia barang, bengkel servis, dan ubah status kerjasama jika sudah tidak aktif.</p>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Nama Perusahaan / Vendor</th>
                      <th className="py-4 px-6">Kategori Jasa</th>
                      <th className="py-4 px-6">Kontak PIC</th>
                      <th className="py-4 px-6">Email / Telepon</th>
                      <th className="py-4 px-6">Status Kerjasama</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">Memuat data vendor...</td></tr>
                    ) : vendors.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400">Belum ada data rekanan terdaftar.</td></tr>
                    ) : (
                      vendors.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6 font-bold text-white">{item.vendor_name}</td>
                          <td className="py-4 px-6 text-slate-300 font-semibold">{item.category}</td>
                          <td className="py-4 px-6 text-slate-200">{item.contact_person}</td>
                          <td className="py-4 px-6 text-slate-300">
                            <span className="block">{item.email}</span>
                            <span className="text-[11px] font-mono text-sky-400">{item.phone}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${item.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={() => handleOpenEditModal(item)}
                              className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-md cursor-pointer border border-sky-400/30"
                            >
                              ✏️ Ubah / Status
                            </button>
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

        {/* MODAL TAMBAH / UPDATE VENDOR */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">
                  {editingId ? 'Ubah Data / Status Rekanan' : 'Formulir Registrasi Rekanan'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Vendor / PT <span className="text-rose-400">*</span></label>
                  <input type="text" required placeholder="Contoh: PT. Karya Teknologi Mandiri" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategori Jasa / Barang</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none">
                      <option value="Supplier IT & Elektronik" className="bg-slate-900 text-white">Supplier IT & Elektronik</option>
                      <option value="Supplier ATK & Kantor" className="bg-slate-900 text-white">Supplier ATK & Kantor</option>
                      <option value="Bengkel Kendaraan" className="bg-slate-900 text-white">Bengkel Kendaraan</option>
                      <option value="Jasa Maintenance Gedung" className="bg-slate-900 text-white">Jasa Maintenance Gedung</option>
                      <option value="Agensi / Jasa Lainnya" className="bg-slate-900 text-white">Agensi / Jasa Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Kontak (PIC) <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Contoh: Bapak Anton" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nomor Telepon / WA <span className="text-rose-400">*</span></label>
                    <input type="text" required placeholder="Contoh: 08123456789" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono font-bold outline-none focus:border-sky-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Email Vendor <span className="text-rose-400">*</span></label>
                    <input type="email" required placeholder="info@vendor.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-sky-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Alamat Lengkap Kantor</label>
                  <textarea rows={2} required placeholder="Alamat lengkap bengkel / kantor operasional..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-medium outline-none focus:border-sky-400" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Status Kerjasama</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer outline-none">
                    <option value="Aktif" className="bg-slate-900 text-white">Aktif (Sedang Berjalan)</option>
                    <option value="Inaktif / Putus Kontrak" className="bg-slate-900 text-white">Inaktif / Putus Kontrak</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">
                    {editingId ? 'Simpan Perubahan 🚀' : 'Simpan Rekanan 🚀'}
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