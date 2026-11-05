'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm print:hidden"
    >
      🖨️ Cetak / Print Stiker
    </button>
  );
}