import { notFound } from 'next/navigation';
import { createClient } from '../../../../lib/supabase';
import Link from 'next/link';

export default async function AssetHistoryPage({ params }: { params: Promise<{ asset_code: string }> }) {
  const { asset_code } = await params;
  const supabase = createClient();

  // 1. Ambil data aset berdasarkan asset_code
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('*')
    .eq('asset_code', asset_code)
    .single();

  if (assetError || !asset) {
    notFound();
  }

  // 2. Ambil riwayat mutasi dari tabel asset_histories berdasarkan id aset
  const { data: histories, error: historyError } = await supabase
    .from('asset_histories')
    .select('*')
    .eq('asset_id', asset.id)
    .order('created_at', { ascending: false }); // Urutkan dari yang terbaru

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 p-6">
        
        {/* Tombol Kembali & Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Riwayat Aset</h1>
            <p className="text-sm text-gray-500">{asset.name} ({asset.asset_code})</p>
          </div>
          <Link 
            href={`/asset/${asset.asset_code}`}
            className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition"
          >
            ← Kembali ke KTP
          </Link>
        </div>

        {/* Daftar Timeline Riwayat */}
        <div className="space-y-6">
          {historyError || !histories || histories.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada catatan riwayat untuk aset ini.</p>
          ) : (
            histories.map((item, index) => (
              <div key={item.id} className="flex space-x-4 items-start relative">
                {/* Garis Vertikal Timeline */}
                {index !== histories.length - 1 && (
                  <div className="absolute left-3 top-6 w-0.5 h-full bg-gray-200"></div>
                )}
                
                {/* Titik Indikator */}
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold z-10">
                  {histories.length - index}
                </div>

                {/* Konten Riwayat */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {item.action_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-2">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-3 italic">Dicatat oleh: {item.performed_by || 'Sistem'}</p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}