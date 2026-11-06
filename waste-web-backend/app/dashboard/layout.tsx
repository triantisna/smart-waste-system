"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "📊 Statistik Overview" },
    { href: "/dashboard/reports", label: "📋 Manajemen Laporan" },
    { href: "/dashboard/map", label: "🗺️ Peta Persebaran" },
    { href: "/dashboard/users", label: "👥 Manajemen Pengguna" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay untuk mobile saat sidebar terbuka */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar Navigasi */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 text-xl font-bold border-b border-slate-800 flex justify-between items-center">
          <span>Smart Waste Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        {/* suppressHydrationWarning mencegah error mismatch pada path active */}
        <nav className="flex-1 p-4 space-y-2" suppressHydrationWarning>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-2.5 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white font-medium"
                    : "hover:bg-slate-800 text-gray-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/login"
            className="block px-4 py-2 rounded-lg text-red-400 hover:bg-slate-800 transition text-center"
          >
            Keluar (Logout)
          </Link>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Tombol Hamburger untuk Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 md:hidden focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-base md:text-lg font-semibold text-gray-700 truncate">
              Dashboard Panel
            </h1>
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
