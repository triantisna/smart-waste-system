"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Perbaikan ikon default Leaflet tanpa tipe 'any'
const DefaultIcon = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: string;
};
delete DefaultIcon._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

interface MapComponentProps {
  reports: Report[];
}

export default function MapComponent({ reports }: MapComponentProps) {
  // Inisialisasi state langsung tanpa useEffect untuk menghindari cascading render
  const [isMounted] = useState(() => typeof window !== "undefined");

  if (!isMounted) {
    return (
      <div className="flex h-150 w-full items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
        Memuat peta...
      </div>
    );
  }

  const defaultCenter: [number, number] =
    reports.length > 0 && reports[0].latitude && reports[0].longitude
      ? [reports[0].latitude, reports[0].longitude]
      : [-6.9175, 107.6191]; // Default Bandung

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={false}
      style={{
        height: "600px",
        width: "100%",
        borderRadius: "12px",
        zIndex: 0,
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {reports.map((report) => {
        if (!report.latitude || !report.longitude) return null;

        const isValidImage =
          report.image_url && report.image_url.startsWith("http");

        return (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
          >
            <Popup>
              <div className="p-1 space-y-2 max-w-xs">
                {isValidImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={report.image_url}
                    alt="Bukti Sampah"
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 italic">
                    Foto tidak tersedia
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {report.waste_category || "Sampah Terdeteksi"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence:{" "}
                    {report.confidence !== undefined &&
                    report.confidence !== null
                      ? `${(report.confidence * 100).toFixed(1)}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    <span className="font-semibold">{report.status}</span>
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-blue-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                >
                  Buka di Google Maps ↗
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
