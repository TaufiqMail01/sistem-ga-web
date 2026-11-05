'use client';

import { useRouter } from 'next/navigation';

export default function BackButton({ 
  label = 'Kembali', 
  fallbackUrl = '/settings' 
}: { 
  label?: string; 
  fallbackUrl?: string 
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackUrl);
        }
      }}
      className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all duration-200 cursor-pointer"
    >
      <span>{label}</span>
    </button>
  );
}