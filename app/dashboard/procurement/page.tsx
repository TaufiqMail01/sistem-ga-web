'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { CheckCircle2, Clock, AlertTriangle, PackageCheck, Layers, FileText, Download, Upload, Plus, Search, Filter, Calendar, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

type AtkItem = {
  id: string;
  sku: string;
  item_name: string;
  category: string;
  stock_quantity: number;
  unit: string;
  unit_price: number;
  location: string;
  minimum_stock: number;
  description?: string;
};

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

export default function GaProcurementDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'stock' | 'history'>('requests');
  const [atkList, setAtkList] = useState<AtkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'Low' | 'Normal'>('All');

  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [currentAtk, setCurrentAtk] = useState<AtkItem | null>(null);
  const [incomingStock, setIncomingStock] = useState<number>(0);

  const [transactionHistory, setTransactionHistory] = useState<TransactionRecord[]>([]);
  const [allTransactionsForHistory, setAllTransactionsForHistory] = useState<TransactionRecord[]>([]);

  const [form, setForm] = useState({
    sku: '',
    item_name: '',
    category: 'Kertas & Produk Kertas',
    stock_quantity: 10,
    unit: 'Rim',
    unit_price: 50000,
    location: 'Gudang Utama GA',
    minimum_stock: 5,
    description: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAtkStock();
    fetchTransactions();
    fetchAllTransactionsForHistory();
  }, []);

  const fetchAtkStock = async () => {
    setLoading(true);
    const { data } = await supabase.from('atk_inventory_v2').select('*').order('created_at', { ascending: false });
    if (data) setAtkList(data);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('atk_transactions_v2')
      .select('*')
      .not('status', 'ilike', '%Ditolak%')
      .order('created_at', { ascending: false });
    if (data) setTransactionHistory(data);
  };

  const fetchAllTransactionsForHistory = async () => {
    const { data } = await supabase
      .from('atk_transactions_v2')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAllTransactionsForHistory(data);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const generateInternationalSku = (category: string) => {
    let prefix = 'OFF';
    const catLower = category.toLowerCase();
    if (catLower.includes('kertas')) prefix = 'PAP';
    else if (catLower.includes('tulis')) prefix = 'WRT';
    else if (catLower.includes('arsip')) prefix = 'FIL';
    else if (catLower.includes('tinta')) prefix = 'PRT';
    else if (catLower.includes('perekat')) prefix = 'GLU';
    else if (catLower.includes('kebersihan')) prefix = 'CLN';
    else if (catLower.includes('elektronik')) prefix = 'ELE';
    else if (catLower.includes('keamanan')) prefix = 'SEC';

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };

  const handleSaveAtk = async (e: React.FormEvent) => {
    e.preventDefault();
    const generatedSku = generateInternationalSku(form.category);
    const newItem = { 
      sku: generatedSku,
      item_name: form.item_name,
      category: form.category,
      stock_quantity: form.stock_quantity,
      unit: form.unit,
      unit_price: form.unit_price,
      location: form.location,
      minimum_stock: form.minimum_stock,
      description: form.description
    };

    const { error } = await supabase.from('atk_inventory_v2').insert([newItem]);
    if (error) {
      alert('Gagal menyimpan ATK: ' + error.message);
    } else {
      alert(`Berhasil menambahkan ATK baru dengan SKU: ${generatedSku}!`);
      setShowAddModal(false);
      fetchAtkStock();
    }
  };

  const handleUpdateAtk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAtk) return;
    const finalStock = Number(currentAtk.stock_quantity) + Number(incomingStock);

    const { error } = await supabase.from('atk_inventory_v2').update({
      stock_quantity: finalStock,
    }).eq('id', currentAtk.id);

    if (error) {
      alert('Gagal memperbarui data: ' + error.message);
    } else {
      setShowEditModal(false);
      setIncomingStock(0);
      alert('Stok gudang berhasil diperbarui!');
      fetchAtkStock();
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedItems = data.map((row, idx) => ({
          sku: generateInternationalSku(row['Kategori'] || 'Kertas'),
          item_name: row['Nama Barang'] || `Item ${idx + 1}`,
          category: row['Kategori'] || 'Kertas & Produk Kertas',
          stock_quantity: Number(row['Stok Awal']) || 10,
          unit: row['Satuan'] || 'Pcs',
          unit_price: Number(row['Harga Satuan (Rp)']) || 10000,
          location: 'Gudang Utama GA',
          minimum_stock: 5,
        }));

        await supabase.from('atk_inventory_v2').insert(formattedItems);
        alert('Upload masal berhasil!');
        setShowBulkModal(false);
        fetchAtkStock();
      } catch (err: any) {
        alert('Format file tidak valid: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // FITUR BARU: Hapus item yang kosong langsung dari pesanan tanpa menolak seluruh pesanan
  const handleRemoveItemFromOrder = async (order: TransactionRecord, itemIndexToRemove: number) => {
    const parsedItems = JSON.parse(order.items || '[]');
    if (parsedItems.length <= 1) {
      alert('Pesanan hanya memiliki 1 item. Jika ingin menolak seluruh pesanan, gunakan status tolak atau batalkan.');
      return;
    }

    const removedItemName = parsedItems[itemIndexToRemove].item_name;
    const isConfirmed = window.confirm(`Hapus item "${removedItemName}" dari daftar pesanan ini karena stok habis? Item lainnya akan tetap diproses.`);
    if (!isConfirmed) return;

    const updatedItems = parsedItems.filter((_: any, idx: number) => idx !== itemIndexToRemove);
    const newTotalItems = updatedItems.reduce((acc: number, curr: any) => acc + curr.qty, 0);
    const newTotalCost = updatedItems.reduce((acc: number, curr: any) => acc + curr.subtotal, 0);

    const { error } = await supabase.from('atk_transactions_v2').update({
      items: JSON.stringify(updatedItems),
      total_items: newTotalItems,
      total_cost: newTotalCost,
      status: `${order.status} (Dihapus item: ${removedItemName} karena kosong)`
    }).eq('id', order.id);

    if (error) {
      alert('Gagal memperbarui pesanan: ' + error.message);
    } else {
      alert(`Item "${removedItemName}" berhasil dikeluarkan dari daftar pesanan.`);
      fetchTransactions();
      fetchAllTransactionsForHistory();
    }
  };

  const handleProcessOrder = async (order: TransactionRecord) => {
    const isConfirmed = window.confirm(`Proses pesanan ${order.order_code} dari ${order.department}?\nTindakan ini akan memotong stok fisik di gudang untuk item yang tersedia.`);
    if (!isConfirmed) return;

    try {
      const items = JSON.parse(order.items || '[]');

      for (const item of items) {
        const target = atkList.find(a => a.item_name === item.item_name);
        if (!target || target.stock_quantity < item.qty) {
          alert(`Stok fisik untuk "${item.item_name}" tidak mencukupi! Harap hapus item yang kosong terlebih dahulu menggunakan tombol tempat sampah di atas item tersebut.`);
          return;
        }
      }

      for (const item of items) {
        const target = atkList.find(a => a.item_name === item.item_name);
        if (target) {
          const newStock = target.stock_quantity - item.qty;
          await supabase.from('atk_inventory_v2').update({ stock_quantity: newStock }).eq('id', target.id);
        }
      }

      await supabase.from('atk_transactions_v2').update({ status: 'Selesai & Diproses GA' }).eq('id', order.id);

      alert('Pesanan berhasil diproses dan stok gudang telah diperbarui!');
      fetchAtkStock();
      fetchTransactions();
      fetchAllTransactionsForHistory();
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  const filteredRequests = transactionHistory.filter(t => {
    if (statusFilter === 'All') return true;
    return t.status?.toLowerCase().includes(statusFilter.toLowerCase());
  });

  const filteredHistory = allTransactionsForHistory.filter(t => {
    const statusLower = t.status?.toLowerCase() || '';
    const isItemRejected = statusLower.includes('ditolak');
    const isItemApproved = statusLower.includes('disetujui') || statusLower.includes('selesai');

    if (historyStatusFilter === 'Approved' && !isItemApproved) return false;
    if (historyStatusFilter === 'Rejected' && !isItemRejected) return false;

    if (selectedMonth !== 'All') {
      const itemDateStr = t.date || '';
      if (!itemDateStr.startsWith(selectedMonth)) return false;
    }

    return true;
  });

  return (
    <>
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
              <h1 className="font-extrabold text-white text-lg">Panel Admin & GA Pengadaan ATK</h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2 border border-sky-400/30 backdrop-blur-md"
              >
                <Plus className="w-4 h-4" /> Input ATK Baru
              </button>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-6 md:px-12 pt-10 space-y-8 pb-20">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/70 backdrop-blur-xl p-2 rounded-3xl border border-white/10 w-full shadow-2xl">
              <button 
                onClick={() => setActiveTab('requests')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'requests' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <FileText className="w-4 h-4" /> Pusat Permintaan Masuk ({transactionHistory.length})
              </button>
              <button 
                onClick={() => setActiveTab('stock')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'stock' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Layers className="w-4 h-4" /> Manajemen Stok Gudang ({atkList.length})
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md ${activeTab === 'history' ? 'bg-sky-500 text-white shadow-xl border border-sky-400/30' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <Calendar className="w-4 h-4" /> Riwayat & Laporan Bulanan
              </button>
            </div>

            {activeTab === 'requests' && (
              <div className="space-y-6">
                <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 mr-2">Filter Status:</span>
                    {['All', 'Menunggu Approval', 'Disetujui', 'Selesai'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer backdrop-blur-md border ${statusFilter === st ? 'bg-sky-500 text-white border-sky-400/30 shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10 border-white/10'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-16 text-center text-slate-400 text-xs italic shadow-2xl">
                    Belum ada data permintaan ATK.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredRequests.map(order => {
                      const parsedItems = JSON.parse(order.items || '[]');
                      const isReadyToProcess = order.status?.includes('Disetujui Manager');

                      return (
                        <div key={order.id} className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
                          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-white/10 pb-5">
                            <div>
                              <span className="font-mono text-xs font-extrabold text-sky-400 bg-sky-500/20 px-3 py-1 rounded-lg border border-sky-500/30">{order.order_code}</span>
                              <h3 className="text-sm font-black text-white mt-2">Departemen: {order.department} (Pemohon: {order.requester})</h3>
                            </div>
                            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rincian Item & Pemesan Kolektif:</span>
                              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                                💡 Klik ikon tempat sampah 🗑️ pada item yang kosong untuk menghapusnya dari pesanan ini tanpa menolak pesanan lainnya.
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {parsedItems.map((item: any, idx: number) => {
                                const stockInDb = atkList.find(a => a.item_name === item.item_name)?.stock_quantity ?? 0;
                                const isEnough = stockInDb >= item.qty;

                                return (
                                  <div key={idx} className={`p-4 rounded-2xl border text-xs space-y-2 backdrop-blur-md relative group ${isEnough ? 'bg-slate-950/60 border-white/10' : 'bg-rose-950/30 border-rose-500/40'}`}>
                                    <div className="flex justify-between items-start">
                                      <span className="font-bold text-white block pr-6">{item.item_name}</span>
                                      {/* TOMBOL HAPUS ITEM SPESIFIK JIKA STOK KOSONG */}
                                      <button
                                        onClick={() => handleRemoveItemFromOrder(order, idx)}
                                        title="Hapus item ini dari pesanan karena kosong"
                                        className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 p-1.5 rounded-xl transition cursor-pointer border border-rose-500/30"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <span className="text-[11px] text-slate-300 block">Minta: <strong className="text-white">{item.qty} {item.unit}</strong> | Pemesan: <span className="text-sky-400">{item.collectifNames}</span></span>
                                    <span className={`text-[10px] font-bold block ${isEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {isEnough ? `✓ Stok Gudang Ada (${stockInDb})` : `⚠️ Stok Habis / Kurang (${stockInDb})`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {order.special_note && order.special_note !== '-' && (
                            <div className="bg-amber-500/10 p-4 rounded-2xl text-xs text-amber-200 border border-amber-500/30 backdrop-blur-md">
                              <strong>Catatan Spesial:</strong> {order.special_note}
                            </div>
                          )}

                          <div className="flex flex-wrap justify-between items-center pt-5 border-t border-white/10 gap-4">
                            <span className="font-mono text-xs font-black text-white">Total Anggaran: {formatRupiah(order.total_cost)}</span>
                            
                            {isReadyToProcess && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleProcessOrder(order)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2 border border-emerald-400/30 backdrop-blur-md"
                                >
                                  <PackageCheck className="w-4 h-4" /> Proses Pesanan & Potong Stok 🚀
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl p-6">
                  <h3 className="text-sm font-black text-white mb-4">Manajemen Stok Gudang</h3>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                          <th className="py-4 px-6">SKU & Nama Barang</th>
                          <th className="py-4 px-6">Kategori</th>
                          <th className="py-4 px-6">Stok Fisik</th>
                          <th className="py-4 px-6">Harga Satuan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs">
                        {atkList.map(item => (
                          <tr key={item.id} className="hover:bg-white/5 transition">
                            <td className="py-4 px-6">
                              <span className="font-bold text-white block">{item.item_name}</span>
                              <span className="font-mono text-[11px] text-sky-400">{item.sku}</span>
                            </td>
                            <td className="py-4 px-6 text-slate-200">{item.category}</td>
                            <td className="py-4 px-6 font-mono font-bold text-white">{item.stock_quantity} {item.unit}</td>
                            <td className="py-4 px-6 font-mono font-semibold text-emerald-400">{formatRupiah(item.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                  <h3 className="text-base font-black text-white">Arsip Histori & Laporan Bulanan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">📅 Pilih Bulan:</label>
                      <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value || 'All')}
                        className="bg-slate-950/60 border border-white/15 rounded-2xl px-5 py-3 text-xs font-bold text-white focus:outline-sky-400 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">🔍 Filter Status Keputusan:</label>
                      <div className="flex gap-2">
                        {['All', 'Approved', 'Rejected'].map(st => (
                          <button
                            key={st}
                            onClick={() => setHistoryStatusFilter(st as any)}
                            className={`flex-1 py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${historyStatusFilter === st ? 'bg-sky-500 text-white border-sky-400/30 shadow-lg' : 'bg-slate-950/60 text-slate-300 border-white/15 hover:bg-white/10'}`}
                          >
                            {st === 'All' ? 'Semua' : st === 'Approved' ? '✓ Approved' : '✕ Rejected'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
                          <th className="py-4 px-6">Kode & Tanggal</th>
                          <th className="py-4 px-6">Departemen / Pemohon</th>
                          <th className="py-4 px-6">Total Anggaran</th>
                          <th className="py-4 px-6">Status Keputusan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs">
                        {filteredHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-slate-400 italic">Tidak ada catatan histori pesanan.</td>
                          </tr>
                        ) : (
                          filteredHistory.map(item => {
                            const statusStr = item.status?.toLowerCase() || '';
                            const isRej = statusStr.includes('ditolak');

                            return (
                              <tr key={item.id} className="hover:bg-white/5 transition">
                                <td className="py-4 px-6">
                                  <span className="font-mono font-bold text-sky-400 block">{item.order_code}</span>
                                  <span className="text-[11px] text-slate-400">{item.date}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="font-bold text-white block">{item.department}</span>
                                  <span className="text-[11px] text-slate-300">Oleh: {item.requester}</span>
                                </td>
                                <td className="py-4 px-6 font-mono font-bold text-emerald-400">{formatRupiah(item.total_cost)}</td>
                                <td className="py-4 px-6">
                                  <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                                    isRej ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-8 space-y-6 text-white shadow-2xl">
              <h3 className="font-black text-base">Input ATK Baru</h3>
              <form onSubmit={handleSaveAtk} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Barang *</label>
                  <input type="text" value={form.item_name} onChange={(e) => setForm({...form, item_name: e.target.value})} className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Stok Awal</label>
                    <input type="number" min={0} value={form.stock_quantity} onChange={(e) => setForm({...form, stock_quantity: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Harga Satuan (Rp)</label>
                    <input type="number" min={0} value={form.unit_price} onChange={(e) => setForm({...form, unit_price: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-2xl text-xs bg-white/10">Batal</button>
                  <button type="submit" className="px-5 py-2.5 rounded-2xl text-xs bg-sky-500 font-bold">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}