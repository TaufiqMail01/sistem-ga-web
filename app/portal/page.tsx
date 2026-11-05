'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Search, PackageX, CheckCircle2, User, Building, Trash2, Info, Filter, LogOut, ShieldCheck, Mail, ThumbsUp, ThumbsDown, Calendar, Download, RefreshCw, FileText } from 'lucide-react';
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

type CartItem = AtkItem & {
  qtyRequested: number;
  collectifNames: string;
};

type OrderHistory = {
  id: string;
  order_code: string;
  department: string;
  requester: string;
  items: string;
  total_cost: number;
  date: string;
  status: string;
};

export default function UserPortalPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');
  const [atkList, setAtkList] = useState<AtkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [department, setDepartment] = useState('');
  const [mainRequester, setMainRequester] = useState('');
  const [businessManagerEmail, setBusinessManagerEmail] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialRequestText, setSpecialRequestText] = useState('');
  const [historyList, setHistoryList] = useState<OrderHistory[]>([]);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');
  
  // FILTER & PENCARIAN RIWAYAT LANJUTAN
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Approved' | 'Rejected'>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');

  const [currentUser, setCurrentUser] = useState<{ email: string; fullName: string; role: string; department: string; businessManagerEmail: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchUserData();
    fetchCatalog();
    fetchUserHistory();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const email = session.user.email || '';
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const fullName = profile?.full_name || 'Karyawan';
      const role = profile?.role || 'Staff';
      const userArea = profile?.area || '-';
      const mgrEmail = profile?.business_manager_email || '';

      setCurrentUser({ email, fullName, role, department: userArea, businessManagerEmail: mgrEmail });
      
      setMainRequester(fullName);
      setDepartment(userArea);
      setBusinessManagerEmail(mgrEmail);
    }
  };

  const fetchCatalog = async () => {
    const { data } = await supabase.from('atk_inventory_v2').select('*').order('item_name', { ascending: true });
    if (data) setAtkList(data);
  };

  const fetchUserHistory = async () => {
    const { data } = await supabase.from('atk_transactions_v2').select('*').order('created_at', { ascending: false });
    if (data) setHistoryList(data);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getHelperDescription = (itemName: string) => {
    const name = itemName.toLowerCase();
    if (name.includes('105') || name.includes('15 mm') || name.includes('xs')) return '💡 Ukuran Sangat Kecil (XS): Ideal untuk menjepit 1 - 15 lembar kertas.';
    if (name.includes('107') || name.includes('19 mm') || name.includes('s')) return '💡 Ukuran Kecil (S): Cocok untuk laporan harian tipis.';
    if (name.includes('111') || name.includes('25 mm') || name.includes('m')) return '💡 Ukuran Standar Kantor (M): Ideal untuk bundel dokumen harian.';
    if (name.includes('155') || name.includes('32 mm') || name.includes('l')) return '💡 Ukuran Besar (L): Mampu menampung bundel dokumen tebal.';
    if (name.includes('260') || name.includes('51 mm') || name.includes('xl')) return '💡 Ukuran Jumbo (XL): Untuk arsip laporan keuangan tebal.';
    if (name.includes('hvs') || name.includes('paper one')) return '📄 Kertas cetak standar perkantoran kualitas tinggi.';
    return '✨ Barang operasional rutin kantor siap pakai.';
  };

  const addToCart = (item: AtkItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (!existing) {
      setCart([...cart, { ...item, qtyRequested: 1, collectifNames: mainRequester }]);
    }
  };

  const updateCartQty = (id: string, qty: number) => {
    const target = atkList.find(a => a.id === id);
    if (target && qty > target.stock_quantity && target.stock_quantity > 0) {
      alert('Jumlah melebihi stok gudang yang tersedia!');
      return;
    }
    setCart(cart.map(c => c.id === id ? { ...c, qtyRequested: Math.max(1, qty) } : c));
  };

  const updateCollectifNames = (id: string, names: string) => {
    setCart(cart.map(c => c.id === id ? { ...c, collectifNames: names } : c));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const handleCheckoutOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainRequester.trim()) {
      alert('Mohon isi nama penanggung jawab / pembuat pesanan!');
      return;
    }
    if (cart.length === 0 && !specialRequestText.trim()) {
      alert('Keranjang belanja dan permintaan spesial masih kosong!');
      return;
    }
    if (!businessManagerEmail.trim()) {
      alert('Email Business Manager belum terdeteksi dari akun Anda.');
      return;
    }

    const totalCostSum = cart.reduce((acc, curr) => acc + (curr.qtyRequested * curr.unit_price), 0);
    const totalQtySum = cart.reduce((acc, curr) => acc + curr.qtyRequested, 0);
    const generatedCode = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      order_code: generatedCode,
      department: department,
      requester: mainRequester,
      manager_email: businessManagerEmail,
      items: JSON.stringify(cart.map(c => ({
        item_name: c.item_name,
        qty: c.qtyRequested,
        unit: c.unit,
        unit_price: c.unit_price,
        subtotal: c.qtyRequested * c.unit_price,
        collectifNames: c.collectifNames || '-'
      }))),
      special_note: specialRequestText || '-',
      total_items: totalQtySum,
      total_cost: totalCostSum,
      date: new Date().toISOString().split('T')[0],
      status: 'Menunggu Approval Manager'
    };

    const { data, error } = await supabase.from('atk_transactions_v2').insert([newOrder]).select();

    if (error) {
      alert('Gagal mengirim pesanan: ' + error.message);
    } else {
      if (data && data.length > 0) {
        setLastSubmittedId(data[0].id);
      }
      setIsSuccessModal(true);
      setCart([]);
      setSpecialRequestText('');
      fetchUserHistory();
    }
  };

  const exportHistoryToExcel = () => {
    const excelData = filteredHistory.map((item, idx) => ({
      No: idx + 1,
      'Kode Pesanan': item.order_code,
      Tanggal: item.date,
      Departemen: item.department,
      Pemohon: item.requester,
      'Total Biaya': item.total_cost,
      Status: item.status
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Pesanan');
    XLSX.writeFile(wb, `Riwayat_Pesanan_ATK_${selectedMonth}.xlsx`);
  };

  const categoriesList = [
    'All',
    'Kertas & Produk Kertas',
    'Alat Tulis & Koreksi',
    'Peralatan Arsip & Meja',
    'Tinta & Toner Printer',
    'Perekat, Pengikat & Penjilidan',
    'Kebersihan & Sanitasi Kantor',
    'Elektronik & Aksesoris Kantor',
    'Keamanan & Identitas'
  ];

  const filteredCatalog = atkList.filter(item => {
    const matchSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  // FILTER & PENCARIAN RIWAYAT LANJUTAN
  const filteredHistory = historyList.filter(trx => {
    const statusLower = trx.status?.toLowerCase() || '';
    const isItemRejected = statusLower.includes('ditolak');
    const isItemApproved = statusLower.includes('disetujui') || statusLower.includes('selesai');

    if (historyStatusFilter === 'Approved' && !isItemApproved) return false;
    if (historyStatusFilter === 'Rejected' && !isItemRejected) return false;

    if (selectedMonth !== 'All') {
      const itemDateStr = trx.date || '';
      if (!itemDateStr.startsWith(selectedMonth)) return false;
    }

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchCode = trx.order_code?.toLowerCase().includes(q);
      const matchDept = trx.department?.toLowerCase().includes(q);
      const matchReq = trx.requester?.toLowerCase().includes(q);
      if (!matchCode && !matchDept && !matchReq) return false;
    }

    return true;
  });

  // Statistik Ringkas Riwayat
  const totalHistoryCount = historyList.length;
  const approvedCount = historyList.filter(t => (t.status?.toLowerCase() || '').includes('disetujui') || (t.status?.toLowerCase() || '').includes('selesai')).length;
  const rejectedCount = historyList.filter(t => (t.status?.toLowerCase() || '').includes('ditolak')).length;

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 space-y-6 relative overflow-hidden">
      
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

      <div className="absolute inset-0 animated-bg -z-10 fixed" />

      <div className="max-w-7xl mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/15 rounded-3xl p-6 md:p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-3 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
              Portal Karyawan & Unit Kerja
            </span>
            {currentUser && (
              <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentUser.fullName}</span>
                <span className="opacity-80">({currentUser.role})</span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">Katalog & Permintaan ATK Kantor</h1>
            <p className="text-xs text-slate-200 max-w-xl leading-relaxed mt-1">
              Cek ketersediaan stok real-time, gunakan panduan spesifikasi produk, dan ajukan pesanan kolektif antar staf dengan mudah.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 gap-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'catalog' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
            >
              🛒 Katalog & Keranjang
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'history' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-200 hover:bg-white/10'}`}
            >
              📋 Riwayat Pesanan
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="bg-rose-600/90 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer border border-rose-400/30 backdrop-blur-md"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 md:p-5 rounded-3xl shadow-xl text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">Pencarian:</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Cari nama barang atau SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-white/15 rounded-2xl text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-sky-400" />
                    <label className="text-[11px] font-bold text-slate-300">Filter Kategori:</label>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-2.5 text-xs font-bold text-white focus:outline-sky-400 transition cursor-pointer"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">
                        {cat === 'All' ? '📂 Semua Kategori' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-[680px] overflow-y-auto pr-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCatalog.map(item => {
                  const isOutOfStock = item.stock_quantity <= 0;
                  const isInCart = cart.some(c => c.id === item.id);
                  const helperText = getHelperDescription(item.item_name);

                  return (
                    <div key={item.id} className={`bg-slate-900/70 backdrop-blur-xl rounded-3xl border p-4 shadow-xl flex flex-col justify-between transition group ${isOutOfStock ? 'border-amber-500/30 bg-amber-950/20' : 'border-white/10 hover:border-sky-400/50'}`}>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/10">
                            {item.category}
                          </span>
                          <span className="font-mono font-black text-emerald-400 text-xs md:text-sm">
                            {formatRupiah(item.unit_price)}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-black text-white text-xs md:text-sm group-hover:text-sky-300 transition leading-snug">
                            {item.item_name}
                          </h3>
                          <span className="font-mono text-[10px] text-sky-400 font-bold block mt-0.5">SKU: {item.sku}</span>
                        </div>

                        <div className="bg-sky-950/40 border border-sky-500/20 rounded-2xl p-2.5 text-[10px] text-sky-200 font-medium flex items-start gap-1.5">
                          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{helperText}</span>
                        </div>

                        <div>
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                              <PackageX className="w-3 h-3" /> Stok Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px]">
                              ✓ Stok: <strong>{item.stock_quantity} {item.unit}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/10">
                        {isOutOfStock ? (
                          <p className="text-[10px] text-slate-400 italic">Barang kosong, tulis di catatan.</p>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={isInCart}
                            className={`w-full py-2.5 rounded-2xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${isInCart ? 'bg-white/10 text-slate-400 cursor-not-allowed border border-white/5' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> 
                            {isInCart ? '✓ Sudah di Keranjang' : '+ Pilih / Masukkan Keranjang'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-5 md:p-6 shadow-2xl h-fit space-y-5 sticky top-6 text-white">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Keranjang Pesanan Unit</h2>
                <p className="text-[11px] text-slate-400">Atur jumlah & pemesan kolektif</p>
              </div>
            </div>

            <form onSubmit={handleCheckoutOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-sky-400" /> Area / Departemen (Auto-Detect)
                </label>
                <input 
                  type="text"
                  disabled
                  value={department}
                  className="w-full bg-slate-950/80 border border-white/15 rounded-2xl px-3 py-2.5 text-xs font-bold text-sky-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-sky-400" /> Penanggung Jawab / Pemohon (Auto-Detect)
                </label>
                <input 
                  type="text"
                  disabled
                  value={mainRequester}
                  className="w-full bg-slate-950/80 border border-white/15 rounded-2xl px-3 py-2.5 text-xs font-bold text-sky-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email Business Manager (Tujuan Approval)
                </label>
                <input 
                  type="text"
                  disabled
                  value={businessManagerEmail || 'Belum diatur'}
                  className="w-full bg-slate-950/80 border border-emerald-500/30 rounded-2xl px-3 py-2.5 text-xs font-bold text-emerald-300 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Daftar Item Dipilih:</span>
                
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {cart.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-5 text-center bg-slate-950/30 rounded-2xl border border-dashed border-white/10">
                      Belum ada item dipilih dari katalog.
                    </p>
                  ) : (
                    cart.map(c => (
                      <div key={c.id} className="bg-slate-950/40 border border-white/10 rounded-2xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white block">{c.item_name}</span>
                            <span className="font-mono text-[10px] text-emerald-400 font-bold">{formatRupiah(c.unit_price * c.qtyRequested)}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFromCart(c.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Jumlah ({c.unit})</label>
                            <input 
                              type="number"
                              min={1}
                              max={c.stock_quantity}
                              value={c.qtyRequested}
                              onChange={(e) => updateCartQty(c.id, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1 text-center font-bold font-mono text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Pemesan (Kolektif)</label>
                            <input 
                              type="text"
                              placeholder="Cth: Siska, Rian"
                              value={c.collectifNames}
                              onChange={(e) => updateCollectifNames(c.id, e.target.value)}
                              className="w-full bg-slate-900 border border-white/15 rounded-xl px-2.5 py-1 text-xs font-medium text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">Catatan / Permintaan Spesial Barang Kosong:</label>
                <textarea 
                  rows={2}
                  placeholder="Tuliskan catatan khusus jika diperlukan..."
                  value={specialRequestText}
                  onChange={(e) => setSpecialRequestText(e.target.value)}
                  className="w-full bg-amber-950/20 border border-amber-500/30 rounded-2xl p-2.5 text-xs text-white placeholder-amber-200/50 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950/50 rounded-2xl p-3.5 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>Total Kuantitas:</span>
                  <span>{cart.reduce((a, b) => a + b.qtyRequested, 0)} Pcs</span>
                </div>
                <div className="flex justify-between font-black text-white pt-1.5 border-t border-white/10">
                  <span>Estimasi Biaya:</span>
                  <span className="text-emerald-400 font-mono text-sm">
                    {formatRupiah(cart.reduce((a, b) => a + (b.qtyRequested * b.unit_price), 0))}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <span>✓ Ajukan Permintaan ATK (Kirim ke Manager) 🚀</span>
              </button>
            </form>
          </div>

        </div>
      ) : (
        <div className="max-w-7xl mx-auto bg-slate-900/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-4 gap-4">
            <div>
              <h2 className="text-base font-black text-white">Riwayat Pengajuan Pesanan Karyawan</h2>
              <p className="text-xs text-slate-400">Daftar permintaan ATK beserta status verifikasi (Accepted / Rejected)</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button 
                onClick={exportHistoryToExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-400/30 shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button 
                onClick={fetchUserHistory}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-white/15 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang
              </button>
            </div>
          </div>

          {/* STATISTIK RINGKAS (BADGE SUMMARY) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengajuan</span>
                <span className="text-lg font-black text-white">{totalHistoryCount}</span>
              </div>
              <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-950/50 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Disetujui (Approved)</span>
                <span className="text-lg font-black text-emerald-300">{approvedCount}</span>
              </div>
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ThumbsUp className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-950/50 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Ditolak (Rejected)</span>
                <span className="text-lg font-black text-rose-300">{rejectedCount}</span>
              </div>
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <ThumbsDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* KONTROL PENCARIAN & FILTER YANG SUPER RAPI & SIMPLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/10 items-center">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari kode / pemohon..." 
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-slate-400 focus:outline-sky-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value || 'All')}
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-sky-400 cursor-pointer"
              />
            </div>

            <div className="flex gap-1.5 w-full">
              {['All', 'Approved', 'Rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setHistoryStatusFilter(st as any)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${historyStatusFilter === st ? 'bg-sky-500 text-white border-sky-400/30 shadow-md' : 'bg-slate-900 text-slate-300 border-white/15 hover:bg-white/10'}`}
                >
                  {st === 'All' ? 'Semua' : st === 'Approved' ? '✓ Approved' : '✕ Rejected'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <p className="text-center py-12 text-slate-400 italic text-xs">Tidak ada riwayat pesanan yang sesuai dengan filter.</p>
            ) : (
              filteredHistory.map(trx => {
                const parsedItems = JSON.parse(trx.items || '[]');
                const statusStr = trx.status?.toLowerCase() || '';
                const isRejected = statusStr.includes('ditolak');
                const isAccepted = statusStr.includes('disetujui') || statusStr.includes('selesai');

                return (
                  <div key={trx.id} className="border border-white/10 rounded-3xl p-5 bg-slate-950/40 space-y-3 shadow-md relative overflow-hidden">
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-white/10 pb-3">
                      <div>
                        <span className="font-mono text-xs font-extrabold text-sky-400 block">{trx.order_code}</span>
                        <span className="text-[11px] text-slate-400 font-semibold">Tanggal: {trx.date} | Departemen/Area: <strong className="text-white">{trx.department}</strong></span>
                      </div>
                      <div className="text-right space-y-1 flex items-center gap-3">
                        <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 border ${
                          isRejected 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                            : isAccepted 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {isRejected ? <ThumbsDown className="w-3 h-3" /> : isAccepted ? <ThumbsUp className="w-3 h-3" /> : null}
                          {trx.status || 'Menunggu Approval Manager'}
                        </span>
                        
                        <Link
                          href={`/approval/${trx.id}`}
                          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition border border-white/10 inline-block"
                        >
                          👁️ Lihat Stempel
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rincian Barang & Pemesan Kolektif:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {parsedItems.map((it: any, idx: number) => (
                          <div key={idx} className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 text-xs flex justify-between items-center shadow-xs">
                            <div>
                              <span className="font-bold text-white block">{it.item_name} ({it.qty} {it.unit})</span>
                              <span className="text-[10px] text-slate-400">Pemesan: <strong className="text-sky-300">{it.collectifNames}</strong></span>
                            </div>
                            <span className="font-mono text-slate-300 font-bold">{formatRupiah(it.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {isSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl text-white">
            <div className="w-16 h-16 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-3xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-white">Pengajuan Berhasil Dikirim ke Manager!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pesanan kolektif Anda otomatis terkirim ke email Business Manager <strong>{businessManagerEmail}</strong> dan masuk ke tahap <strong>Menunggu Approval Manager</strong>.
              </p>
              {lastSubmittedId && (
                <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[10px] text-sky-400 select-all border border-white/10 break-all">
                  {window.location.origin}/approval/{lastSubmittedId}
                </div>
              )}
            </div>
            <button
              onClick={() => { setIsSuccessModal(false); setActiveTab('history'); }}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg border border-sky-400/30"
            >
              Cek Riwayat Pesanan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}