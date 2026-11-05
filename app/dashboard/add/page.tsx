'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

export default function AddAssetPage() {
  const [step, setStep] = useState(1);
  const [previewCode, setPreviewCode] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware / IT',
    brand: '',
    model_series: '',
    serial_number: '',
    color_material: '',
    
    // --- 1. STANDAR ISO / SPESIFIKASI KHUSUS HARDWARE / IT ---
    hw_class: 'Business Series',
    hw_processor: '',
    hw_ram: '',
    hw_storage: '',
    hw_os: '',
    hw_gpu: '',
    hw_screen: '',
    hw_mac: '',

    // --- 2. STANDAR ISO / SPESIFIKASI KHUSUS FURNITURE KANTOR ---
    furn_material: '',
    furn_dimensions: '',
    furn_capacity_load: '',
    furn_color_finish: '',

    // --- 3. STANDAR ISO / SPESIFIKASI KHUSUS ELEKTRONIK / ELEKTRONIK KANTOR ---
    elec_power: '',
    elec_voltage: '',
    elec_capacity_pk: '',
    elec_maintenance_interval: '',

    // --- DATA UMUM & FINANSIAL ---
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_cost: '',
    supplier: '',
    location: '',
    holder: '',
    condition: 'Good',
    description: '',
    warranty_expiry: '',
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [assetPhotoFile, setAssetPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleAssetPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssetPhotoFile(e.target.files[0]);
    }
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = rawValue === '' ? '' : Number(rawValue).toLocaleString('id-ID');
    setFormData(prev => ({
      ...prev,
      purchase_cost: formattedValue
    }));
  };

  // VALIDASI KETAT PER STEP
  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.brand.trim() || !formData.model_series.trim() || !formData.serial_number.trim()) {
        alert('Mohon isi Nama, Merk, Model, dan Nomor Seri (S/N) terlebih dahulu!');
        return;
      }
    } else if (step === 2) {
      if (!formData.purchase_cost.trim() || !proofFile) {
        alert('Mohon isi harga perolehan dan wajib unggah bukti nota pembelian pada Langkah 2!');
        return;
      }
    } else if (step === 3) {
      if (!formData.location.trim() || !formData.holder.trim()) {
        alert('Mohon isi lokasi penempatan dan penanggung jawab pada Langkah 3!');
        return;
      }
      
      const currentYear = new Date().getFullYear();
      const randomCodeNumber = Math.floor(1000 + Math.random() * 9000);
      const prefix = formData.category === 'Hardware / IT' ? 'IT' : formData.category === 'Furniture Kantor' ? 'FUR' : 'EL';
      setPreviewCode(`GA-${prefix}-${currentYear}-${randomCodeNumber}`);
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let uploadedFileUrl = '';
    let uploadedAssetPhotoUrl = '';

    // 1. Upload Nota / Bukti Pembelian
    if (proofFile) {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('asset-proofs').upload(`proofs/${fileName}`, proofFile);

      if (uploadError) {
        alert('Gagal mengunggah nota: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicURLData } = supabase.storage.from('asset-proofs').getPublicUrl(`proofs/${fileName}`);
      uploadedFileUrl = publicURLData.publicUrl;
    }

    // 2. Upload Foto Fisik Aset (JPG/PNG dari HP)
    if (assetPhotoFile) {
      const fileExt = assetPhotoFile.name.split('.').pop();
      const photoName = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: photoUploadError } = await supabase.storage.from('asset-proofs').upload(`photos/${photoName}`, assetPhotoFile);

      if (photoUploadError) {
        alert('Gagal mengunggah foto aset: ' + photoUploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicPhotoData } = supabase.storage.from('asset-proofs').getPublicUrl(`photos/${photoName}`);
      uploadedAssetPhotoUrl = publicPhotoData.publicUrl;
    }

    let specificDetails: string[] = [];
    if (formData.category === 'Hardware / IT') {
      specificDetails = [
        `Kelas: ${formData.hw_class}`,
        `Processor: ${formData.hw_processor || '-'}`,
        `RAM: ${formData.hw_ram || '-'}`,
        `Storage: ${formData.hw_storage || '-'}`,
        `OS: ${formData.hw_os || '-'}`,
        `GPU: ${formData.hw_gpu || '-'}`,
        `Layar: ${formData.hw_screen || '-'}`,
        `MAC Address: ${formData.hw_mac || '-'}`
      ];
    } else if (formData.category === 'Furniture Kantor') {
      specificDetails = [
        `Material Utama: ${formData.furn_material || '-'}`,
        `Dimensi (PxLxT): ${formData.furn_dimensions || '-'}`,
        `Kapasitas Beban: ${formData.furn_capacity_load || '-'}`,
        `Warna/Finishing: ${formData.furn_color_finish || '-'}`
      ];
    } else if (formData.category === 'Electronics / Elektronik') {
      specificDetails = [
        `Daya Listrik (Watt): ${formData.elec_power || '-'}`,
        `Tegangan (Voltage): ${formData.elec_voltage || '-'}`,
        `Kapasitas / PK: ${formData.elec_capacity_pk || '-'}`,
        `Jadwal Servis: ${formData.elec_maintenance_interval || '-'}`
      ];
    }

    const combinedSpecification = [
      `Model/Seri: ${formData.model_series}`,
      `Warna/Bahan Dasar: ${formData.color_material || '-'}`,
      `Garansi s.d: ${formData.warranty_expiry || 'Tidak Ada'}`,
      ...specificDetails
    ].join(' | ');

    const payload = {
      asset_code: previewCode,
      name: formData.name.toUpperCase(),
      category: formData.category,
      brand: formData.brand.toUpperCase(),
      serial_number: formData.serial_number.toUpperCase(),
      specification: combinedSpecification,
      purchase_date: formData.purchase_date,
      purchase_cost: Number(formData.purchase_cost.replace(/\./g, '')),
      supplier: formData.supplier.toUpperCase(),
      location: formData.location.toUpperCase(),
      holder: formData.holder.toUpperCase(),
      condition: formData.condition,
      description: formData.description.toUpperCase(),
      proof_url: uploadedFileUrl,
      asset_photo_url: uploadedAssetPhotoUrl,
    };

    const { error: insertError } = await supabase.from('assets').insert([payload]);
    setLoading(false);

    if (insertError) {
      alert('Gagal menyimpan: ' + insertError.message);
    } else {
      alert(`Berhasil! Aset terdaftar dengan Kode: ${previewCode}`);
      router.push('/dashboard/inventory');
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
              <h1 className="font-extrabold text-white text-base">Registrasi Aset (Step {step}/4)</h1>
            </div>
            <Link 
              href="/dashboard/inventory" 
              className="text-xs font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-900 px-4 py-2.5 rounded-xl border border-white/15 transition backdrop-blur-md"
            >
              Kembali
            </Link>
          </header>

          <main className="max-w-3xl w-full mx-auto px-4 md:px-8 py-10">
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 space-y-8 shadow-2xl text-white">
              
              {/* STEP INDICATOR */}
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                {[{ num: 1, label: 'Spesifikasi & Foto Fisik' }, { num: 2, label: 'Finansial & Nota' }, { num: 3, label: 'Lokasi & User' }, { num: 4, label: 'Konfirmasi & QR' }].map((s) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all border ${step === s.num ? 'bg-sky-500 text-white shadow-lg border-sky-400/30' : step > s.num ? 'bg-emerald-600 text-white border-emerald-400/30' : 'bg-slate-950/60 text-slate-400 border-white/10'}`}>
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <span className={`hidden sm:inline text-xs font-bold ${step === s.num ? 'text-sky-400' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: SPESIFIKASI DETAIL ISO & UPLOAD FOTO FISIK HP */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="bg-sky-950/40 border border-sky-500/30 p-4 rounded-2xl backdrop-blur-sm">
                      <p className="text-xs text-sky-300 font-bold">ℹ️ Standar ISO Kategori Terjaga:</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Lengkapi spesifikasi teknis sesuai kategori pilihan Anda dan unggah foto fisik aset agar langsung tampil saat QR code dipindai.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kategori Aset <span className="text-rose-400">*</span></label>
                        <select 
                          value={formData.category} 
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                          className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-sky-400 font-bold cursor-pointer"
                        >
                          <option value="Hardware / IT" className="bg-slate-900 text-white">Hardware / IT</option>
                          <option value="Furniture Kantor" className="bg-slate-900 text-white">Furniture Kantor</option>
                          <option value="Electronics / Elektronik" className="bg-slate-900 text-white">Electronics / Elektronik</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nama Barang <span className="text-rose-400">*</span></label>
                        <input type="text" required placeholder="Contoh: LAPTOP THINKPAD" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase font-bold placeholder-slate-400 focus:outline-sky-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Merk / Brand <span className="text-rose-400">*</span></label>
                        <input type="text" required placeholder="Contoh: LENOVO" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Model / Seri <span className="text-rose-400">*</span></label>
                        <input type="text" required placeholder="Contoh: T14 GEN 3" value={formData.model_series} onChange={(e) => setFormData({ ...formData, model_series: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nomor Seri (S/N) <span className="text-rose-400">*</span></label>
                        <input type="text" required placeholder="Contoh: SN-8839201" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono uppercase placeholder-slate-400 focus:outline-sky-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Warna / Bahan Utama</label>
                        <input type="text" placeholder="Contoh: HITAM / ALUMINIUM" value={formData.color_material} onChange={(e) => setFormData({ ...formData, color_material: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Masa Garansi s.d</label>
                        <input type="date" value={formData.warranty_expiry} onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-sky-400" />
                      </div>

                      {/* UPLOAD FOTO FISIK ASET (KAMERA HP / JPG / PNG) */}
                      <div className="sm:col-span-2 pt-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Unggah Foto Fisik Aset (Kamera HP / JPG / PNG)</label>
                        <div className="bg-slate-950/60 border-2 border-dashed border-white/15 rounded-2xl p-6 text-center space-y-2">
                          <input type="file" accept="image/*" onChange={handleAssetPhotoChange} className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-500/20 file:text-sky-300 cursor-pointer" />
                          {assetPhotoFile && <p className="text-xs font-semibold text-emerald-400 pt-1">Foto Terpilih: {assetPhotoFile.name}</p>}
                          <p className="text-[10px] text-slate-400">Foto ini akan muncul saat QR Code aset dipindai oleh pengguna.</p>
                        </div>
                      </div>

                      {/* --- ATRIBUT STANDAR ISO 1: HARDWARE / IT --- */}
                      {formData.category === 'Hardware / IT' && (
                        <>
                          <div className="sm:col-span-2 border-t border-white/10 pt-3 mt-2">
                            <p className="text-xs font-black text-sky-400">⚙️ Standar ISO Spesifikasi Teknis Hardware / IT</p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">Kelas Perangkat</label>
                            <select value={formData.hw_class} onChange={(e) => setFormData({...formData, hw_class: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-bold">
                              <option value="Business Series" className="bg-slate-900 text-white">Business Series</option>
                              <option value="Executive Series" className="bg-slate-900 text-white">Executive Series</option>
                              <option value="Workstation" className="bg-slate-900 text-white">Workstation</option>
                            </select>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Processor / CPU</label><input type="text" placeholder="INTEL CORE I7-12700H" value={formData.hw_processor} onChange={(e) => setFormData({...formData, hw_processor: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">RAM Capacity</label><input type="text" placeholder="16GB DDR5" value={formData.hw_ram} onChange={(e) => setFormData({...formData, hw_ram: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Storage (SSD/HDD)</label><input type="text" placeholder="512GB NVMe SSD" value={formData.hw_storage} onChange={(e) => setFormData({...formData, hw_storage: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Operating System</label><input type="text" placeholder="WINDOWS 11 PRO 64-BIT" value={formData.hw_os} onChange={(e) => setFormData({...formData, hw_os: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Grafis (GPU)</label><input type="text" placeholder="NVIDIA RTX 3050 / INTEL IRIS XE" value={formData.hw_gpu} onChange={(e) => setFormData({...formData, hw_gpu: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Ukuran Layar</label><input type="text" placeholder="14 INCH FHD (1920x1080)" value={formData.hw_screen} onChange={(e) => setFormData({...formData, hw_screen: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">MAC Address / IP</label><input type="text" placeholder="A4:C3:F4:5E:8B:12" value={formData.hw_mac} onChange={(e) => setFormData({...formData, hw_mac: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-mono uppercase placeholder-slate-400" /></div>
                        </>
                      )}

                      {/* --- ATRIBUT STANDAR ISO 2: FURNITURE KANTOR --- */}
                      {formData.category === 'Furniture Kantor' && (
                        <>
                          <div className="sm:col-span-2 border-t border-white/10 pt-3 mt-2">
                            <p className="text-xs font-black text-sky-400">🛋️ Standar ISO Spesifikasi Detail Furniture Kantor</p>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Material Utama</label><input type="text" placeholder="KAYU JATI / STEEL FRAME / PLYWOOD HPL" value={formData.furn_material} onChange={(e) => setFormData({...formData, furn_material: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Dimensi (P x L x T)</label><input type="text" placeholder="120 x 60 x 75 CM" value={formData.furn_dimensions} onChange={(e) => setFormData({...formData, furn_dimensions: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Kapasitas Beban Maksimal</label><input type="text" placeholder="150 KG" value={formData.furn_capacity_load} onChange={(e) => setFormData({...formData, furn_capacity_load: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Warna / Finishing</label><input type="text" placeholder="DUCO COKLAT KAYU / BLACK MATTE" value={formData.furn_color_finish} onChange={(e) => setFormData({...formData, furn_color_finish: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                        </>
                      )}

                      {/* --- ATRIBUT STANDAR ISO 3: ELECTRONICS / ELEKTRONIK --- */}
                      {formData.category === 'Electronics / Elektronik' && (
                        <>
                          <div className="sm:col-span-2 border-t border-white/10 pt-3 mt-2">
                            <p className="text-xs font-black text-sky-400">⚡ Standar ISO Spesifikasi Kelistrikan & Perangkat Elektronik</p>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Daya Listrik (Watt)</label><input type="text" placeholder="Contoh: 850 W" value={formData.elec_power} onChange={(e) => setFormData({...formData, elec_power: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Tegangan (Voltage)</label><input type="text" placeholder="220V - 240V / 50Hz" value={formData.elec_voltage} onChange={(e) => setFormData({...formData, elec_voltage: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Kapasitas / Ukuran (PK / Inch)</label><input type="text" placeholder="2 PK (untuk AC) atau 55 INCH (untuk TV)" value={formData.elec_capacity_pk} onChange={(e) => setFormData({...formData, elec_capacity_pk: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                          <div><label className="block text-xs font-bold text-slate-300 mb-1">Jadwal Perawatan Berkala</label><input type="text" placeholder="SETIAP 3 BULAN SEKALI" value={formData.elec_maintenance_interval} onChange={(e) => setFormData({...formData, elec_maintenance_interval: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white uppercase placeholder-slate-400" /></div>
                        </>
                      )}

                    </div>
                  </div>
                )}

                {/* STEP 2: FINANSIAL & NOTA */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-white">Langkah 2: Data Finansial & Nota Pembelian</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Tanggal Perolehan <span className="text-rose-400">*</span></label><input type="date" required value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-sky-400" /></div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Harga Perolehan (Rp) <span className="text-rose-400">*</span></label>
                        <input type="text" required placeholder="Contoh: 15.000.000" value={formData.purchase_cost} onChange={handleCostChange} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-mono font-bold placeholder-slate-400 focus:outline-sky-400" />
                      </div>
                      <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Vendor / Supplier <span className="text-rose-400">*</span></label><input type="text" required placeholder="NAMA TOKO / PT" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" /></div>
                      
                      <div className="sm:col-span-2 pt-2">
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Unggah Bukti Nota / Faktur <span className="text-rose-400">*</span></label>
                        <div className="bg-slate-950/60 border-2 border-dashed border-white/15 rounded-2xl p-6 text-center space-y-2">
                          <input type="file" required accept="image/*,.pdf" onChange={handleFileChange} className="block w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-500/20 file:text-sky-300 cursor-pointer" />
                          {proofFile && <p className="text-xs font-semibold text-emerald-400 pt-1">File Terpilih: {proofFile.name}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOKASI & USER */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-white">Langkah 3: Lokasi & Penanggung Jawab</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Lokasi Penempatan <span className="text-rose-400">*</span></label><input type="text" required placeholder="GEDUNG A - LANTAI 3 - RUANGAN" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" /></div>
                      <div><label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Penanggung Jawab (User) <span className="text-rose-400">*</span></label><input type="text" required placeholder="TAUFIQ ISMAIL" value={formData.holder} onChange={(e) => setFormData({ ...formData, holder: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" /></div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Kondisi Fisik <span className="text-rose-400">*</span></label>
                        <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer">
                          <option value="Good" className="bg-slate-900 text-white">🟢 Baik (Good / Ready)</option>
                          <option value="Maintenance" className="bg-slate-900 text-white">🟡 Perawatan (Maintenance)</option>
                          <option value="Broken" className="bg-slate-900 text-white">🔴 Rusak (Broken)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Catatan Kelengkapan Aset <span className="text-rose-400">*</span></label><textarea rows={2} required placeholder="LENGKAP DENGAN KABEL POWER & ADAPTOR." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white uppercase placeholder-slate-400 focus:outline-sky-400" /></div>
                    </div>
                  </div>
                )}

                {/* STEP 4: KONFIRMASI & QR CODE */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-white">Langkah 4: Konfirmasi & QR Code Aset</h3>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-950/60 p-6 rounded-3xl border border-white/15 backdrop-blur-md">
                      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center">
                        {previewCode && (
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${previewCode}`} 
                            alt="QR Code Aset" 
                            className="w-32 h-32 object-contain"
                          />
                        )}
                        <span className="mt-2 font-mono text-[11px] font-bold text-sky-600">{previewCode}</span>
                      </div>

                      <div className="flex-1 space-y-2 text-xs w-full">
                        <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Kategori:</span><strong className="text-sky-400">{formData.category}</strong></div>
                        <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Nama & Merk:</span><strong className="text-white">{formData.name} ({formData.brand})</strong></div>
                        <div className="flex justify-between border-b border-white/10 pb-1.5"><span className="text-slate-400">Foto Fisik Aset:</span><strong className={assetPhotoFile ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}>{assetPhotoFile ? '✓ Terunggah' : 'Tidak Ada'}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Lokasi / User:</span><strong className="text-white">{formData.location} ({formData.holder})</strong></div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 italic text-center">QR Code di atas digenerate otomatis berdasarkan kode unik aset dan siap menampilkan foto fisik 2D saat dipindai.</p>
                  </div>
                )}

                <div className="pt-6 flex items-center justify-between border-t border-white/10">
                  {step > 1 ? <button type="button" onClick={prevStep} className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">← Sebelumnya</button> : <Link href="/dashboard/inventory" className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white">Batal</Link>}
                  {step < 4 ? <button type="button" onClick={nextStep} className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer border border-sky-400/30">Selanjutnya →</button> : <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-2xl text-xs font-bold transition shadow-lg disabled:opacity-50 cursor-pointer border border-emerald-400/30">{loading ? 'Menyimpan...' : 'Simpan & Daftarkan Aset 🚀'}</button>}
                </div>

              </form>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}