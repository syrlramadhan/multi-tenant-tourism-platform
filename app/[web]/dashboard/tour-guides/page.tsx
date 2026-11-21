import React from "react";
import { UserCheck } from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { DEFAULT_PAGE_SIZE, PaginationBar, pageHref, requestedPage, type PageSearchParams } from "@/components/ui/pagination";

export default async function CMSTourGuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ web: string }>;
  searchParams: PageSearchParams;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const isEnabled = await db.isFeatureEnabled(tenant.id, "tour_guides");
  if (!isEnabled) {
    return (
      <Card variant="light" className="p-8 text-center space-y-3">
        <UserCheck className="h-10 w-10 text-[#64748d] mx-auto opacity-50" />
        <h2 className="text-lg font-medium text-[#0d253d]">Modul Dinonaktifkan</h2>
        <p className="text-xs text-[#64748d] max-w-md mx-auto">
          Modul Tour Guide sedang dinonaktifkan oleh Superadmin untuk website {tenant.name}.
        </p>
      </Card>
    );
  }

  const [result, users] = await Promise.all([
    db.getTourGuidesPage({ tenantId: tenant.id, page: await requestedPage(searchParams), pageSize: DEFAULT_PAGE_SIZE }),
    db.getUsers(tenant.id),
  ]);
  const items = result.items;
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Pemandu Wisata & Tour Guide — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Kelola profil dive master, pemandu sejarah cagar budaya, dan tour leader tersertifikasi.
          </p>
        </div>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
            <tr>
              <th className="py-3 px-4">Nama Pemandu</th>
              <th className="py-3 px-4">Pengalaman</th>
              <th className="py-3 px-4">Bahasa</th>
              <th className="py-3 px-4">Keahlian Khusus</th>
              <th className="py-3 px-4">Diunggah Oleh</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {items.map((i) => {
              const author = userMap.get(i.createdById);
              return (
                <tr key={i.id} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3 px-4">
                    <UploaderAvatar name={i.name} avatarUrl={i.profileImage} compact />
                  </td>
                  <td className="py-3 px-4 tnum">{i.experienceYears} Tahun</td>
                  <td className="py-3 px-4 text-[#64748d]">{i.languages.join(", ")}</td>
                  <td className="py-3 px-4 text-[#0d253d] font-medium">{i.expertise}</td>
                  <td className="py-3 px-4">
                    <UploaderAvatar
                      name={author?.name || "Pengguna"}
                      avatarUrl={author?.avatarUrl}
                      timestamp={i.createdAt}
                      compact
                    />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <PaginationBar
        page={result.page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={result.total}
        noun="pemandu"
        hrefForPage={pageHref(`/${web}/dashboard/tour-guides`)}
      />
    </div>
  );
}
