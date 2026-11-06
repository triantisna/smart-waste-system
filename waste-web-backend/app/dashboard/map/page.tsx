"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-150 w-full items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 text-gray-500">
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Peta Persebaran Sampah
          </h2>
          <p className="text-xs md:text-sm text-gray-500">
            Menampilkan titik koordinat laporan warga secara real-time. Total
            titik: {reports.length} laporan
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-150 w-full items-center justify-center rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-500">
          Memuat data peta persebaran...
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white p-2">
          <MapWithNoSSR reports={reports} />
        </div>
      )}
    </div>
  );
}
