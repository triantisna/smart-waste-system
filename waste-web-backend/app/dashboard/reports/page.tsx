"use client";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // State untuk Modal Popup Foto
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // State untuk menyimpan cache alamat berdasarkan koordinat
  const [addresses, setAddresses] = useState<{ [key: string]: string }>({});

  // 1. Deklarasikan fungsi fetchAddresses di atas sebelum digunakan oleh useEffect
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

  // 2. useEffect ditempatkan setelah fetchAddresses dideklarasikan
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

          // Panggil fungsi reverse geocoding
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

  const getStatusBadgeClass = (status: Report["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Manajemen Laporan Sampah
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            Total data ditampilkan: {filteredReports.length} dari{" "}
            {reports.length}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "In Progress", "Completed", "Rejected"].map(
            (status) => (
              <button
                key={status}
                onClick={() => handleFilter(status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedStatus === status
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat data laporan...</p>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm">
            Tidak ada laporan dengan status &apos;{selectedStatus}&apos;.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left border-collapse min-w-225">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th className="p-4">Foto</th>
                <th className="p-4">Kategori AI</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Lokasi / Alamat</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi / Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {filteredReports.map((report) => {
                const isValidImage =
                  report.image_url && report.image_url.startsWith("http");
                const coordKey = `${report.latitude},${report.longitude}`;
                const addressText = addresses[coordKey];

                return (
                  <tr key={report.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      {isValidImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={report.image_url}
                          alt="Bukti Sampah"
                          onClick={() => setSelectedImage(report.image_url)}
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-xs cursor-pointer hover:opacity-80 transition transform hover:scale-105"
                          title="Klik untuk memperbesar foto"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Tidak ada foto
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {report.waste_category || "Tidak Diketahui"}
                    </td>
                    <td className="p-4 font-semibold text-blue-600">
                      {report.confidence !== undefined &&
                      report.confidence !== null
                        ? `${(report.confidence * 100).toFixed(1)}%`
                        : "N/A"}
                    </td>
                    <td className="p-4 text-xs text-gray-600 max-w-xs">
                      {report.latitude && report.longitude ? (
                        <div>
                          <p className="font-medium text-gray-800 mb-0.5">
                            {addressText || "Memuat nama alamat..."}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800 text-[11px]"
                          >
                            Buka di Google Maps ↗
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          Lokasi tidak tersedia
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(report.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          report.status,
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        <button
                          disabled={
                            updatingId === report.id ||
                            report.status === "In Progress"
                          }
                          onClick={() =>
                            handleUpdateStatus(report.id, "In Progress")
                          }
                          className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition cursor-pointer"
                        >
                          Process
                        </button>
                        <button
                          disabled={
                            updatingId === report.id ||
                            report.status === "Completed"
                          }
                          onClick={() =>
                            handleUpdateStatus(report.id, "Completed")
                          }
                          className="rounded bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-100 disabled:opacity-50 transition cursor-pointer"
                        >
                          Complete
                        </button>
                        <button
                          disabled={
                            updatingId === report.id ||
                            report.status === "Rejected"
                          }
                          onClick={() =>
                            handleUpdateStatus(report.id, "Rejected")
                          }
                          className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL POPUP PREVIEW FOTO */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black transition cursor-pointer"
              title="Tutup"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Preview Bukti Sampah"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
