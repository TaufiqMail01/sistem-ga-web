'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase';
import { Calendar, Clock, Building2, Users, Plus, CheckCircle2, Monitor, Coffee, Volume2, Download, Search, Filter, Layers, ShieldCheck, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

type RoomOption = {
  id: string;
  name: string;
  capacity: number;
  facility_note: string;
  location?: string;
  floor?: string;
  room_type?: string;
  projector_available?: boolean;
  ac_count?: number;
  sound_system?: boolean;
  status?: string;
};

type RoomBooking = {
  id: string;
  booking_code: string;
  room_name: string;
  department: string;
  booker_name: string;
  meeting_topic: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  facilities: string[];
  status: string;
};

const DEPARTMENT_OPTIONS = [
  'Semua Departemen',
  'Jakarta 1',
  'Jawa Timur',
  'Jawa Tengah',
  'Jawa Barat',
  'Jakarta 6',
  'BPO Umum',
  'Jakarta 5',
  'Kalimantan',
  'Sumbagsel',
  'Balinusra',
  'Sumbagteng',
  'Sumbagut',
  'Sulampua',
  'Divisi IT',
  'Divisi Finance',
  'Divisi Human Capital',
  'Divisi Payroll'
];

export default function RoomBookingPage() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('Semua Departemen');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status');

  const [form, setForm] = useState({
    room_name: '',
    department: 'Jakarta 1',
    booker_name: '',
    meeting_topic: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '11:00',
    participant_count: 10,
    facilities: [] as string[],
  });

  const [roomForm, setRoomForm] = useState({
    name: '',
    capacity: 15,
    location: 'Gedung Utama Lt. 2',
    floor: 'Lantai 2',
    room_type: 'Ruang Rapat Eksekutif',
    facility_note: 'AC Daikin 2 PK, Smart TV 75 inch, Whiteboard',
    projector_available: true,
    ac_count: 2,
    sound_system: true,
    status: 'Tersedia'
  });

  const supabase = createClient();

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase.from('room_options').select('*');
    if (data && data.length > 0) {
      setRoomOptions(data);
      setForm(prev => ({ ...prev, room_name: data[0].name }));
    } else {
      setRoomOptions([]);
    }
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from('room_bookings').select('*').order('created_at', { ascending: false });
    if (data) {
      setBookings(data);
    }
  };

  const handleFacilityToggle = (facility: string) => {
    if (form.facilities.includes(facility)) {
      setForm({ ...form, facilities: form.facilities.filter(f => f !== facility) });
    } else {
      setForm({ ...form, facilities: [...form.facilities, facility] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bookingCode = `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      booking_code: bookingCode,
      room_name: form.room_name,
      department: form.department,
      booker_name: form.booker_name,
      meeting_topic: form.meeting_topic,
      booking_date: form.booking_date,
      start_time: form.start_time,
      end_time: form.end_time,
      participant_count: Number(form.participant_count),
      facilities: form.facilities,
      status: 'Disetujui / Terjadwal'
    };

    const { error } = await supabase.from('room_bookings').insert([newBooking]);

    if (error) {
      alert('Gagal memesan ruangan: ' + error.message);
    } else {
      alert(`Berhasil memesan ruangan! Kode Booking: ${bookingCode}`);
      setShowModal(false);
      setForm({
        room_name: roomOptions.length > 0 ? roomOptions[0].name : '',
        department: 'Jakarta 1',
        booker_name: '',
        meeting_topic: '',
        booking_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '11:00',
        participant_count: 10,
        facilities: [],
      });
      fetchBookings();
    }
  };

  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRoomPayload = {
      name: roomForm.name,
      capacity: Number(roomForm.capacity),
      location: roomForm.location,
      floor: roomForm.floor,
      room_type: roomForm.room_type,
      facility_note: roomForm.facility_note,
      projector_available: roomForm.projector_available,
      ac_count: Number(roomForm.ac_count),
      sound_system: roomForm.sound_system,
      status: roomForm.status
    };

    const { error } = await supabase.from('room_options').insert([newRoomPayload]);

    if (error) {
      alert('Gagal menambahkan ruangan baru: ' + error.message);
    } else {
      alert(`Berhasil mendaftarkan ruangan baru: ${roomForm.name}`);
      setShowAddRoomModal(false);
      setRoomForm({
        name: '',
        capacity: 15,
        location: 'Gedung Utama Lt. 2',
        floor: 'Lantai 2',
        room_type: 'Ruang Rapat Eksekutif',
        facility_note: 'AC Daikin 2 PK, Smart TV 75 inch, Whiteboard',
        projector_available: true,
        ac_count: 2,
        sound_system: true,
        status: 'Tersedia'
      });
      fetchRooms();
    }
  };

  const handleDeleteRoom = async (id: string, roomName: string) => {
    const isConfirmed = window.confirm(`Hapus ruangan "${roomName}" dari daftar master?`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('room_options').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus ruangan: ' + error.message);
    } else {
      fetchRooms();
    }
  };

  const handleCancelBooking = async (id: string) => {
    const isConfirmed = window.confirm('Batalkan pemesanan ruangan ini?');
    if (!isConfirmed) return;

    const { error } = await supabase.from('room_bookings').update({ status: 'Dibatalkan' }).eq('id', id);
    if (!error) {
      fetchBookings();
    }
  };

  const exportBookingsToExcel = () => {
    const excelData = filteredBookings.map((item, index) => ({
      No: index + 1,
      'Kode Booking': item.booking_code,
      'Nama Ruangan': item.room_name,
      'Topik Meeting': item.meeting_topic,
      Pemohon: item.booker_name,
      Departemen: item.department,
      'Jumlah Peserta': item.participant_count,
      'Tanggal Rapat': item.booking_date,
      'Jam Mulai': item.start_time,
      'Jam Selesai': item.end_time,
      'Fasilitas Tambahan': item.facilities ? item.facilities.join(', ') : '-',
      Status: item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal Pemesanan Ruangan');
    XLSX.writeFile(workbook, `Jadwal_Pemesanan_Ruangan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isRoomBookedToday = (roomName: string) => {
    return bookings.some(
      b => b.room_name === roomName && b.booking_date === todayStr && b.status === 'Disetujui / Terjadwal'
    );
  };

  const filteredBookings = bookings.filter(item => {
    const matchesSearch = 
      item.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meeting_topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.booker_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDeptFilter === 'Semua Departemen' || item.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'Semua Status' || item.status === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
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
          
          <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 h-20 px-6 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-md">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarHidden(!isSidebarHidden)} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-2"
              >
                <span>☰</span>
                <span>{isSidebarHidden ? 'Tampilkan Menu' : 'Sembunyikan Menu'}</span>
              </button>
              <h1 className="font-extrabold text-white text-base">Pemesanan Pemakaian Ruangan Rapat</h1>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddRoomModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2 border border-emerald-400/30"
              >
                <Layers className="w-4 h-4" /> Tambah Ruangan Baru 🏢
              </button>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-2 border border-sky-400/30"
              >
                <Plus className="w-4 h-4" /> Pesan Ruangan Baru
              </button>
            </div>
          </header>

          <main className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 space-y-6 pb-16">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roomOptions.length === 0 ? (
                <div className="col-span-full bg-slate-900/70 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center text-slate-400 italic text-xs">
                  Belum ada data ruangan terdaftar di database. Silakan klik tombol "Tambah Ruangan Baru" di atas.
                </div>
              ) : (
                roomOptions.map((room) => {
                  const bookedToday = isRoomBookedToday(room.name);
                  return (
                    <div key={room.id} className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="p-2.5 bg-sky-500/20 text-sky-300 rounded-2xl border border-sky-500/30">
                            <Building2 className="w-5 h-5" />
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                              bookedToday 
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}>
                              {bookedToday ? '🔴 Dipesan (Hari Ini)' : '🟢 Tersedia'}
                            </span>
                            <button 
                              onClick={() => handleDeleteRoom(room.id, room.name)}
                              className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition cursor-pointer"
                              title="Hapus Ruangan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xs font-black text-white">{room.name}</h3>
                        <p className="text-[11px] text-slate-300">👥 Kapasitas: {room.capacity} Orang</p>
                        <p className="text-[11px] text-slate-300">📍 Lokasi: {room.location || room.floor || 'Gedung Utama'}</p>
                        <p className="text-[11px] text-slate-300">🛠️ {room.facility_note}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* BAR PENCARIAN & FILTER LANJUTAN */}
            <div className="bg-slate-900/70 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <div className="relative w-full lg:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari agenda, pemohon, atau kode..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white outline-none font-medium placeholder:text-slate-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2 bg-slate-950/60 border border-white/15 px-3 py-2 rounded-2xl">
                    <Filter className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px] font-bold text-slate-300">Filter Unit/Dept:</span>
                    <select 
                      value={selectedDeptFilter} 
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="Semua Departemen" className="bg-slate-900 text-white">Semua Unit / Dept</option>
                      <optgroup label="Area Pulau Jawa" className="bg-slate-900 text-white">
                        <option value="Jakarta 1">Jakarta 1</option>
                        <option value="Jawa Timur">Jawa Timur</option>
                        <option value="Jawa Tengah">Jawa Tengah</option>
                        <option value="Jawa Barat">Jawa Barat</option>
                        <option value="Jakarta 6">Jakarta 6</option>
                        <option value="BPO Umum">BPO Umum</option>
                        <option value="Jakarta 5">Jakarta 5</option>
                      </optgroup>
                      <optgroup label="Area Luar Pulau Jawa" className="bg-slate-900 text-white">
                        <option value="Kalimantan">Kalimantan</option>
                        <option value="Sumbagsel">Sumbagsel</option>
                        <option value="Balinusra">Balinusra</option>
                        <option value="Sumbagteng">Sumbagteng</option>
                        <option value="Sumbagut">Sumbagut</option>
                        <option value="Sulampua">Sulampua</option>
                      </optgroup>
                      <optgroup label="Back Office" className="bg-slate-900 text-white">
                        <option value="Divisi IT">Divisi IT</option>
                        <option value="Divisi Finance">Divisi Finance</option>
                        <option value="Divisi Human Capital">Divisi Human Capital</option>
                        <option value="Divisi Payroll">Divisi Payroll</option>
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/60 border border-white/15 px-3 py-2 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-300">Status:</span>
                    <select 
                      value={selectedStatusFilter} 
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="Semua Status" className="bg-slate-900 text-white">Semua Status</option>
                      <option value="Disetujui / Terjadwal" className="bg-slate-900 text-white">Terjadwal</option>
                      <option value="Dibatalkan" className="bg-slate-900 text-white">Dibatalkan</option>
                    </select>
                  </div>

                  <button
                    onClick={exportBookingsToExcel}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer border border-emerald-400/30 ml-auto"
                  >
                    <Download className="w-4 h-4" /> Download Excel 📥
                  </button>
                </div>

              </div>
              
              <div className="flex justify-between items-center text-xs px-2 pt-2 border-t border-white/10 text-slate-400">
                <span>Menampilkan {filteredBookings.length} dari total {bookings.length} agenda pemesanan</span>
                {(selectedDeptFilter !== 'Semua Departemen' || selectedStatusFilter !== 'Semua Status' || searchQuery !== '') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedDeptFilter('Semua Departemen'); setSelectedStatusFilter('Semua Status'); }}
                    className="text-sky-400 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* TABEL JADWAL PEMAKAIAN */}
            <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4">
              <h2 className="text-base font-black text-white">Jadwal Pemakaian Ruangan Kantor</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-[11px] uppercase border-b border-white/10">
                      <th className="py-4 px-6">Kode & Ruangan</th>
                      <th className="py-4 px-6">Topik Meeting</th>
                      <th className="py-4 px-6">Pemohon & Unit/Dept</th>
                      <th className="py-4 px-6">Tanggal & Waktu</th>
                      <th className="py-4 px-6">Fasilitas Tambahan</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-xs">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 italic">Tidak ada jadwal pemesanan ruangan yang cocok dengan filter pencarian.</td>
                      </tr>
                    ) : (
                      filteredBookings.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition">
                          <td className="py-4 px-6">
                            <span className="font-mono font-bold text-sky-400 block">{item.booking_code}</span>
                            <span className="font-bold text-white">{item.room_name}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-200">{item.meeting_topic}</td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-white block">{item.booker_name}</span>
                            <span className="text-[11px] text-slate-300">{item.department} ({item.participant_count} Orang)</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-white block">📅 {item.booking_date}</span>
                            <span className="text-[11px] font-mono text-slate-300">⏰ {item.start_time} - {item.end_time} WIB</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {item.facilities && item.facilities.length > 0 ? (
                                item.facilities.map((fac, fIdx) => (
                                  <span key={fIdx} className="px-2.5 py-1 bg-white/10 text-slate-200 rounded-xl text-[10px] font-medium border border-white/10">
                                    {fac}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Tanpa tambahan</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${item.status === 'Disetujui / Terjadwal' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {item.status !== 'Dibatalkan' && (
                              <button
                                onClick={() => handleCancelBooking(item.id)}
                                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer"
                              >
                                Batalkan
                              </button>
                            )}
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

        {/* MODAL TAMBAH RUANGAN BARU DENGAN SPESIFIKASI DETAIL & LEBAR MAKSIMAL */}
        {showAddRoomModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full p-8 md:p-10 space-y-6 shadow-2xl my-8 text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-white text-base md:text-lg">Tambah Ruangan Rapat Baru</h3>
                    <p className="text-xs text-slate-400">Masukkan spesifikasi fasilitas & kapasitas secara detail</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full uppercase">Master Ruangan</span>
              </div>

              <form onSubmit={handleAddRoomSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Ruangan *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Cth: Ruang Rapat Merapi / Boardroom A" 
                      value={roomForm.name} 
                      onChange={(e) => setRoomForm({...roomForm, name: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Kapasitas Maksimal (Orang) *</label>
                    <input 
                      type="number" 
                      min={1} 
                      required 
                      value={roomForm.capacity} 
                      onChange={(e) => setRoomForm({...roomForm, capacity: Number(e.target.value)})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Lokasi / Gedung *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Cth: Gedung Utama Lt. 3" 
                      value={roomForm.location} 
                      onChange={(e) => setRoomForm({...roomForm, location: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Lantai *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Cth: Lantai 3" 
                      value={roomForm.floor} 
                      onChange={(e) => setRoomForm({...roomForm, floor: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tipe Ruangan *</label>
                    <select 
                      value={roomForm.room_type} 
                      onChange={(e) => setRoomForm({...roomForm, room_type: e.target.value})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="Ruang Rapat Eksekutif" className="bg-slate-900 text-white">Eksekutif / Boardroom</option>
                      <option value="Ruang Diskusi Tim" className="bg-slate-900 text-white">Diskusi Tim / Huddle</option>
                      <option value="Auditorium / Hall Besar" className="bg-slate-900 text-white">Auditorium / Hall</option>
                      <option value="Ruang Konferensi" className="bg-slate-900 text-white">Konferensi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Jumlah Unit AC *</label>
                    <input 
                      type="number" 
                      min={0} 
                      required 
                      value={roomForm.ac_count} 
                      onChange={(e) => setRoomForm({...roomForm, ac_count: Number(e.target.value)})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Ketersediaan Proyektor *</label>
                    <select 
                      value={roomForm.projector_available ? 'true' : 'false'} 
                      onChange={(e) => setRoomForm({...roomForm, projector_available: e.target.value === 'true'})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="true" className="bg-slate-900 text-white">Tersedia (Infocus / TV)</option>
                      <option value="false" className="bg-slate-900 text-white">Tidak Ada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Sound System *</label>
                    <select 
                      value={roomForm.sound_system ? 'true' : 'false'} 
                      onChange={(e) => setRoomForm({...roomForm, sound_system: e.target.value === 'true'})} 
                      className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="true" className="bg-slate-900 text-white">Tersedia (Mic / Speaker)</option>
                      <option value="false" className="bg-slate-900 text-white">Tidak Ada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Catatan Spesifikasi & Fasilitas Detail *</label>
                  <textarea 
                    rows={3}
                    required 
                    placeholder="Cth: Dilengkapi AC Daikin 2 PK (2 unit), Smart TV 75 inch, Whiteboard gantung, Meja rapat modular, Stopkontak di setiap kursi." 
                    value={roomForm.facility_note} 
                    onChange={(e) => setRoomForm({...roomForm, facility_note: e.target.value})} 
                    className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-medium text-white outline-none resize-none" 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowAddRoomModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg cursor-pointer border border-emerald-400/30">Simpan Ruangan Baru</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PESAN RUANGAN RAPAT */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl my-8 text-white">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-black text-white text-base">Formulir Pemesanan Ruangan Rapat</h3>
                <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full uppercase">Fasilitas Kantor</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Pilih Ruangan Rapat *</label>
                  <select value={form.room_name} onChange={(e) => setForm({...form, room_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer">
                    {roomOptions.length === 0 ? (
                      <option value="" disabled>Tidak ada ruangan tersedia di database</option>
                    ) : (
                      roomOptions.map((r) => (
                        <option key={r.id} value={r.name} className="bg-slate-900 text-white">{r.name} (Kapasitas: {r.capacity} Orang - {r.location || 'Gedung Utama'})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Pemohon *</label>
                    <input type="text" required placeholder="Cth: Budi Santoso" value={form.booker_name} onChange={(e) => setForm({...form, booker_name: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Unit / Departemen *</label>
                    <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none cursor-pointer max-h-48">
                      <optgroup label="Area Pulau Jawa" className="bg-slate-900 text-white">
                        <option value="Jakarta 1">Jakarta 1</option>
                        <option value="Jawa Timur">Jawa Timur</option>
                        <option value="Jawa Tengah">Jawa Tengah</option>
                        <option value="Jawa Barat">Jawa Barat</option>
                        <option value="Jakarta 6">Jakarta 6</option>
                        <option value="BPO Umum">BPO Umum</option>
                        <option value="Jakarta 5">Jakarta 5</option>
                      </optgroup>
                      <optgroup label="Area Luar Pulau Jawa" className="bg-slate-900 text-white">
                        <option value="Kalimantan">Kalimantan</option>
                        <option value="Sumbagsel">Sumbagsel</option>
                        <option value="Balinusra">Balinusra</option>
                        <option value="Sumbagteng">Sumbagteng</option>
                        <option value="Sumbagut">Sumbagut</option>
                        <option value="Sulampua">Sulampua</option>
                      </optgroup>
                      <optgroup label="Back Office" className="bg-slate-900 text-white">
                        <option value="Divisi IT">Divisi IT</option>
                        <option value="Divisi Finance">Divisi Finance</option>
                        <option value="Divisi Human Capital">Divisi Human Capital</option>
                        <option value="Divisi Payroll">Divisi Payroll</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Topik / Agenda Meeting *</label>
                  <input type="text" required placeholder="Cth: Evaluasi Kinerja Bulanan & Anggaran Q3" value={form.meeting_topic} onChange={(e) => setForm({...form, meeting_topic: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Tanggal Meeting *</label>
                    <input type="date" required value={form.booking_date} onChange={(e) => setForm({...form, booking_date: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Jam Mulai *</label>
                    <input type="time" required value={form.start_time} onChange={(e) => setForm({...form, start_time: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Jam Selesai *</label>
                    <input type="time" required value={form.end_time} onChange={(e) => setForm({...form, end_time: e.target.value})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-white outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Estimasi Jumlah Peserta *</label>
                  <input type="number" min={1} required value={form.participant_count} onChange={(e) => setForm({...form, participant_count: Number(e.target.value)})} className="w-full bg-slate-950/60 border border-white/15 rounded-2xl px-4 py-3 text-xs font-bold text-white outline-none" />
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-xs font-black text-slate-200 block">Permintaan Fasilitas Tambahan:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Proyektor / Infocus', 'Sound System & Mic', 'Konsumsi / Snack Rapat', 'Kopi & Teh Dispenser', 'Blok Note & Pulpen'].map((fac, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer bg-white/5 p-2.5 rounded-xl border border-white/10 hover:bg-white/10 transition">
                        <input 
                          type="checkbox" 
                          checked={form.facilities.includes(fac)}
                          onChange={() => handleFacilityToggle(fac)}
                          className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 cursor-pointer"
                        />
                        <span>{fac}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/10 hover:bg-white/20 transition cursor-pointer border border-white/10">Batal</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition shadow-lg cursor-pointer border border-sky-400/30">Konfirmasi Pesan Ruangan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}