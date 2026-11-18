import React from "react";
import Link from "next/link";
import {
  Compass,
  FileCheck,
  Clock,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";

export default async function CMSDashboardOverview({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const stats = await db.getTenantStats(tenant.id);
  const destinations = await db.getDestinations({ tenantId: tenant.id });
  const users = await db.getUsers(tenant.id);

  // Map user ID to user details for uploader identity
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e3e8ee]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: tenant.brandColor }}
            />
            <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
              Dashboard CMS — {tenant.name}
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Pengelolaan konten pariwisata, akomodasi, uploader identity, dan modul aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${web}/dashboard/destinations/new`}>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Destinasi
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="light" className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748d] font-medium">Destinasi Terdaftar</span>
            <div className="p-2 rounded-lg bg-[#533afd]/10 text-[#533afd]">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="display-md text-[#0d253d] tnum font-light">{stats.countsByModule.destinations}</div>
          <span className="text-[11px] text-[#64748d] block">
            {destinations.filter((d) => d.status === "PUBLISHED").length} telah tayang di publik
          </span>
        </Card>

        <Card variant="light" className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748d] font-medium">Pengguna Pengelola</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="display-md text-[#0d253d] tnum font-light">{stats.userCount} / 30</div>
          <div className="w-full bg-[#e3e8ee] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${(stats.userCount / 30) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[#64748d] block">
            Kuota server-enforced: maks 30 akun
          </span>
        </Card>

        <Card variant="light" className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748d] font-medium">Menunggu Persetujuan</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="display-md text-[#0d253d] tnum font-light">{stats.pendingCount}</div>
          <span className="text-[11px] text-[#64748d] block">
            {tenant.settings.approvalActive ? "Workflow aktif" : "Workflow approval nonaktif"}
          </span>
        </Card>

        <Card variant="light" className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#64748d] font-medium">Total Seluruh Konten</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="display-md text-[#0d253d] tnum font-light">{stats.totalContents}</div>
          <span className="text-[11px] text-[#64748d] block">
            Termasuk akomodasi, kuliner, dll
          </span>
        </Card>
      </div>

      {/* Main Content: Recent Destinations Table with Uploader Attribution */}
      <Card variant="light" className="p-0 overflow-hidden">
        <div className="p-5 border-b border-[#e3e8ee] flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Destinasi Wisata Terbaru</CardTitle>
            <CardDescription className="text-xs">
              Menampilkan konten terbaru lengkap dengan metadata identitas pengunggah (Uploader Attribution).
            </CardDescription>
          </div>

          <Link href={`/${web}/dashboard/destinations`}>
            <Button variant="ghost" size="sm" className="text-xs text-[#533afd]">
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f6f9fc] border-b border-[#e3e8ee] text-[#64748d] font-medium">
                <th className="py-3 px-4">Nama Destinasi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Tiket</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pengunggah (Uploader)</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]">
              {destinations.slice(0, 5).map((item) => {
                const uploader = userMap.get(item.createdById);
                return (
                  <tr key={item.id} className="hover:bg-[#f6f9fc]/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#0d253d]">
                      <div>
                        <span>{item.name}</span>
                        <span className="text-[11px] text-[#64748d] block font-normal">
                          {item.city}, {item.province}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#273951]">{item.category}</td>

                    <td className="py-3.5 px-4 text-[#0d253d] font-medium tnum">
                      Rp {item.ticketPrice.toLocaleString("id-ID")}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Uploader Attribution Column */}
                    <td className="py-3.5 px-4">
                      <UploaderAvatar
                        name={uploader?.name || "Pengelola Wisata"}
                        avatarUrl={uploader?.avatarUrl}
                        timestamp={item.createdAt}
                        actionText="Diunggah"
                        compact={true}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/${web}/dashboard/destinations/${item.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
