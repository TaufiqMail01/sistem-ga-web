'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';

type ActivityItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
};

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  
  const [stats, setStats] = useState({
    totalAssets: 0,
    hardwareCount: 0,
    furnitureCount: 0,
    otherAssetCount: 0,
    totalProcurements: 0,
    pendingProcurement: 0,
    completedProcurement: 0,
    totalVehicles: 0,
    activeTaxVehicles: 0,
    totalVendors: 0,
    activeVendors: 0,
    totalMutations: 0,
    pendingMutations: 0,
    completedMutations: 0,
    goodConditionCount: 0,
    maintenanceCount: 0,
    totalAssetValue: 0,
    buildingCount: 0,
    motorCount: 0,
    carCount: 0,
    emptyRoomsCount: 0,
    bookedRoomsCount: 0,
  });

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

const fetchDashboardData = async () => {
    setLoading(true);
    
    const [inventoryRes, transactionsRes, vehiclesRes, roomsRes, bookingsRes] = await Promise.all([
      supabase.from('atk_inventory_v2').select('*'),
      // KECUALIKAN STATUS YANG DITOLAK MENGGUNAKAN .not() atau .neq()
      supabase.from('atk_transactions_v2').select('*').not('status', 'ilike', '%Ditolak%').order('created_at', { ascending: false }),
      supabase.from('vehicles_v2').select('*'),
      supabase.from('room_options').select('*'),
      supabase.from('room_bookings').select('*').eq('status', 'Disetujui / Terjadwal'),
    ]);

    const inventoryData = inventoryRes.data || [];
    const transactionsData = transactionsRes.data || []; // Data ini sekarang sudah bersih dari status Ditolak!
    const vehiclesData = vehiclesRes.data || [];
    const roomsData = roomsRes.data || [];
    const bookingsData = bookingsRes.data || [];

    const paperCount = inventoryData.filter(a => a.category?.toLowerCase().includes('kertas') || a.category?.toLowerCase().includes('paper')).length;
    const writingCount = inventoryData.filter(a => a.category?.toLowerCase().includes('tulis') || a.category?.toLowerCase().includes('writing')).length;
    const otherCount = inventoryData.length - (paperCount + writingCount);

    const lowStockCount = inventoryData.filter(a => a.stock_quantity <= a.minimum_stock).length;
    const normalStockCount = inventoryData.length - lowStockCount;

    const pendingProc = transactionsData.filter(p => p.status?.toLowerCase().includes('menunggu') || p.status?.toLowerCase().includes('pending')).length;
    const compProc = transactionsData.filter(p => p.status?.toLowerCase().includes('selesai') || p.status?.toLowerCase().includes('disetujui')).length;

    const totalVal = inventoryData.reduce((acc, curr) => {
      return acc + (Number(curr.stock_quantity || 0) * Number(curr.unit_price || 0));
    }, 0);

    // Hitung Motor dan Mobil dari vehicles_v2
    const motors = vehiclesData.filter(v => v.type?.toLowerCase().includes('motor') || v.category?.toLowerCase().includes('motor')).length;
    const cars = vehiclesData.filter(v => v.type?.toLowerCase().includes('mobil') || v.category?.toLowerCase().includes('mobil') || v.type?.toLowerCase().includes('car')).length;

    // Hitung Ruangan Kosong dan Terjadwal Hari Ini
    const todayStr = new Date().toISOString().split('T')[0];
    const totalRooms = roomsData.length;
    const bookedRoomNames = new Set(
      bookingsData
        .filter(b => b.booking_date === todayStr)
        .map(b => b.room_name)
    );
    const bookedRooms = bookedRoomNames.size;
    const emptyRooms = Math.max(0, totalRooms - bookedRooms);

    setStats({
      totalAssets: inventoryData.length,
      hardwareCount: paperCount,
      furnitureCount: writingCount,
      otherAssetCount: otherCount,
      totalProcurements: transactionsData.length,
      pendingProcurement: pendingProc,
      completedProcurement: compProc,
      totalVehicles: vehiclesData.length,
      activeTaxVehicles: vehiclesData.length,
      totalVendors: 0,
      activeVendors: 0,
      totalMutations: transactionsData.length,
      pendingMutations: pendingProc,
      completedMutations: compProc,
      goodConditionCount: normalStockCount,
      maintenanceCount: lowStockCount,
      totalAssetValue: totalVal,
      buildingCount: totalRooms,
      motorCount: motors,
      carCount: cars,
      emptyRoomsCount: emptyRooms,
      bookedRoomsCount: bookedRooms,
    });

    const formattedActivities: ActivityItem[] = transactionsData.slice(0, 5).map(t => ({
      id: t.id,
      title: `Pesanan ATK: ${t.order_code} (${t.department})`,
      category: 'Pengadaan ATK',
      date: t.date || t.created_at?.split('T')[0] || 'Hari ini',
      status: t.status || 'Menunggu',
    }));

    setRecentActivities(formattedActivities);
    setLoading(false);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

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
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarHidden(!isSidebarHidden)} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-2">
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-base">Overview & Statistik Operasional Kantor</h1>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-1.5 rounded-full backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold text-emerald-300">Live Database Connected</span>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-8 pb-16">
            
            {/* TOP SUMMARY BAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Ruangan Rapat Hari Ini</span>
                  <div className="flex gap-1.5">
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] px-2.5 py-1 rounded-full">🟢 {stats.emptyRoomsCount} Kosong</span>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-[10px] px-2.5 py-1 rounded-full">🔴 {stats.bookedRoomsCount} Dipesan</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Gedung, Motor & Mobil</h3>
                  <p className="text-xs text-slate-300 mt-1">Fasilitas gedung kantor serta armada kendaraan operasional aktif.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-white/10">
                    <span className="text-xs font-black text-sky-400 block">{stats.buildingCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Gedung / Ruang</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-white/10">
                    <span className="text-xs font-black text-sky-400 block">{stats.motorCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Motor</span>
                  </div>
                  <div className="bg-slate-950/50 p-2 rounded-xl border border-white/10">
                    <span className="text-xs font-black text-sky-400 block">{stats.carCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase">Mobil</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Item ATK Terdaftar</span>
                  <span className="text-emerald-400 font-bold text-xs">↑ 100% Valid</span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{loading ? '...' : stats.totalAssets} <span className="text-sm font-semibold text-slate-400">Jenis Item</span></h3>
                  <p className="text-xs text-slate-300 mt-1">Seluruh inventaris aktif terpantau di gudang.</p>
                </div>
                <div className="text-[11px] font-bold text-sky-400">
                  <Link href="/dashboard/procurement" className="hover:underline">Buka Panel Pengadaan & Stok →</Link>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valuasi Total Stok Gudang</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] px-3 py-1 rounded-full">Aset ATK</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white font-mono">{loading ? '...' : formatRupiah(stats.totalAssetValue)}</h3>
                  <p className="text-xs text-slate-300 mt-1">Akumulasi nilai seluruh stok fisik saat ini.</p>
                </div>
                <div className="text-[11px] font-bold text-emerald-400">Terupdate Real-Time</div>
              </div>

            </div>

            {/* GRID KARTU METRIK UTAMA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori Barang Gudang</p>
                    <h3 className="text-3xl font-black text-white mt-1">{loading ? '...' : stats.totalAssets} <span className="text-emerald-400 text-sm font-bold">Item</span></h3>
                  </div>
                  <div className="bg-sky-500/20 text-sky-400 p-3 rounded-2xl text-xl border border-sky-500/30">📦</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Kertas & Pencetakan</span>
                    <span className="font-bold text-white">{stats.hardwareCount} Item</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Alat Tulis & Kantor</span>
                    <span className="font-bold text-white">{stats.furnitureCount} Item</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Arsip, Tinta & General</span>
                    <span className="font-bold text-white">{stats.otherAssetCount} Item</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pengadaan & Permintaan</p>
                    <h3 className="text-3xl font-black text-white mt-1">{loading ? '...' : stats.totalProcurements} <span className="text-indigo-400 text-sm font-bold">Pesanan</span></h3>
                  </div>
                  <div className="bg-indigo-500/20 text-indigo-300 p-3 rounded-2xl text-xl border border-indigo-500/30">🛒</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Selesai / Diproses</span>
                    <span className="font-bold text-emerald-400">{stats.completedProcurement} Pesanan</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Menunggu Review / Approval</span>
                    <span className="font-bold text-amber-400">{stats.pendingProcurement} Pesanan</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Permintaan Masuk</span>
                    <span className="font-bold text-white">{stats.totalProcurements} Pesanan</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kendaraan & Fasilitas</p>
                    <h3 className="text-3xl font-black text-white mt-1">{stats.totalVehicles + stats.buildingCount} <span className="text-amber-400 text-sm font-bold">Total Unit</span></h3>
                  </div>
                  <div className="bg-amber-500/20 text-amber-300 p-3 rounded-2xl text-xl border border-amber-500/30">🚗</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Motor Operasional</span>
                    <span className="font-bold text-emerald-400">{stats.motorCount} Unit</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Mobil Operasional</span>
                    <span className="font-bold text-emerald-400">{stats.carCount} Unit</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gedung / Ruangan</span>
                    <span className="font-bold text-white">{stats.buildingCount} Unit</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histori Permintaan ATK</p>
                    <h3 className="text-3xl font-black text-white mt-1">{loading ? '...' : stats.totalMutations} <span className="text-emerald-400 text-sm font-bold">Catatan</span></h3>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-2xl text-xl border border-emerald-500/30">🔄</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Disetujui (Selesai)</span>
                    <span className="font-bold text-emerald-400">{stats.completedMutations}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Menunggu Persetujuan</span>
                    <span className="font-bold text-amber-400">{stats.pendingMutations}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Mutasi / Transaksi</span>
                    <span className="font-bold text-white">{stats.totalMutations}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Stok Gudang</p>
                    <h3 className="text-3xl font-black text-white mt-1">{loading ? '...' : stats.goodConditionCount} <span className="text-sky-400 text-sm font-bold">Aman</span></h3>
                  </div>
                  <div className="bg-sky-500/20 text-sky-400 p-3 rounded-2xl text-xl border border-sky-500/30">🛠️</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Stok Aman / Normal</span>
                    <span className="font-bold text-emerald-400">{stats.goodConditionCount} Item</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Stok Menipis / Perlu Restock</span>
                    <span className="font-bold text-rose-400">{stats.maintenanceCount} Item</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Persentase Kesiapan Stok</span>
                    <span className="font-bold text-white">
                      {stats.totalAssets > 0 ? Math.round((stats.goodConditionCount / stats.totalAssets) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direktori Vendor & Mitra</p>
                    <h3 className="text-3xl font-black text-white mt-1">{stats.totalVendors} <span className="text-purple-400 text-sm font-bold">Mitra</span></h3>
                  </div>
                  <div className="bg-purple-500/20 text-purple-300 p-3 rounded-2xl text-xl border border-purple-500/30">🤝</div>
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Kerjasama Aktif</span>
                    <span className="font-bold text-emerald-400">{stats.activeVendors} Vendor</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Inaktif / Putus Kontrak</span>
                    <span className="font-bold text-rose-400">0 Vendor</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Rekanan</span>
                    <span className="font-bold text-white">{stats.totalVendors} Vendor</span>
                  </div>
                </div>
              </div>

            </div>

            {/* TABEL LOG AKTIVITAS TERBARU */}
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-white text-sm uppercase">Log Aktivitas & Permintaan Terbaru</h3>
                  <p className="text-xs text-slate-300 mt-1">Daftar transaksi dan pengadaan ATK terakhir yang tercatat dalam sistem.</p>
                </div>
                <Link href="/dashboard/procurement" className="text-xs font-bold text-sky-400 hover:underline">Kelola Pengadaan →</Link>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Keterangan Pesanan</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {loading ? (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-400 italic">Memuat log aktivitas...</td></tr>
                    ) : recentActivities.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-slate-400 italic">Belum ada aktivitas tercatat.</td></tr>
                    ) : (
                      recentActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6 font-bold text-white">{act.title}</td>
                          <td className="py-4 px-6 text-slate-300 font-semibold">{act.category}</td>
                          <td className="py-4 px-6 text-slate-400 font-mono">{act.date}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase inline-block tracking-wider ${act.status?.includes('Selesai') || act.status?.includes('Disetujui') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                              {act.status}
                            </span>
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
      </div>
    </>
  );
}