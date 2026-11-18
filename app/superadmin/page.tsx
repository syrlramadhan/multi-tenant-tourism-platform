import React from "react";
import Link from "next/link";
import {
  Globe,
  Sliders,
  ArrowRight,
  History,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDateTime } from "@/lib/utils";

export default async function SuperadminOverview() {
  const stats = await db.getGlobalStats();
  const tenants = await db.getTenants();
  const recentLogs = await db.getActivityLogs(undefined, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e3e8ee]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#1c1e54] text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
              Platform Master
            </span>
            <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
              Ringkasan Global Superadmin
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Pengawasan 3 website pariwisata, isolasi tenant, matriks fitur, dan direktori pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/superadmin/features">
            <Button variant="primary" size="sm">
              <Sliders className="h-3.5 w-3.5 mr-1" />
              Kelola Matriks Fitur (ON/OFF)
            </Button>
          </Link>
          <Link href="/superadmin/websites">
            <Button variant="secondary" size="sm">
              Kelola Website
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Total Website</span>
          <span className="text-xl font-light text-[#0d253d] tnum mt-1 block">
            {stats.totalWebsites}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">3 Subdomain Aktif</span>
        </Card>

        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Total Pengguna</span>
          <span className="text-xl font-light text-[#0d253d] tnum mt-1 block">
            {stats.totalUsers}
          </span>
          <span className="text-[10px] text-[#533afd] font-medium">Maks 30/Tenant</span>
        </Card>

        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Total Destinasi</span>
          <span className="text-xl font-light text-[#0d253d] tnum mt-1 block">
            {stats.totalDestinations}
          </span>
          <span className="text-[10px] text-[#64748d]">Destinasi Wisata</span>
        </Card>

        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Semua Konten (8 Modul)</span>
          <span className="text-xl font-light text-[#0d253d] tnum mt-1 block">
            {stats.totalContents}
          </span>
          <span className="text-[10px] text-[#64748d]">Termasuk Akomodasi, dll</span>
        </Card>

        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Terpublikasi</span>
          <span className="text-xl font-light text-emerald-600 tnum mt-1 block">
            {stats.publishedContents}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Tayang di Web</span>
        </Card>

        <Card variant="light" className="p-3">
          <span className="text-[11px] text-[#64748d] block">Menunggu Review</span>
          <span className="text-xl font-light text-amber-600 tnum mt-1 block">
            {stats.pendingReview}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Perlu Tindakan</span>
        </Card>
      </div>

      {/* Website & Tenant Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0d253d] flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-[#533afd]" />
            <span>Kondisi 3 Website Pariwisata (Tenants)</span>
          </h2>
          <Link
            href="/superadmin/websites"
            className="text-xs text-[#533afd] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Detail Website</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tenants.map(async (t) => {
            const tenantStats = await db.getTenantStats(t.id);
            const activeFeaturesCount = Object.values(t.features).filter(Boolean).length;

            return (
              <Card key={t.id} variant="light" className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.brandColor }}
                      />
                      <h3 className="font-medium text-sm text-[#0d253d]">{t.name}</h3>
                    </div>
                    <Badge variant={t.status === "ACTIVE" ? "success" : "danger"}>
                      {t.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#64748d] line-clamp-2 mb-3">
                    {t.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-[#0d253d]">
                    <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]">
                      <span className="text-[#64748d]">Subdomain</span>
                      <span className="font-mono text-[11px] text-[#533afd]">{t.domains[0]?.domain}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]">
                      <span className="text-[#64748d]">Pengguna Terdaftar</span>
                      <span className="font-medium tnum">
                        {tenantStats.userCount} / 30 User
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#e3e8ee]">
                      <span className="text-[#64748d]">Modul Aktif</span>
                      <span className="font-medium text-emerald-600">
                        {activeFeaturesCount} dari 8 Modul ON
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#64748d]">Total Konten</span>
                      <span className="font-medium tnum">{tenantStats.totalContents} Item</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={t.id === "tenant-b" ? "/web-b/dashboard" : t.id === "tenant-c" ? "/web-c/dashboard" : "/web-a/dashboard"}
                    className="flex-1 text-center py-1.5 px-3 rounded-full text-xs font-medium bg-[#f6f9fc] hover:bg-[#e3e8ee] text-[#0d253d] transition-colors"
                  >
                    Buka CMS
                  </Link>
                  <Link
                    href={`/superadmin/features`}
                    className="py-1.5 px-3 rounded-full text-xs font-medium bg-[#533afd]/10 text-[#533afd] hover:bg-[#533afd]/20 transition-colors"
                  >
                    Atur Modul
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Feature Matrix Preview Teaser */}
      <Card variant="light" className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#533afd]" />
              <span>Pratinjau Matriks Ketersediaan Fitur per Website</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Superadmin dapat mengaktifkan atau menonaktifkan modul kapan saja tanpa menghapus data
            </CardDescription>
          </div>
          <Link href="/superadmin/features">
            <Button variant="secondary" size="sm">
              Buka Pengaturan Lengkap
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
              <tr>
                <th className="py-2.5 px-3">Modul Pariwisata</th>
                {tenants.map((t) => (
                  <th key={t.id} className="py-2.5 px-3 text-center">
                    <span className="flex items-center justify-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.brandColor }}
                      />
                      <span>{t.name}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]">
              {[
                { key: "destinations", label: "Destinasi Wisata" },
                { key: "accommodations", label: "Akomodasi" },
                { key: "fashion", label: "Fashion & Souvenir" },
                { key: "vehicles", label: "Kendaraan" },
                { key: "culinary", label: "Kuliner" },
                { key: "tour_guides", label: "Tour Guide" },
                { key: "groceries", label: "Sembako" },
                { key: "documentations", label: "Dokumentasi" },
              ].map((m) => (
                <tr key={m.key} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-2 px-3 font-medium text-[#0d253d]">{m.label}</td>
                  {tenants.map((t) => {
                    const isEnabled = t.features[m.key] !== false;
                    return (
                      <td key={t.id} className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isEnabled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isEnabled ? "ON" : "OFF"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Activity Audit Trail */}
      <Card variant="light" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-[#533afd]" />
            <span>Aktivitas Sistem Terkini (Activity Logs)</span>
          </CardTitle>
          <Link
            href="/superadmin/activity-logs"
            className="text-xs text-[#533afd] hover:underline font-medium"
          >
            Lihat Semua Log
          </Link>
        </div>

        <div className="space-y-3">
          {recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-[#f6f9fc] border border-[#e3e8ee] text-xs"
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-[#0d253d]">{log.action}</span>
                  <span className="text-[10px] bg-white px-2 py-0.2 rounded border border-[#e3e8ee] text-[#64748d]">
                    {log.entityType}
                  </span>
                </div>
                <p className="text-[#64748d]">{log.description}</p>
              </div>
              <span className="text-[11px] text-[#64748d] whitespace-nowrap tnum">
                {formatIndonesianDateTime(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
