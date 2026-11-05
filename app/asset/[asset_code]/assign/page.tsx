'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase';
import Link from 'next/link';

export default function AssignAssetPage({ params }: { params: Promise<{ asset_code: string }> }) {
  const resolvedParams = use(params);
  const asset_code = resolvedParams.asset_code;
  
  const router = useRouter();
  const supabase = createClient();

  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [actionType, setActionType] = useState('DISTRIBUSI');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('id, name')
        .eq('asset_code', asset_code)
        .single();

      if (assetError || !assetData) {
        alert('Aset tidak ditemukan!');
        setLoading(false);
        return;
      }

      await supabase
        .from('assets')
        .update({ location: `Dipegang oleh: ${employeeName} (${department})` })
        .eq('id', assetData.id);

      const descriptionText = `Aset diserahkan/dialihkan kepada ${employeeName} dari departemen ${department}. Catatan: ${notes || '-'}`;
      
      await supabase.from('asset_histories').insert([
        {
          asset_id: assetData.id,
          action_type: actionType,
          description: descriptionText,
          performed_by: 'Admin GA',
        },
      ]);

      alert('Berhasil mencatat distribusi/pengalihan aset!');
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
            <h1 className="text-xl font-bold text-gray-800">Form Alokasi / Pengalihan Aset</h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Aktivitas</label>
            {/* Tambahkan text-gray-900 agar warna teks jelas */}
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="DISTRIBUSI">Distribusi (Pemberian Awal ke Karyawan)</option>
              <option value="PENGALIHAN">Pengalihan (Mutasi dari Pemegang Lama ke Baru)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemegang Baru / Karyawan</label>
            {/* Tambahkan text-gray-900 */}
            <input 
              type="text" 
              required
              placeholder="Contoh: Budi Santoso"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departemen / Divisi</label>
            {/* Tambahkan text-gray-900 */}
            <input 
              type="text" 
              required
              placeholder="Contoh: Information Technology"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan / Catatan Tambahan</label>
            {/* Tambahkan text-gray-900 */}
            <textarea 
              rows={3}
              placeholder="Contoh: Kelengkapan unit lengkap (tas, charger, mouse)."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm mt-4 disabled:bg-blue-300"
          >
            {loading ? 'Menyimpan Data...' : 'Simpan & Catat Riwayat'}
          </button>
        </form>

      </div>
    </div>
  );
}