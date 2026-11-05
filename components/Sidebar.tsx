'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GLOBAL_CONFIG } from '@/lib/config';

const SIDEBAR_MENUS = [
  { name: 'Dashboard', icon: '🏠', href: '/dashboard', badge: 'Live' },
  { 
    name: 'Aset & Inventaris', 
    icon: '📦', 
    subMenus: [
      { name: 'Daftar & Master Aset', href: '/dashboard/inventory' },
      { name: 'Registrasi Aset Baru', href: '/dashboard/add' },
      { name: 'Distribusi / Peminjaman', href: '/dashboard/distribution' },
      { name: 'Perawatan & Servis', href: '/dashboard/maintenance' },
    ]
  },
  { 
    name: 'Fasilitas & Operasional', 
    icon: '🏢', 
    subMenus: [
      { name: 'Pusat Permintaan & Pengadaan ATK', href: '/dashboard/procurement' },
      { name: 'Form Pengiriman Dokumen', href: '/dashboard/documents' },        
      { name: 'Pemesanan Pemakaian Ruangan', href: '/dashboard/rooms' },          
      { name: 'Kendaraan Operasional', href: '/dashboard/vehicles' },
      { name: 'Gedung & Fasilitas', href: '/dashboard/buildings' },
    ]
  },
  { 
    name: 'Manajemen & Laporan', 
    icon: '📊', 
    subMenus: [
      { name: 'Vendor & Rekanan', href: '/dashboard/vendors' },
      { name: 'Laporan & Mutasi', href: '/dashboard/reports' },
    ]
  },
  { 
    name: 'Pengaturan Sistem', 
    icon: '⚙️', 
    subMenus: [
      { name: 'Manajemen Pengguna', href: '/settings/users' },
      { name: 'Konfigurasi Standar', href: '/settings/general' },
    ]
  },
];

