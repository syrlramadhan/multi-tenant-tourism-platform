import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db, type ContentOverviewItem } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { DEFAULT_PAGE_SIZE, PaginationBar, pageHref, requestedPage, type PageSearchParams } from "@/components/ui/pagination";

const MODULE_LABELS: Record<ContentOverviewItem["module"], string> = {
  destinations: "Destinasi Wisata",
  accommodations: "Akomodasi",
  culinary: "Kuliner",
  vehicles: "Kendaraan",
};

export default async function SuperadminContentsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const [result, tenants, users] = await Promise.all([
    db.getContentOverviewPage({ page: await requestedPage(searchParams), pageSize: DEFAULT_PAGE_SIZE }),
    db.getTenants(),
    db.getUsers(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const tenantMap = new Map(tenants.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/superadmin"
              className="text-[#64748d] hover:text-[#0d253d] p-1 rounded-full hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
              Global Content Management — Pengawasan Seluruh Konten
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Superadmin dapat memantau konten dari seluruh website dengan informasi uploader yang transparan.
          </p>
        </div>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1c1e54] text-white">
            <tr>
              <th className="py-3 px-4">Nama Konten</th>
              <th className="py-3 px-4">Website (Tenant)</th>
              <th className="py-3 px-4">Modul</th>
              <th className="py-3 px-4">Diunggah Oleh</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {result.items.map((c) => {
              const author = userMap.get(c.createdById);
              const tenant = tenantMap.get(c.tenantId);

              return (
                <tr key={`${c.module}-${c.id}`} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3 px-4 font-medium text-[#0d253d] max-w-xs truncate">
                    {c.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 font-medium text-[#0d253d]">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tenant?.brandColor }}
                      />
                      <span>{tenant?.name || c.tenantId}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#64748d]">{MODULE_LABELS[c.module]}</td>
                  <td className="py-3 px-4">
                    <UploaderAvatar
                      name={author?.name || "Pengguna"}
                      avatarUrl={author?.avatarUrl}
                      timestamp={c.createdAt}
                      compact
                    />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} />
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
        noun="konten"
        hrefForPage={pageHref("/superadmin/contents")}
      />
    </div>
  );
}
