import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import PrintButton from './PrintButton';

export default async function PrintQRCodePage({ params }: { params: Promise<{ asset_code: string }> }) {
  const { asset_code } = await params;
  
  const supabase = createClient();
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('asset_code', asset_code)
    .single();

  if (error || !asset) {
    notFound(); 
  }

  const assetUrl = `http://10.195.3.101:3000/asset/${asset.asset_code}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      
      {/* Tombol Navigasi & Cetak */}
      <div className="mb-6 flex gap-4 print:hidden">
        <Link 
          href={`/asset/${asset.asset_code}`}
          className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
        >
          ← Kembali ke KTP Barang
        </Link>
        
        {/* Tombol Cetak Interaktif dipisah ke Client Component */}
        <PrintButton />
      </div>

      {/* Area Kartu Stiker QR Code */}
      <div className="bg-white border-2 border-dashed border-gray-400 rounded-2xl p-6 w-80 text-center shadow-lg print:border-solid print:shadow-none">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">General Affairs Asset</h2>
        <h1 className="text-lg font-extrabold text-gray-900 mt-0.5">{asset.name}</h1>
        
        <div className="my-5 flex justify-center bg-white p-3 rounded-xl border border-gray-100 shadow-inner inline-block">
          <QRCodeSVG 
            value={assetUrl} 
            size={160}
            level={'H'}
            includeMargin={true}
          />
        </div>

        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 font-medium">Scan untuk melihat KTP & Riwayat:</p>
          <p className="text-sm font-mono font-bold text-blue-600 mt-0.5">{asset.asset_code}</p>
        </div>

        <p className="text-[10px] text-gray-400 mt-4">Sistem Inventaris Aset Terpadu • GA Dept</p>
      </div>

    </div>
  );
}