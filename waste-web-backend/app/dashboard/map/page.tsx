"use client";

// Simpan file ini sebagai: app/dashboard/map/page.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

// Placeholder peta: tinggi responsif (lebih rendah di mobile, 600px di layar besar)
const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="flex h-96 w-full flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 text-sm text-slate-600 md:h-150"
    >
      <span className="size-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600 motion-reduce:animate-none" />
      Memuat peta interaktif...
    </div>
  ),
});

interface Report {
  id: string;
  created_at: string;
  waste_category: string;
  confidence?: number;
  image_url: string;
  status: "Pending" | "In Progress" | "Completed" | "Rejected";
  latitude?: number | null;
  longitude?: number | null;
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchReportsWithLocation = async () => {
      try {
        setLoading(true);
        // Ambil semua kolom laporan yang memiliki koordinat GPS
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && isMounted) {
          setReports(data as Report[]);
        }
      } catch (err: unknown) {
        console.error("Gagal memuat data peta:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReportsWithLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  // [UI saja] ringkasan jumlah titik per status, dihitung dari state `reports`
  const statusChips = [
    {
      label: "Pending",
      dot: "bg-amber-500",
      count: reports.filter((r) => r.status === "Pending").length,
    },
    {
      label: "In Progress",
      dot: "bg-sky-500",
      count: reports.filter((r) => r.status === "In Progress").length,
    },
    {
      label: "Completed",
      dot: "bg-emerald-600",
      count: reports.filter((r) => r.status === "Completed").length,
    },
    {
      label: "Rejected",
      dot: "bg-rose-500",
      count: reports.filter((r) => r.status === "Rejected").length,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Peta Persebaran Sampah
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Menampilkan titik koordinat laporan warga secara real-time. Total
          titik: {reports.length} laporan
        </p>
      </div>

      {/* Chip ringkasan status (hanya tampil setelah data siap) */}
      {!loading && (
        <ul
          aria-label="Ringkasan titik per status"
          className="flex flex-wrap gap-2"
        >
          {statusChips.map((chip) => (
            <li
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-xs"
            >
              <span className={`size-2 rounded-full ${chip.dot}`} />
              {chip.label}
              <b className="tabular-nums text-slate-900">{chip.count}</b>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <div
          role="status"
          className="flex h-96 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600 shadow-xs md:h-150"
        >
          <span className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 motion-reduce:animate-none" />
          Memuat data peta persebaran...
        </div>
      ) : (
        <>
          {/* Info bila belum ada laporan berkoordinat; peta tetap dirender seperti semula */}
          {reports.length === 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <svg
                className="mt-0.5 size-5 shrink-0 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              Belum ada laporan yang memiliki koordinat GPS. Titik akan muncul
              di peta setelah warga mengirim laporan dengan lokasi.
            </div>
          )}

          {/* PERUBAHAN LAYOUT: bingkai peta dengan border tipis & sudut membulat;
              padding dikurangi agar peta terasa menyatu dengan kartu.
              isolate mencegah z-index Leaflet (hingga 1000) menimpa sidebar/header. */}
          <div className="isolate overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs sm:p-2">
            <div className="overflow-hidden rounded-xl">
              <MapWithNoSSR reports={reports} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
