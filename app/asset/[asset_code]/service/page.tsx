'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase';
import Link from 'next/link';

export default function ServiceAssetPage({ params }: { params: Promise<{ asset_code: string }> }) {
  const resolvedParams = use(params);
  const asset_code = resolvedParams.asset_code;
  
  const router = useRouter();
  const supabase = createClient();

  const [actionType, setActionType] = useState('PERBAIKAN'); // Bisa PERBAIKAN atau UPGRADE
  const [description, setDescription] = useState('');
  const [newCondition, setNewCondition] = useState('Good'); // Update kondisi fisik setelah servis
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Ambil ID aset berdasarkan asset_code
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('id')
        .eq('asset_code', asset_code)
        .single();

      if (assetError || !assetData) {
        alert('Aset tidak ditemukan!');
        setLoading(false);
        return;
      }

      // 2. Perbarui kondisi terkini pada tabel utama assets
      await supabase
        .from('assets')
        .update({ condition: newCondition })
        .eq('id', assetData.id);

      // 3. Masukkan catatan ke tabel riwayat (asset_histories)
      await supabase.from('asset_histories').insert([
        {
          asset_id: assetData.id,
          action_type: actionType, // 'PERBAIKAN' atau 'UPGRADE'
          description: description,
          performed_by: 'Teknisi / Admin GA',
        },
      ]);

      alert('Berhasil mencatat riwayat servis/upgrade!');
      router.push(`/asset/${asset_code}/history`);
    } catch (err) {
      console.error('Gagal memproses data:', err);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center items-center">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Form Servis & Upgrade Aset</h1>
            <p className="text-sm text-blue-600 font-mono">Kode Aset: {asset_code}</p>
          </div>
          <Link 
            href={`/asset/${asset_code}`}
            className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
          >
            Kembali
          </Link>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Aktivitas Pemeliharaan</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="PERBAIKAN">Perbaikan / Servis (Repair / Maintenance)</option>
              <option value="UPGRADE">Peningkatan Spesifikasi (Upgrade Hardware)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Kondisi Fisik Setelah Servis</label>
            <select 
              value={newCondition} 
              onChange={(e) => setNewCondition(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Good">Good (Normal / Baik)</option>
              <option value="Maintenance">Maintenance (Dalam Pengawasan)</option>
              <option value="Broken">Broken (Rusak / Belum Bisa Digunakan)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detail Pekerjaan / Catatan Servis</label>
            <textarea 
              rows={4}
              required
              placeholder="Contoh: Penggantian SSD 512GB dan penambahan RAM 8GB."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm mt-4 disabled:bg-blue-300"
          >
            {loading ? 'Menyimpan Data...' : 'Simpan Riwayat Servis'}
          </button>
        </form>

      </div>
    </div>
  );
}