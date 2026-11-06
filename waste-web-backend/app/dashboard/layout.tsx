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

  // Label tanpa emoji; ikon SVG dirender dari field `icon`.
  const navLinks = [
    { href: "/dashboard", label: "Statistik Overview", icon: "chart" },
    { href: "/dashboard/reports", label: "Manajemen Laporan", icon: "list" },
    { href: "/dashboard/map", label: "Peta Persebaran", icon: "map" },
    { href: "/dashboard/users", label: "Manajemen Pengguna", icon: "users" },
  ];

  // [UI saja] judul header mengikuti menu aktif
  const activeLabel =
    navLinks.find((l) => l.href === pathname)?.label ?? "Dashboard Panel";

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Overlay untuk mobile saat sidebar terbuka */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Navigasi
          PERUBAHAN LAYOUT: drawer off-canvas di < md, sticky setinggi layar di >= md
          (konten di kanan scroll sendiri, sidebar tidak ikut bergeser). */}
      <aside
        aria-label="Navigasi utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col bg-slate-900 text-white transition-transform duration-300 ease-in-out motion-reduce:transition-none md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-500 text-emerald-950">
              <NavIcon name="leaf" className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              Smart Waste Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
            className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400 md:hidden"
          >
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* suppressHydrationWarning mencegah error mismatch pada path active */}
        <nav
          className="flex-1 space-y-1 overflow-y-auto p-3"
          suppressHydrationWarning
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <NavIcon
                  name={link.icon}
                  className={`size-5 shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-3">
          <Link
            href="/login"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-300 transition-colors hover:bg-slate-800 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-red-300"
          >
            <NavIcon name="logout" className="size-5 shrink-0" />
            Keluar (Logout)
          </Link>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header sticky + blur agar tetap terlihat saat konten di-scroll */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Tombol Hamburger untuk Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              aria-expanded={sidebarOpen}
              className="-ml-2 grid size-11 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600 md:hidden"
            >
              <svg
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="truncate text-base font-semibold text-slate-800 md:text-lg">
              {activeLabel}
            </h1>
          </div>

          <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20 sm:inline-flex">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Administrator
          </span>
        </header>

        {/* Batas lebar konten agar tabel/kartu tidak melebar berlebihan di layar ultrawide */}
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/* ---------- Ikon inline (tanpa dependensi tambahan) ---------- */
function NavIcon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 15v3M12 9v9M17 5v13" />
      </>
    ),
    list: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    map: (
      <>
        <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
        <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.3c2.2.7 3.5 2.7 3.5 5.7" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </>
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
