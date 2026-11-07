"use client";

// Simpan file ini sebagai: app/dashboard/users/page.tsx

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

  /* ================== Bagian presentasi (tanpa logika baru) ================== */

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.length - adminCount;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const roleBadge = (role: UserProfile["role"]) => (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        role === "admin"
          ? "bg-violet-50 text-violet-800 ring-violet-600/20"
          : "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      {role.toUpperCase()}
    </span>
  );

  // Avatar inisial dari nama/email yang sudah ada
  const avatar = (user: UserProfile) => {
    const source = user.name || user.email || "?";
    return (
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
      >
        {source.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Pengguna Mobile
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Daftar akun yang terdaftar melalui aplikasi mobile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-xs">
            Total: <b className="tabular-nums text-slate-900">{users.length}</b>{" "}
            Pengguna
          </span>
          {!loading && users.length > 0 && (
            <>
              <span className="rounded-full bg-violet-50 px-3 py-1.5 font-medium text-violet-800 ring-1 ring-inset ring-violet-600/20">
                Admin <b className="tabular-nums">{adminCount}</b>
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
                User <b className="tabular-nums">{userCount}</b>
              </span>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          aria-label="Memuat daftar pengguna"
          className="space-y-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none"
            />
          ))}
          <span className="sr-only">Memuat daftar pengguna...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <svg
            className="size-10 text-slate-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
            <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.3c2.2.7 3.5 2.7 3.5 5.7" />
          </svg>
          <p className="mt-3 text-sm text-slate-600">
            Belum ada pengguna terdaftar di database.
          </p>
        </div>
      ) : (
        <>
          {/* PERUBAHAN LAYOUT (< sm): kartu per pengguna, tanpa scroll horizontal */}
          <ul className="space-y-3 sm:hidden">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  {avatar(user)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {/* Menggunakan user.name */}
                      {user.name || "Tanpa Nama"}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {user.email || "Email disembunyikan"}
                    </p>
                  </div>
                  {roleBadge(user.role)}
                </div>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  Bergabung {formatDate(user.created_at)}
                </p>
              </li>
            ))}
          </ul>

          {/* Tabel (>= sm) */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th scope="col" className="px-4 py-3">
                    Nama Lengkap
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Role Akses
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tanggal Bergabung
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {avatar(user)}
                        <span className="font-medium text-slate-900">
                          {/* Menggunakan user.name */}
                          {user.name || "Tanpa Nama"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.email || "Email disembunyikan"}
                    </td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
