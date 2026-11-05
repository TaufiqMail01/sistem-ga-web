import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import { Settings, Users, Settings2, ArrowRight } from 'lucide-react';

export default function SettingsPage() {
  const menuItems = [
    {
      title: 'Manajemen Pengguna & Staf',
      description: 'Kelola daftar akun staf kantor dan hak akses mereka (Admin, Staf, Kepala Bagian).',
      href: '/settings/users',
      icon: <Users className="w-6 h-6" />,
    },
    {
      title: 'Pengaturan Umum & Notifikasi',
      description: 'Atur nama instansi, format penomoran otomatis (prefix), dan notifikasi sistem.',
      href: '/settings/general',
      icon: <Settings2 className="w-6 h-6" />,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-end">
        <BackButton fallbackUrl="/" />
      </div>

      <div className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 flex-shrink-0">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pusat konfigurasi utama untuk aplikasi General Affairs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform">
              <span>Buka Menu</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}