"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  rejected: number;
  categories: { [key: string]: number };
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
    categories: {},
  });
  const [loading, setLoading] = useState(true);
  // [UI saja] flag untuk menampilkan error state (sebelumnya hanya console.error)
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        setLoading(true);
        // Tarik status dan waste_category sekaligus
        const { data, error } = await supabase
          .from("reports")
          .select("status, waste_category");

        if (error) throw error;

        if (data && isMounted) {
          const total = data.length;
          const pending = data.filter(
            (item) => item.status === "Pending",
          ).length;
          const inProgress = data.filter(
            (item) => item.status === "In Progress",
          ).length;
          const completed = data.filter(
            (item) => item.status === "Completed",
          ).length;
          const rejected = data.filter(
            (item) => item.status === "Rejected",
          ).length;

          // Hitung jumlah laporan berdasarkan kategori sampah
          const categories: { [key: string]: number } = {};
          data.forEach((item) => {
            const cat = item.waste_category || "Tidak Diketahui";
            categories[cat] = (categories[cat] || 0) + 1;
          });

          setStats({
            total,
            pending,
            inProgress,
            completed,
            rejected,
            categories,
          });
        }
      } catch (error) {
        console.error("Gagal memuat statistik:", error);
        if (isMounted) setHasError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPercentage = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  // Warna kategori. Class ditulis utuh (bukan dirakit dari string) agar
  // terdeteksi oleh scanner Tailwind v4.
  const barColors = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  // [UI saja] konfigurasi tampilan status: dipakai oleh kartu, bar, dan legenda
  const statusItems = [
    {
      key: "pending",
      label: "Pending",
      value: stats.pending,
      card: "bg-amber-50 ring-amber-600/15",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    {
      key: "inProgress",
      label: "In Progress",
      value: stats.inProgress,
      card: "bg-sky-50 ring-sky-600/15",
      text: "text-sky-800",
      dot: "bg-sky-500",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      card: "bg-emerald-50 ring-emerald-600/15",
      text: "text-emerald-800",
      dot: "bg-emerald-600",
    },
    {
      key: "rejected",
      label: "Rejected",
      value: stats.rejected,
      card: "bg-rose-50 ring-rose-600/15",
      text: "text-rose-800",
      dot: "bg-rose-500",
    },
  ];

  // Urutan terbanyak -> tersedikit, hanya untuk tampilan (state tidak diubah)
  const categoryEntries = Object.entries(stats.categories).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div>
      {/* PERUBAHAN LAYOUT: judul halaman + deskripsi singkat */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Statistik Laporan Sampah
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Ringkasan seluruh laporan warga beserta status penanganannya.
        </p>
      </div>

      {loading ? (
        <OverviewSkeleton />
      ) : hasError ? (
        <div
          role="alert"
          className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
        >
          <p className="text-base font-semibold text-red-900">
            Statistik gagal dimuat
          </p>
          <p className="mt-1 max-w-sm text-sm text-red-800">
            Periksa koneksi internet atau konfigurasi Supabase, lalu muat ulang
            halaman.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Muat ulang halaman
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards Utama
              PERUBAHAN LAYOUT: 2 kolom di mobile, kartu "Total" melebar penuh;
              5 kolom sejajar di layar >= lg. */}
          <section
            aria-label="Ringkasan jumlah laporan"
            className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
          >
            <div className="col-span-2 rounded-2xl bg-emerald-800 p-5 text-white shadow-xs sm:p-6 lg:col-span-1">
              <p className="text-sm font-medium text-emerald-100">
                Total Laporan
              </p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight">
                {stats.total}
              </p>
            </div>

            {statusItems.map((s) => (
              <div
                key={s.key}
                className={`rounded-2xl p-5 ring-1 ring-inset sm:p-6 ${s.card}`}
              >
                <p
                  className={`flex items-center gap-2 text-sm font-medium ${s.text}`}
                >
                  <span className={`size-2 rounded-full ${s.dot}`} />
                  {s.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${s.text}`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </section>

          {/* Dua panel berdampingan di layar lebar (xl), bertumpuk di bawahnya */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Progress Bar Visual Proporsi Status */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Proporsi Status Laporan
              </h3>

              {stats.total === 0 ? (
                <EmptyState text="Belum ada data untuk ditampilkan dalam diagram." />
              ) : (
                <div className="mt-5 space-y-5">
                  <div
                    role="img"
                    aria-label={`Proporsi status: ${statusItems
                      .map((s) => `${s.label} ${getPercentage(s.value)}%`)
                      .join(", ")}`}
                    className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
                  >
                    {statusItems.map((s) => (
                      <div
                        key={s.key}
                        style={{ width: `${getPercentage(s.value)}%` }}
                        className={`${s.dot} transition-all duration-500 motion-reduce:transition-none`}
                        title={`${s.label}: ${s.value}`}
                      />
                    ))}
                  </div>

                  <ul className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    {statusItems.map((s) => (
                      <li
                        key={s.key}
                        className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2"
                      >
                        <span className="flex items-center gap-2 text-slate-600">
                          <span
                            className={`size-3 shrink-0 rounded-full ${s.dot}`}
                          />
                          {s.label}
                        </span>
                        <span className="tabular-nums text-slate-900">
                          <b>{getPercentage(s.value)}%</b>{" "}
                          <span className="text-slate-500">({s.value})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Distribusi Kategori Sampah */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="text-base font-semibold text-slate-900">
                Distribusi Kategori Sampah (AI Prediction)
              </h3>

              {categoryEntries.length === 0 ? (
                <EmptyState text="Belum ada data kategori sampah yang tercatat." />
              ) : (
                <div className="mt-5 space-y-5">
                  {/* Baris Progress Kategori */}
                  <div
                    role="img"
                    aria-label="Distribusi kategori sampah"
                    className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100"
                  >
                    {categoryEntries.map(([category, count], index) => {
                      const pct = getPercentage(count);
                      const colorClass = barColors[index % barColors.length];
                      return (
                        <div
                          key={category}
                          style={{ width: `${pct}%` }}
                          className={`${colorClass} transition-all duration-500 motion-reduce:transition-none`}
                          title={`${category}: ${count} (${pct}%)`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend Kategori: daftar terurut, tiap baris punya bar sendiri
                      agar kategori kecil tetap terbaca */}
                  <ul className="space-y-3">
                    {categoryEntries.map(([category, count], index) => {
                      const pct = getPercentage(count);
                      const dotColor = barColors[index % barColors.length];
                      return (
                        <li key={category}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 text-slate-700">
                              <span
                                className={`size-3 shrink-0 rounded-full ${dotColor}`}
                              />
                              <span className="truncate">{category}</span>
                            </span>
                            <span className="shrink-0 tabular-nums text-slate-900">
                              <b>{pct}%</b>{" "}
                              <span className="text-slate-500">({count})</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${dotColor}`}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Komponen presentasi kecil ---------- */

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <svg
        className="size-8 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="M7 15v3M12 9v9M17 5v13" />
      </svg>
      <p className="mt-3 text-sm text-slate-600">{text}</p>
    </div>
  );
}

// Skeleton menggantikan teks "Memuat data statistik..."
function OverviewSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Memuat data statistik"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-28 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none ${
              i === 0 ? "col-span-2 lg:col-span-1" : ""
            }`}
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none"
          />
        ))}
      </div>
      <span className="sr-only">Memuat data statistik...</span>
    </div>
  );
}
