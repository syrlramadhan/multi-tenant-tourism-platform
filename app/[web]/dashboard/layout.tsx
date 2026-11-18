import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Compass,
  Building2,
  Shirt,
  Car,
  UtensilsCrossed,
  UserCheck,
  ShoppingBag,
  Camera,
  ClipboardCheck,
  Users,
  Settings,
  History,
  LayoutDashboard,
  ExternalLink,
  Layers,
  Shield,
  Globe,
  LogOut,
} from "lucide-react";
import { resolveTenantFromWebParam } from "@/lib/tenant/resolver";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  if (!["web-a", "web-b", "web-c"].includes(web)) {
    redirect("/web-a/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${web}/login`);
  }

  const tenantId = resolveTenantFromWebParam(web);
  if (!user.isSuperadmin) {
    const hasAccess = user.tenantMemberships.some((m) => m.tenantId === tenantId);
    if (!hasAccess) {
      redirect(`/${web}/login?error=unauthorized`);
    }
  }

  const currentTenant = (await db.getTenantById(tenantId)) || (await db.getTenantById("tenant-a"))!;
  const userCount = await db.countTenantUsers(currentTenant.id);
  const features = currentTenant.features;

  const currentMembership = user.tenantMemberships.find((m) => m.tenantId === currentTenant.id);
  const roleLabel = user.isSuperadmin
    ? "Superadmin Global"
    : currentMembership?.role === "WEBSITE_ADMIN"
    ? "Admin Website"
    : "Content Manager";

  const navModules = [
    { key: "destinations", label: "Destinasi Wisata", href: `/${web}/dashboard/destinations`, icon: Compass },
    { key: "accommodations", label: "Akomodasi", href: `/${web}/dashboard/accommodations`, icon: Building2 },
    { key: "fashion", label: "Fashion & Souvenir", href: `/${web}/dashboard/fashion`, icon: Shirt },
    { key: "vehicles", label: "Sewa Kendaraan", href: `/${web}/dashboard/vehicles`, icon: Car },
    { key: "culinary", label: "Kuliner & Resto", href: `/${web}/dashboard/culinary`, icon: UtensilsCrossed },
    { key: "tour_guides", label: "Tour Guide", href: `/${web}/dashboard/tour-guides`, icon: UserCheck },
    { key: "groceries", label: "Sembako & Pasar", href: `/${web}/dashboard/groceries`, icon: ShoppingBag },
    { key: "documentations", label: "Dokumentasi & Media", href: `/${web}/dashboard/documentations`, icon: Camera },
  ];

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#e3e8ee] flex flex-col justify-between hidden md:flex flex-shrink-0">
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Website Switcher Card */}
            <div className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">
                  CMS Website Aktif
                </span>
              </div>

              <div className="font-medium text-xs text-[#0d253d] flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentTenant.brandColor }}
                />
                <span className="truncate">{currentTenant.name}</span>
              </div>

              <div className="text-[11px] text-[#533afd] flex items-center justify-between pt-1 border-t border-[#e3e8ee]/60">
                <Link
                  href={`/${web}`}
                  target="_blank"
                  className="hover:underline flex items-center gap-1 text-[11px]"
                >
                  <Globe className="h-3 w-3" />
                  <span>Lihat Portal Publik</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </Link>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#e3e8ee] font-medium text-[#64748d]">
                  {userCount}/30 User
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block px-2 mb-1.5">
                  Menu Utama
                </span>
                <nav className="space-y-0.5 text-xs font-medium">
                  <Link
                    href={`/${web}/dashboard`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#64748d]" />
                    <span>Ringkasan Dashboard</span>
                  </Link>

                  {user.isSuperadmin && (
                    <Link
                      href="/superadmin"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#1c1e54] bg-amber-50 hover:bg-amber-100 transition-colors font-medium border border-amber-200/60"
                    >
                      <Shield className="h-4 w-4 text-amber-600" />
                      <span>Superadmin Console</span>
                    </Link>
                  )}
                </nav>
              </div>

              {/* Module Content */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block">
                    Modul Konten (8)
                  </span>
                  <Layers className="h-3 w-3 text-[#64748d]" />
                </div>
                <nav className="space-y-0.5 text-xs font-medium">
                  {navModules.map((m) => {
                    const isEnabled = features[m.key] !== false;
                    const Icon = m.icon;
                    if (!isEnabled) {
                      return null; // Module hidden when disabled by Superadmin
                    }
                    return (
                      <Link
                        key={m.key}
                        href={m.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                      >
                        <Icon className="h-4 w-4 text-[#64748d]" />
                        <span>{m.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Administrasi */}
              <div>
                <span className="text-[10px] font-semibold text-[#64748d] uppercase tracking-wider block px-2 mb-1.5">
                  Administrasi & Approval
                </span>
                <nav className="space-y-0.5 text-xs font-medium">
                  <Link
                    href={`/${web}/dashboard/approvals`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                  >
                    <ClipboardCheck className="h-4 w-4 text-[#64748d]" />
                    <span>Persetujuan Konten</span>
                  </Link>

                  <Link
                    href={`/${web}/dashboard/users`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-[#64748d]" />
                      <span>Pengguna Website</span>
                    </div>
                    <span className="text-[10px] text-[#64748d] font-semibold bg-[#f6f9fc] px-1.5 py-0.5 rounded">
                      {userCount}/30
                    </span>
                  </Link>

                  <Link
                    href={`/${web}/dashboard/activity-logs`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                  >
                    <History className="h-4 w-4 text-[#64748d]" />
                    <span>Log Aktivitas</span>
                  </Link>

                  <Link
                    href={`/${web}/dashboard/settings`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#0d253d] hover:bg-[#f6f9fc] hover:text-[#533afd] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[#64748d]" />
                    <span>Konfigurasi Website</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* User footer in sidebar */}
          <div className="p-4 border-t border-[#e3e8ee] bg-[#f6f9fc]/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#1c1e54] text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <span className="font-medium text-[#0d253d] block truncate">
                  {user.name}
                </span>
                <span className={`text-[10px] font-semibold block ${user.isSuperadmin ? "text-amber-600" : "text-[#533afd]"}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
            <Link
              href="/api/auth/logout"
              title="Keluar"
              className="text-rose-500 hover:text-rose-300 p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
