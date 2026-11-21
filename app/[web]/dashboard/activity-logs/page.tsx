import React from "react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDateTime } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, PaginationBar, pageHref, requestedPage, type PageSearchParams } from "@/components/ui/pagination";

export default async function CMSActivityLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ web: string }>;
  searchParams: PageSearchParams;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const [result, users] = await Promise.all([
    db.getActivityLogsPage({ tenantId: tenant.id, page: await requestedPage(searchParams), pageSize: DEFAULT_PAGE_SIZE }),
    db.getUsers(tenant.id),
  ]);
  const logs = result.items;
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Log Aktivitas Website — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Jejak audit seluruh perubahan konten, persetujuan, dan tindakan staf pengelola.
          </p>
        </div>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
            <tr>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Pengguna (Aktor)</th>
              <th className="py-3 px-4">Aksi</th>
              <th className="py-3 px-4">Entitas</th>
              <th className="py-3 px-4">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#64748d]">
                  Belum ada log aktivitas tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actor = userMap.get(log.actorUserId);
                return (
                  <tr key={log.id} className="hover:bg-[#f6f9fc]/50">
                    <td className="py-3 px-4 tnum whitespace-nowrap text-[#64748d]">
                      {formatIndonesianDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0d253d] whitespace-nowrap">
                      {actor?.name || log.actorUserId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="subdued">{log.action}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#64748d]">{log.entityType}</td>
                    <td className="py-3 px-4 text-[#0d253d]">{log.description}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <PaginationBar
        page={result.page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={result.total}
        noun="log"
        hrefForPage={pageHref(`/${web}/dashboard/activity-logs`)}
      />
    </div>
  );
}
