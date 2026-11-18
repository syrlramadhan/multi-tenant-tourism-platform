import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Globe,
  Users,
  Sliders,
  FileText,
  History,
  Shield,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/web-a/login");
  }

  // Superadmin guard
  if (!user.isSuperadmin) {
    redirect("/web-a/dashboard");
  }

  const navItems = [
    { label: "Overview Platform", href: "/superadmin", icon: LayoutDashboard },
    { label: "Kelola Website (Tenants)", href: "/superadmin/websites", icon: Globe },
    { label: "Pengguna Global", href: "/superadmin/users", icon: Users },
    { label: "Feature Matrix (Modul ON/OFF)", href: "/superadmin/features", icon: Sliders },
    { label: "Semua Konten Tenant", href: "/superadmin/contents", icon: FileText },
    { label: "Log Audit Sistem", href: "/superadmin/activity-logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* Dark Navy Superadmin Sidebar */}
        <aside className="w-64 bg-[#1c1e54] text-white flex flex-col justify-between hidden md:flex border-r border-[#273951]">
          <div className="p-4 space-y-6">
            {/* Superadmin Platform Badge */}
            <div className="flex items-center gap-2.5 px-2 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#533afd] flex items-center justify-center text-white font-bold shadow-md">
                <Shield className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-tight text-white block">
                  SUPERADMIN PANEL
                </span>
                <span className="text-[10px] text-white/60">
                  Akses Global & Multi-Tenant
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <div>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider block px-2 mb-2">
                Kontrol Platform
              </span>
              <nav className="space-y-1 text-xs font-medium">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[#b9b9f9]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* User profile footer */}
          <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-[#1c1e54] flex items-center justify-center font-bold text-xs flex-shrink-0">
                S
              </div>
              <div className="truncate">
                <span className="font-medium text-white block truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-amber-300 block truncate">
                  Superadmin Global
                </span>
              </div>
            </div>
            <Link
              href="/api/auth/logout"
              title="Keluar"
              className="text-white/60 hover:text-rose-300 p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        {/* Main Superadmin Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
