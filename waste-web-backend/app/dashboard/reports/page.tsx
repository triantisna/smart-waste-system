"use client";

// Simpan file ini sebagai: app/dashboard/reports/page.tsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Report {
  id: string;
  created_at: string;
  waste_category: string;
  confidence?: number;
  description?: string;
  image_url: string;
  status: "Pending" | "In Progress" | "Completed" | "Rejected";
  title?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function ReportsManagementPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State baru untuk loading delete
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // State untuk Modal Popup Foto
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // State untuk menyimpan cache alamat berdasarkan koordinat
  const [addresses, setAddresses] = useState<{ [key: string]: string }>({});

  const fetchAddresses = useCallback(
    async (reportList: Report[]) => {
      const newAddresses: { [key: string]: string } = {};

      for (const report of reportList) {
        if (report.latitude && report.longitude) {
          const key = `${report.latitude},${report.longitude}`;
          if (!addresses[key]) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${report.latitude}&lon=${report.longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    "User-Agent": "SmartWasteSystem/1.0",
                  },
                },
              );
              const data = await response.json();
              if (data && data.display_name) {
                const addr = data.address;
                const road = addr.road || addr.suburb || "";
                const village =
                  addr.village || addr.suburb || addr.city_district || "";
                const city = addr.city || addr.town || addr.county || "";

                const shortAddress = [road, village, city]
                  .filter(Boolean)
                  .join(", ");
                newAddresses[key] = shortAddress || data.display_name;
              } else {
                newAddresses[key] =
                  `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
              }
            } catch (e) {
              console.warn("Gagal mengambil alamat reverse geocoding:", e);
              newAddresses[key] =
                `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
            }
          }
        }
      }

      if (Object.keys(newAddresses).length > 0) {
        setAddresses((prev) => ({ ...prev, ...newAddresses }));
      }
    },
    [addresses],
  );

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && isMounted) {
          const reportList = data as Report[];
          setReports(reportList);
          setFilteredReports(reportList);
          fetchAddresses(reportList);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Terjadi kesalahan";
        console.error("Gagal memuat laporan:", errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [fetchAddresses]);

  const handleFilter = (status: string) => {
    setSelectedStatus(status);
    if (status === "All") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((rep) => rep.status === status));
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: Report["status"],
  ) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      const updatedList = reports.map((rep) =>
        rep.id === id ? { ...rep, status: newStatus } : rep,
      );
      setReports(updatedList);

      if (selectedStatus === "All") {
        setFilteredReports(updatedList);
      } else {
        setFilteredReports(
          updatedList.filter((rep) => rep.status === selectedStatus),
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      alert("Gagal memperbarui status: " + errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  // Fungsi baru untuk menghapus laporan
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.",
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      const { error } = await supabase.from("reports").delete().eq("id", id);

      if (error) throw error;

      // Hapus data dari state lokal agar UI langsung terupdate
      const updatedList = reports.filter((rep) => rep.id !== id);
      setReports(updatedList);

      if (selectedStatus === "All") {
        setFilteredReports(updatedList);
      } else {
        setFilteredReports(
          updatedList.filter((rep) => rep.status === selectedStatus),
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus data";
      alert("Gagal menghapus laporan: " + errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // Class ditulis utuh agar terdeteksi scanner Tailwind v4
  const getStatusBadgeClass = (status: Report["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-800 ring-amber-600/20";
      case "In Progress":
        return "bg-sky-50 text-sky-800 ring-sky-600/20";
      case "Completed":
        return "bg-emerald-50 text-emerald-800 ring-emerald-600/20";
      case "Rejected":
        return "bg-rose-50 text-rose-800 ring-rose-600/20";
      default:
        return "bg-slate-100 text-slate-700 ring-slate-500/20";
    }
  };

  const getStatusDotClass = (status: Report["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500";
      case "In Progress":
        return "bg-sky-500";
      case "Completed":
        return "bg-emerald-600";
      case "Rejected":
        return "bg-rose-500";
      default:
        return "bg-slate-400";
    }
  };

  /* ================== Bagian presentasi (tanpa logika baru) ================== */

  const filterOptions = [
    "All",
    "Pending",
    "In Progress",
    "Completed",
    "Rejected",
  ];

  // Jumlah per status, hanya untuk label tab
  const countFor = (status: string) =>
    status === "All"
      ? reports.length
      : reports.filter((r) => r.status === status).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderStatusBadge = (status: Report["status"]) => (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusBadgeClass(
        status,
      )}`}
    >
      <span className={`size-1.5 rounded-full ${getStatusDotClass(status)}`} />
      {status}
    </span>
  );

  const renderPhoto = (report: Report, size: "sm" | "lg") => {
    const isValidImage =
      report.image_url && report.image_url.startsWith("http");
    const dim = size === "lg" ? "size-20" : "size-12";
    return isValidImage ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={report.image_url}
        alt="Bukti Sampah"
        onClick={() => setSelectedImage(report.image_url)}
        className={`${dim} shrink-0 cursor-zoom-in rounded-lg border border-slate-200 object-cover transition hover:opacity-85`}
        title="Klik untuk memperbesar foto"
        width={size === "lg" ? 80 : 48}
        height={size === "lg" ? 80 : 48}
      />
    ) : (
      <span
        className={`${dim} grid shrink-0 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-1 text-center text-[10px] leading-tight text-slate-400`}
      >
        Tidak ada foto
      </span>
    );
  };

  const renderConfidence = (report: Report) =>
    report.confidence !== undefined && report.confidence !== null
      ? `${(report.confidence * 100).toFixed(1)}%`
      : "N/A";

  const renderLocation = (report: Report) => {
    const coordKey = `${report.latitude},${report.longitude}`;
    const addressText = addresses[coordKey];
    return report.latitude && report.longitude ? (
      <div>
        <p className="mb-0.5 font-medium text-slate-800">
          {addressText || "Memuat nama alamat..."}
        </p>
        <a
          href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Buka di Google Maps ↗
        </a>
      </div>
    ) : (
      <span className="italic text-slate-400">Lokasi tidak tersedia</span>
    );
  };

  const renderActions = (report: Report) => {
    const busy = updatingId === report.id;
    const base =
      "inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40";
    return (
      <div className="flex flex-wrap gap-1.5">
        <button
          disabled={busy || report.status === "In Progress"}
          onClick={() => handleUpdateStatus(report.id, "In Progress")}
          className={`${base} bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:outline-sky-600`}
        >
          Process
        </button>
        <button
          disabled={busy || report.status === "Completed"}
          onClick={() => handleUpdateStatus(report.id, "Completed")}
          className={`${base} bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus-visible:outline-emerald-600`}
        >
          Complete
        </button>
        <button
          disabled={busy || report.status === "Rejected"}
          onClick={() => handleUpdateStatus(report.id, "Rejected")}
          className={`${base} bg-rose-50 text-rose-800 hover:bg-rose-100 focus-visible:outline-rose-600`}
        >
          Reject
        </button>
        {/* Tombol Hapus Baru */}
        <button
          disabled={deletingId === report.id}
          onClick={() => handleDelete(report.id)}
          className={`${base} border border-slate-200 bg-white text-slate-700 hover:border-rose-600 hover:bg-rose-600 hover:text-white focus-visible:outline-rose-600`}
        >
          {deletingId === report.id ? "..." : "Hapus"}
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Header halaman + filter */}
      <div className="mb-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Laporan Sampah
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Total data ditampilkan: {filteredReports.length} dari{" "}
            {reports.length}
          </p>
        </div>

        {/* Filter: satu baris yang bisa digeser di mobile, wrap di >= sm */}
        <div
          role="group"
          aria-label="Filter status laporan"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {filterOptions.map((status) => {
            const active = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => handleFilter(status)}
                aria-pressed={active}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  active
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {status}
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {countFor(status)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div
          role="status"
          aria-label="Memuat data laporan"
          className="space-y-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none"
            />
          ))}
          <span className="sr-only">Memuat data laporan...</span>
        </div>
      ) : filteredReports.length === 0 ? (
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
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
          <p className="mt-3 text-sm text-slate-600">
            Tidak ada laporan dengan status &apos;{selectedStatus}&apos;.
          </p>
        </div>
      ) : (
        <>
          {/* PERUBAHAN LAYOUT (< md): daftar kartu agar tidak perlu scroll horizontal */}
          <ul className="space-y-3 md:hidden">
            {filteredReports.map((report) => (
              <li
                key={report.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex gap-4">
                  {renderPhoto(report, "lg")}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {report.waste_category || "Tidak Diketahui"}
                      </p>
                      {renderStatusBadge(report.status)}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      Confidence:{" "}
                      <span className="font-semibold tabular-nums text-emerald-800">
                        {renderConfidence(report)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  {renderLocation(report)}
                </div>

                <div className="mt-3">{renderActions(report)}</div>
              </li>
            ))}
          </ul>

          {/* Tabel (>= md) */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs md:block">
            <table className="w-full min-w-225 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th scope="col" className="px-4 py-3">
                    Foto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Kategori AI
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Confidence
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Lokasi / Alamat
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tanggal
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Aksi / Ubah Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="align-top transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3">{renderPhoto(report, "sm")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {report.waste_category || "Tidak Diketahui"}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-emerald-800">
                      {renderConfidence(report)}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                      {renderLocation(report)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {renderStatusBadge(report.status)}
                    </td>
                    <td className="px-4 py-3">{renderActions(report)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL POPUP PREVIEW FOTO */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview bukti sampah"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-slate-900/70 text-white transition-colors hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-white"
              title="Tutup"
              aria-label="Tutup preview"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Preview Bukti Sampah"
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
