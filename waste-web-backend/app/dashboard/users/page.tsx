"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email?: string;
  name?: string; // Disesuaikan dengan kolom Supabase
  role: "admin" | "user";
  created_at: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && isMounted) {
          setUsers(data as UserProfile[]);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Terjadi kesalahan";
        console.error("Gagal memuat daftar pengguna:", errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Manajemen Pengguna Mobile
        </h2>
        <span className="text-sm text-gray-500">
          Total: {users.length} Pengguna
        </span>
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat daftar pengguna...</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500">
            Belum ada pengguna terdaftar di database.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role Akses</th>
                <th className="p-4">Tanggal Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-900">
                    {/* Menggunakan user.name */}
                    {user.name || "Tanpa Nama"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {user.email || "Email disembunyikan"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
