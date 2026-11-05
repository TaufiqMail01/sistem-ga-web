'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GLOBAL_CONFIG } from '@/lib/config';
import { createClient } from '@/lib/supabase';

interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: string;
  status: string;
  flaw: string;
}

export default function ProfessionalGuidePage() {
  const supabase = createClient();
  
  const [buildingCount, setBuildingCount] = useState<number>(0);
  const [motorCount, setMotorCount] = useState<number>(0);
  const [carCount, setCarCount] = useState<number>(0);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [syncAnimation, setSyncAnimation] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');

  const fetchRealDatabaseData = async () => {
    setSyncAnimation(true);
    try {
      // 1. Hitung jumlah Gedung / Ruangan / Fasilitas dari tabel meeting_rooms
      const { count: roomsTotal } = await supabase.from('meeting_rooms').select('*', { count: 'exact', head: true });
      if (roomsTotal !== null) setBuildingCount(roomsTotal);

      // 2. Hitung jumlah Motor dari tabel vehicles_v2 (berdasarkan tipe/kategori motor)
      const { count: motors } = await supabase.from('vehicles_v2').select('*', { count: 'exact', head: true }).ilike('type', '%motor%');
      if (motors !== null) {
        setMotorCount(motors);
      } else {
        const { count: allVehicles } = await supabase.from('vehicles_v2').select('*', { count: 'exact', head: true });
        setMotorCount(allVehicles ? Math.ceil(allVehicles / 2) : 0);
      }

      // 3. Hitung jumlah Mobil dari tabel vehicles_v2 (berdasarkan tipe/kategori mobil)
      const { count: cars } = await supabase.from('vehicles_v2').select('*', { count: 'exact', head: true }).ilike('type', '%mobil%');
      if (cars !== null) {
        setCarCount(cars);
      } else {
        const { count: allVehicles } = await supabase.from('vehicles_v2').select('*', { count: 'exact', head: true });
        setCarCount(allVehicles ? Math.floor(allVehicles / 2) : 0);
      }

      // 4. Ambil data detail ruangan meeting
      const { data: rooms, error } = await supabase.from('meeting_rooms').select('*');
      if (!error && rooms && rooms.length > 0) {
        setMeetingRooms(rooms);
      }
    } catch (err) {
      console.error('Sinkronisasi database gagal:', err);
    } finally {
      setTimeout(() => setSyncAnimation(false), 800);
    }
  };

  useEffect(() => {
    const updateLiveDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setCurrentDateString(now.toLocaleDateString('id-ID', options));
    };

    updateLiveDate();
    const dateInterval = setInterval(updateLiveDate, 1000);

    fetchRealDatabaseData();
    const dbInterval = setInterval(fetchRealDatabaseData, 10000);

    return () => {
      clearInterval(dateInterval);
      clearInterval(dbInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* HEADER NAVBAR */}
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            {GLOBAL_CONFIG.logoType === 'image' ? (
              <img src={GLOBAL_CONFIG.logoImage} alt="Logo" className="h-10 w-auto object-contain bg-white/10 p-1.5 rounded-2xl border border-white/20 shadow-inner" />
            ) : (
              <div className="bg-sky-500/25 text-sky-300 border border-sky-500/30 font-black px-3.5 py-2 rounded-2xl text-sm tracking-wider shadow-md">
                {GLOBAL_CONFIG.logoText}
              </div>
            )}
            <div>
              <span className="text-lg font-black text-white tracking-tight block">{GLOBAL_CONFIG.companyName}</span>
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">{GLOBAL_CONFIG.departmentName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-xs font-bold text-slate-300 hover:text-white transition px-4 py-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10"
            >
              🔒 LOGIN
            </Link>
            <Link 
              href="/signup" 
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition shadow-lg shadow-sky-500/25 border border-sky-400/30"
            >
              MENDAFTAR
            </Link>
          </div>
        </div>
      </header>

      {/* SPLIT SCREEN / 2 WINDOW LAYOUT */}
      <main className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10 my-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* WINDOW KIRI: KONTEN TEKS & INFORMASI UMUM + LIVE CLOCK */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest shadow-inner">
              <span>⏰</span> {currentDateString || 'Memuat Waktu Real-Time...'}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Pusat Kendali Operasional & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">General Affairs</span>
            </h1>

            <p className="text-slate-300 text-base leading-relaxed font-medium">
              Platform modern <strong className="text-white">{GLOBAL_CONFIG.companyName}</strong> untuk mengelola fasilitas gedung, armada motor & mobil perusahaan, serta ketersediaan ruang rapat secara terpusat berdasarkan data aktual yang terus diperbarui.
            </p>

            {/* 3 KOTAK: GEDUNG, MOTOR, MOBIL */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/60 border border-white/10 p-3 rounded-xl text-center">
                <div className="text-xs font-black text-sky-400 font-mono">{buildingCount} Unit</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Gedung / Fasilitas</div>
              </div>
              <div className="bg-slate-900/60 border border-white/10 p-3 rounded-xl text-center">
                <div className="text-xs font-black text-sky-400 font-mono">{motorCount} Unit</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Motor</div>
              </div>
              <div className="bg-slate-900/60 border border-white/10 p-3 rounded-xl text-center">
                <div className="text-xs font-black text-sky-400 font-mono">{carCount} Unit</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">Mobil</div>
              </div>
            </div>
          </div>

          {/* WINDOW KANAN: KOTAK RUANGAN MEETING DARI DATABASE */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              
              {/* WINDOW HEADER BAR */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${syncAnimation ? 'bg-amber-400' : 'bg-emerald-400'} transition-colors`} />
                  database://meeting_rooms
                </div>
              </div>

              {/* GRID RUANGAN MEETING DARI SUPABASE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {meetingRooms.length > 0 ? (
                  meetingRooms.map((room) => (
                    <div key={room.id} className="bg-slate-950/70 border border-white/10 p-3.5 rounded-2xl space-y-2 flex flex-col justify-between hover:border-sky-500/40 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white text-xs block">{room.name}</span>
                          <span className="text-[10px] text-slate-400">{room.floor} • {room.capacity}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          room.status === 'Tersedia' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {room.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                        <span className="font-bold">Kekurangan:</span> {room.flaw}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center text-xs text-slate-400 italic">
                    Memuat data ruangan meeting dari database...
                  </div>
                )}
              </div>

              {/* WINDOW FOOTER BAR */}
              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Total: {meetingRooms.length} Ruangan Terdaftar</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <span className={`w-2 h-2 rounded-full ${syncAnimation ? 'bg-amber-400 scale-125' : 'bg-emerald-400'} transition-all`} />
                  {syncAnimation ? 'Syncing DB...' : 'Live DB Sync'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-900/60 backdrop-blur-xl mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-lg font-bold text-xs">Secure</div>
            <span className="text-xs text-slate-400">{GLOBAL_CONFIG.companyName} © 2026 - All Rights Reserved</span>
          </div>
        </div>
      </footer>

    </div>
  );
}