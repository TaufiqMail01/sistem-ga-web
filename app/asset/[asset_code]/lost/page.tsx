'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase';
import Link from 'next/link';

export default function LostAssetPage({ params }: { params: Promise<{ asset_code: string }> }) {
  const resolvedParams = use(params);
  const asset_code = resolvedParams.asset_code;
  
  const router = useRouter();
  const supabase = createClient();

  const [lastHolder, setLastHolder] = useState('');
  const [reportDetails, setReportDetails] = useState('');
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

      // 2. Perbarui status kondisi aset menjadi 'Lost' / Hilang dan lokasinya
      await supabase
        .from('assets')
        .update({ 
          condition: 'Lost', 
          location: `Hilang / Dalam Investigasi (Tanggung jawab terakhir: ${lastHolder})` 
        })
        .eq('id', assetData.id);

      // 3. Masukkan catatan ke tabel riwayat (asset_histories)
      const descriptionText = `Aset dilaporkan HILANG. Penanggung jawab terakhir: ${lastHolder}. Kronologi/Catatan: ${reportDetails}`;
      
      await supabase.from('asset_histories').insert([
        {
          asset_id: assetData.id,
          action_type: 'KEHILANGAN',
          description: descriptionText,
          performed_by: 'Admin / GA Security',
        },
      ]);

      alert('Berhasil mencatat status kehilangan aset!');
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
            <h1 className="text-xl font-bold text-red-600">Form Laporan Kehilangan Aset</h1>
            <p className="text-sm text-gray-500 font-mono">Kode Aset: {asset_code}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penanggung Jawab / Pemegang Terakhir</label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Budi Santoso"
              value={lastHolder}
              onChange={(e) => setLastHolder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kronologi & Detail Kehilangan</label>
            <textarea 
              rows={4}
              required
              placeholder="Contoh: Dilaporkan hilang di area parkir kantor pada tanggal..."
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition shadow-sm mt-4 disabled:bg-red-300"
          >
            {loading ? 'Memproses Laporan...' : 'Kunci Status & Catat Kehilangan'}
          </button>
        </form>

      </div>
    </div>
  );
}