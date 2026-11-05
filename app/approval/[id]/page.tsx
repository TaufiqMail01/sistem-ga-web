'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { CheckCircle2, XCircle, Building, User, Calendar, ShoppingBag, ShieldCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

type TransactionRecord = {
  id: string;
  order_code: string;
  department: string;
  requester: string;
  items: string;
  special_note: string;
  total_items: number;
  total_cost: number;
  date: string;
  status: string;
};

export default function ApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('atk_transactions_v2')
      .select('*')
      .or(`id.eq.${id},order_code.eq.${id}`)
      .single();

    if (data) {
      setOrder(data);
      if (data.status && data.status !== 'Menunggu Approval Manager') {
        setActionDone(true);
      }
    }
    setLoading(false);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleApproveByManager = async () => {
    if (!order) return;
    setProcessing(true);

    const { error } = await supabase
      .from('atk_transactions_v2')
      .update({ status: 'Disetujui Manager & Dicek GA' })
      .eq('id', order.id);

    if (error) {
      alert('Gagal menyetujui pesanan: ' + error.message);
    } else {
      setActionDone(true);
      alert('Pesanan berhasil disetujui! Notifikasi telah diteruskan ke Dashboard Staff GA.');
      fetchOrderDetails();
    }
    setProcessing(false);
  };

  const handleRejectByManager = async () => {
    if (!order) return;
    const reason = prompt('Masukkan alasan penolakan pesanan ini:');
    if (reason === null) return;

    setProcessing(true);
    const { error } = await supabase
      .from('atk_transactions_v2')
      .update({ status: `Ditolak Manager: ${reason}` })
      .eq('id', order.id);

    if (error) {
      alert('Gagal menolak pesanan: ' + error.message);
    } else {
      setActionDone(true);
      alert('Pesanan telah ditolak.');
      fetchOrderDetails();
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <p className="text-xs text-slate-500 font-bold animate-pulse">Memuat rincian pengajuan dari server...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl border border-slate-200">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-black text-slate-900">Data Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Tautan persetujuan ini tidak valid atau data telah dihapus.</p>
        </div>
      </div>
    );
  }

  const parsedItems = JSON.parse(order.items || '[]');
  const isRejected = order.status?.toLowerCase().includes('ditolak');
  const isAccepted = order.status && order.status !== 'Menunggu Approval Manager' && !isRejected;

  return (
    <div className="min-h-screen bg-slate-100 font-sans py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6 relative overflow-hidden">
        
        {/* WATERMARK STEMPEL REJECTED DI TENGAH */}
        {isRejected && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="border-4 border-rose-500/25 bg-rose-500/[0.02] backdrop-blur-[0.5px] rounded-full py-4 px-10 flex items-center gap-5 transform -rotate-12 select-none whitespace-nowrap">
              <span className="text-rose-500/30 font-black text-4xl sm:text-5xl tracking-wider uppercase">
                REJECTED
              </span>
              <div className="w-14 h-14 rounded-full border-4 border-rose-500/25 flex items-center justify-center text-rose-500/30 font-black text-2xl flex-shrink-0">
                ✕
              </div>
            </div>
          </div>
        )}

        {/* WATERMARK STEMPEL APPROVED DI TENGAH */}
        {isAccepted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="border-4 border-emerald-500/25 bg-emerald-500/[0.02] backdrop-blur-[0.5px] rounded-full py-4 px-10 flex items-center gap-5 transform -rotate-12 select-none whitespace-nowrap">
              <span className="text-emerald-500/30 font-black text-4xl sm:text-5xl tracking-wider uppercase">
                APPROVED
              </span>
              <div className="w-14 h-14 rounded-full border-4 border-emerald-500/25 flex items-center justify-center text-emerald-500/30 font-black text-2xl flex-shrink-0">
                ✓
              </div>
            </div>
          </div>
        )}

        {/* Header Kartu dengan Badge di Kanan Atas */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Approval Business Manager
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">{order.order_code}</span>
            </div>
            <h1 className="text-xl font-black text-slate-900">Persetujuan Pengadaan ATK</h1>
            <p className="text-xs text-slate-500">Tinjau rincian pengeluaran unit kerja sebelum diteruskan ke gudang GA.</p>
          </div>

          {/* BADGE DI KANAN ATAS (SESUAI GAMBAR REFERENSI) */}
          {isAccepted && (
            <div className="bg-emerald-600 text-white pl-2 pr-4 py-1.5 rounded-full flex items-center gap-3 shadow-md flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <span className="font-black text-xs tracking-wider uppercase">APPROVED</span>
            </div>
          )}

          {isRejected && (
            <div className="bg-rose-600 text-white pl-2 pr-4 py-1.5 rounded-full flex items-center gap-3 shadow-md flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white text-rose-600 flex items-center justify-center font-bold">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <span className="font-black text-xs tracking-wider uppercase">REJECTED</span>
            </div>
          )}

          {!isAccepted && !isRejected && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700">
              <ShieldCheck className="w-6 h-6 text-sky-600" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Departemen</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-sky-600" /> {order.department}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Penanggung Jawab</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-sky-600" /> {order.requester}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tanggal Pengajuan</span>
            <span className="font-extrabold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> {order.date}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-sky-600" /> Rincian Item & Pemesan Kolektif:
          </span>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {parsedItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{item.item_name}</span>
                  <span className="text-[11px] text-slate-500">
                    Kuantitas: <strong className="text-slate-800">{item.qty} {item.unit}</strong> | Pemesan: <strong className="text-sky-700">{item.collectifNames}</strong>
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {order.special_note && order.special_note !== '-' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1">
              <span className="font-bold block uppercase text-[10px] text-amber-700">Catatan / Permintaan Spesial Barang Habis:</span>
              <p className="font-medium">{order.special_note}</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Total Kuantitas & Estimasi Anggaran</span>
            <span className="font-bold text-slate-200">{order.total_items} Pcs Total Barang</span>
          </div>
          <span className="font-mono font-black text-emerald-400 text-base">{formatRupiah(order.total_cost)}</span>
        </div>

        <div className="pt-4 border-t border-slate-100">
          {actionDone || order.status !== 'Menunggu Approval Manager' ? (
            <div className={`border rounded-2xl p-4 text-center space-y-1 ${
              isRejected 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-xs font-black block">Status Pesanan Saat Ini:</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block mt-1 ${
                isRejected 
                  ? 'bg-rose-100 text-rose-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {order.status}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRejectByManager}
                disabled={processing}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer border border-rose-200 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Tolak Pesanan
              </button>
              <button
                onClick={handleApproveByManager}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-xs font-bold transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Teruskan ke GA 🚀
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}