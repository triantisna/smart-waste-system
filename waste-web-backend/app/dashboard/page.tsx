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

  // Warna otomatis untuk berbagai kategori sampah
  const categoryColors = [
    "bg-emerald-500 text-emerald-700 border-emerald-100",
    "bg-amber-500 text-amber-700 border-amber-100",
    "bg-indigo-500 text-indigo-700 border-indigo-100",
    "bg-rose-500 text-rose-700 border-rose-100",
    "bg-cyan-500 text-cyan-700 border-cyan-100",
  ];

  const barColors = [
    "bg-emerald-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Statistik Laporan Sampah
      </h2>

      {loading ? (
        <p className="text-gray-500">Memuat data statistik...</p>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards Utama */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-500">Total Laporan</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-yellow-100">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="mt-2 text-3xl font-bold text-yellow-700">
                {stats.pending}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-blue-100">
              <p className="text-sm font-medium text-blue-600">In Progress</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {stats.inProgress}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-green-100">
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {stats.completed}
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-red-100">
              <p className="text-sm font-medium text-red-600">Rejected</p>
              <p className="mt-2 text-3xl font-bold text-red-700">
                {stats.rejected}
              </p>
            </div>
          </div>

          {/* Progress Bar Visual Proporsi Status */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Proporsi Status Laporan
            </h3>

            {stats.total === 0 ? (
              <p className="text-sm text-gray-400">
                Belum ada data untuk ditampilkan dalam diagram.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5">
                  <div
                    style={{ width: `${getPercentage(stats.pending)}%` }}
                    className="bg-yellow-400 transition-all duration-500"
                    title={`Pending: ${stats.pending}`}
                  />
                  <div
                    style={{ width: `${getPercentage(stats.inProgress)}%` }}
                    className="bg-blue-500 transition-all duration-500"
                    title={`In Progress: ${stats.inProgress}`}
                  />
                  <div
                    style={{ width: `${getPercentage(stats.completed)}%` }}
                    className="bg-green-500 transition-all duration-500"
                    title={`Completed: ${stats.completed}`}
                  />
                  <div
                    style={{ width: `${getPercentage(stats.rejected)}%` }}
                    className="bg-red-500 transition-all duration-500"
                    title={`Rejected: ${stats.rejected}`}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="text-gray-600">
                      Pending: <b>{getPercentage(stats.pending)}%</b> (
                      {stats.pending})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-gray-600">
                      In Progress: <b>{getPercentage(stats.inProgress)}%</b> (
                      {stats.inProgress})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">
                      Completed: <b>{getPercentage(stats.completed)}%</b> (
                      {stats.completed})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-gray-600">
                      Rejected: <b>{getPercentage(stats.rejected)}%</b> (
                      {stats.rejected})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Distribusi Kategori Sampah */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              Distribusi Kategori Sampah (AI Prediction)
            </h3>

            {Object.keys(stats.categories).length === 0 ? (
              <p className="text-sm text-gray-400">
                Belum ada data kategori sampah yang tercatat.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Baris Progress Kategori */}
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5">
                  {Object.entries(stats.categories).map(
                    ([category, count], index) => {
                      const pct = getPercentage(count);
                      const colorClass = barColors[index % barColors.length];
                      return (
                        <div
                          key={category}
                          style={{ width: `${pct}%` }}
                          className={`${colorClass} transition-all duration-500`}
                          title={`${category}: ${count} (${pct}%)`}
                        />
                      );
                    },
                  )}
                </div>

                {/* Legend Kategori */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-2 text-sm">
                  {Object.entries(stats.categories).map(
                    ([category, count], index) => {
                      const pct = getPercentage(count);
                      const dotColor = barColors[index % barColors.length];
                      return (
                        <div key={category} className="flex items-center gap-2">
                          <span
                            className={`h-3 w-3 rounded-full ${dotColor}`}
                          />
                          <span className="text-gray-600 truncate">
                            {category}: <b>{pct}%</b> ({count})
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
