// lib/config.ts

export interface GlobalConfig {
  companyName: string;
  departmentName: string;
  logoType: 'text' | 'image';
  logoText: string;
  logoImage: string;
  adminName: string;
  adminRole: string;
}

export const GLOBAL_CONFIG: GlobalConfig = {
  // 🏢 Informasi Perusahaan & Departemen
  companyName: 'PT Global Corpora Indonesia',
  departmentName: 'General Affairs System',
  
  // 🖼️ Logo (Bisa berupa inisial teks atau path file gambar di folder /public)
  logoType: 'image', // Pilihan: 'text' atau 'image'
  logoText: 'GA',
  logoImage: '/logo.png', // Letakkan file logo Anda di folder /public/logo.png
  
  // 👤 Informasi Admin Default
  adminName: 'Admin GA',
  adminRole: 'Head Operations',
};