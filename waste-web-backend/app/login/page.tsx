"use client";

import { useState } from "react";
import { useState as useReactState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useReactState("");
  const [password, setPassword] = useReactState("");
  const [loading, setLoading] = useReactState(false);
  const [errorMsg, setErrorMsg] = useReactState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Proses autentikasi Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      const user = authData.user;
      if (user) {
        // 2. Cek role user di tabel public.users (RBAC check)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError || !userData) {
          throw new Error("Data profil pengguna tidak ditemukan.");
        }

        if (userData.role !== "admin") {
          await supabase.auth.signOut();
          throw new Error("Akses ditolak. Akun Anda bukan Administrator.");
        }

        // 3. Jika lolos, arahkan ke dashboard
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat login.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Admin Login - Smart Waste
        </h2>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              placeholder="admin@smartwaste.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Memproses..." : "Login ke Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