export default function Sidebar({ isHidden }: { isHidden: boolean }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>(() => {
    const initialOpen: { [key: string]: boolean } = {};
    SIDEBAR_MENUS.forEach(menu => {
      if (menu.subMenus) {
        const hasActiveSub = menu.subMenus.some(sub => pathname === sub.href);
        initialOpen[menu.name] = hasActiveSub;
      }
    });
    return initialOpen;
  });

  useEffect(() => {
    setOpenDropdowns(prev => {
      const updated = { ...prev };
      SIDEBAR_MENUS.forEach(menu => {
        if (menu.subMenus) {
          const hasActiveSub = menu.subMenus.some(sub => pathname === sub.href);
          if (hasActiveSub) {
            updated[menu.name] = true;
          }
        }
      });
      return updated;
    });
  }, [pathname]);

  const toggleDropdown = (menuName: string) => {
    setOpenDropdowns(prev => {
      const currentStatus = prev[menuName];
      const updated: { [key: string]: boolean } = {};
      Object.keys(prev).forEach(key => {
        updated[key] = false;
      });
      updated[menuName] = !currentStatus;
      return updated;
    });
  };

  return (
    <>
      <style jsx global>{`
        @keyframes dynamicGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-sidebar-bg {
          background: linear-gradient(-45deg, #0f172a, #312e81, #581c87, #0f766e, #1e1b4b);
          background-size: 400% 400%;
          animation: dynamicGradient 15s ease infinite;
        }
      `}</style>

      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredMenu(null);
        }}
        className={`animated-sidebar-bg text-white flex-shrink-0 flex flex-col justify-between shadow-2xl min-h-screen z-40 transition-all duration-300 ease-in-out relative border-r border-white/10 ${
          isHidden ? '-translate-x-full w-0 opacity-0 overflow-hidden absolute' : 'translate-x-0'
        } ${isHovered ? 'w-64' : 'w-24'}`}
      >
        <div className="overflow-x-hidden w-full flex-1 flex flex-col">
          <div className="h-20 px-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-3 overflow-hidden w-full">
              {GLOBAL_CONFIG.logoType === 'image' ? (
                <img src={GLOBAL_CONFIG.logoImage} alt="Logo" className="h-9 w-9 object-contain flex-shrink-0 bg-white/10 p-1 rounded-xl shadow-inner border border-white/20" />
              ) : (
                <div className="bg-sky-500/25 text-sky-300 border border-sky-500/30 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md flex-shrink-0">{GLOBAL_CONFIG.logoText || 'A'}</div>
              )}
              {isHovered && (
                <div className="truncate transition-opacity duration-200">
                  <span className="font-extrabold text-white text-sm tracking-tight block truncate drop-shadow-xs">{GLOBAL_CONFIG.companyName}</span>
                  <span className="text-[10px] text-slate-300 font-medium block truncate">{GLOBAL_CONFIG.departmentName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 space-y-2 mt-2 relative flex-1">
            {SIDEBAR_MENUS.map((menu, idx) => {
              const hasSub = menu.subMenus && menu.subMenus.length > 0;
              const isOpen = openDropdowns[menu.name];
              const isMenuMainActive = menu.href === pathname;
              const hasActiveSub = hasSub && menu.subMenus?.some(sub => sub.href === pathname);

              return (
                <div 
                  key={idx} 
                  className="relative"
                  onMouseEnter={() => !isHovered && setHoveredMenu(menu.name)}
                  onMouseLeave={() => !isHovered && setHoveredMenu(null)}
                >
                  {hasSub ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleDropdown(menu.name)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer select-none group ${
                          hasActiveSub ? 'bg-sky-500/30 shadow-lg text-white font-black ring-1 ring-sky-400/50' : isOpen ? 'bg-white/15 shadow-sm' : 'hover:bg-white/10'
                        } text-white`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`text-base flex-shrink-0 p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                            hasActiveSub ? 'bg-sky-500/40 text-white shadow-xs' : 'bg-white/10 text-slate-200'
                          }`}>
                            {menu.icon}
                          </span>
                          {isHovered && <span className="tracking-wide truncate">{menu.name}</span>}
                        </div>
                        {isHovered && (
                          <span className={`text-[10px] font-bold transition-transform duration-300 ml-2 flex-shrink-0 ${isOpen ? 'rotate-180 text-white' : 'rotate-0 text-slate-300'}`}>▼</span>
                        )}
                      </button>

                      {isHovered && (
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 my-1' : 'max-h-0 opacity-0'}`}>
                          <div className="relative pl-5 ml-6 space-y-1.5 border-l border-white/25 py-1">
                            {menu.subMenus?.map((sub, sIdx) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <Link 
                                  key={sIdx} 
                                  href={sub.href} 
                                  className={`block text-xs font-medium transition-all duration-200 tracking-wide py-2 px-3 rounded-xl ${
                                    isSubActive 
                                      ? 'bg-sky-500 text-white font-bold shadow-md translate-x-1' 
                                      : 'text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1'
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {!isHovered && hoveredMenu === menu.name && (
                        <div className="absolute left-24 top-0 bg-slate-900/95 backdrop-blur-xl text-white p-3 rounded-2xl shadow-2xl border border-white/15 w-56 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="text-xs font-black text-sky-400 border-b border-white/10 pb-2 mb-2 px-2">
                            {menu.name}
                          </div>
                          <div className="space-y-1">
                            {menu.subMenus?.map((sub, sIdx) => {
                              const isSubActive = pathname === sub.href;
                              return (
                                <Link 
                                  key={sIdx} 
                                  href={sub.href} 
                                  className={`block text-xs font-medium py-2 px-3 rounded-xl transition ${
                                    isSubActive ? 'bg-sky-500 text-white font-bold' : 'hover:bg-white/10 text-slate-300'
                                  }`}
                                >
                                  {sub.name}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link 
                      href={menu.href || '#'} 
                      className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-xs transition-all duration-200 group ${
                        isMenuMainActive ? 'bg-sky-500/30 text-white font-black shadow-lg ring-1 ring-sky-400/50' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-base flex-shrink-0 p-2 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                          isMenuMainActive ? 'bg-sky-500/40' : 'bg-white/10'
                        }`}>
                          {menu.icon}
                        </span> 
                        {isHovered && <span className="truncate">{menu.name}</span>}
                      </div>
                      {isHovered && menu.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500 text-white rounded-full uppercase tracking-wider animate-pulse ml-2 flex-shrink-0 shadow-sm">
                          {menu.badge}
                        </span>
                      )}
                    </Link>
                  )}

                  {!isHovered && !hasSub && hoveredMenu === menu.name && (
                    <div className="absolute left-24 top-2 bg-slate-900/95 backdrop-blur-xl text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl border border-white/15 z-50 whitespace-nowrap">
                      {menu.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TOMBOL KELUAR / LOGOUT DENGAN IKON SVG CUSTOM (PERSIS CONTOH) */}
        <div className="p-3 border-t border-white/10 bg-black/20 backdrop-blur-md flex flex-col gap-2 flex-shrink-0">
          <Link
            href="/login"
            onMouseEnter={() => !isHovered && setHoveredMenu('logout')}
            onMouseLeave={() => !isHovered && setHoveredMenu(null)}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all duration-200 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 group relative shadow-lg"
          >
            <div className="flex-shrink-0 p-2 rounded-xl bg-rose-500/20 text-rose-200 transition-transform duration-300 group-hover:scale-110 shadow-inner flex items-center justify-center">
              <svg 
                className="w-4 h-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </div>
            {isHovered && <span className="truncate tracking-wide">Keluar Sistem</span>}

            {!isHovered && hoveredMenu === 'logout' && (
              <div className="absolute left-24 top-2 bg-slate-900/95 backdrop-blur-xl text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl border border-white/15 z-50 whitespace-nowrap">
                Keluar Sistem
              </div>
            )}
          </Link>

          {isHovered && (
            <div className="p-3 bg-black/30 backdrop-blur-md rounded-2xl border border-white/15 shadow-inner text-center">
              <span className="text-[10px] text-slate-300 font-medium block">Sistem Inventaris & Operasional</span>
              <span className="text-[11px] font-bold text-sky-400 block mt-0.5">{GLOBAL_CONFIG.companyName}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}