// lib/config.ts
export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  ML_API_URL: process.env.EXPO_PUBLIC_ML_API_URL || "",
};

// Opsional: Lemparkan error jika URL kosong agar cepat ketahuan saat debugging
if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ PERINGATAN: Supabase URL atau Anon Key belum diset di .env!",
  );
}
if (!CONFIG.ML_API_URL) {
  console.warn("⚠️ PERINGATAN: ML API URL belum diset di .env!");
}
