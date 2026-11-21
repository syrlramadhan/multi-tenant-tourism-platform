import React from "react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, PaginationBar, pageHref, requestedPage, type PageSearchParams } from "@/components/ui/pagination";
import { ApprovalsClient } from "./approvals-client";
import type { UserData } from "@/lib/db/mock-data";

export default async function CMSApprovalsPage({
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
    db.getApprovalsPage({ tenantId: tenant.id, page: await requestedPage(searchParams), pageSize: DEFAULT_PAGE_SIZE }),
    db.getUsers(tenant.id),
  ]);

  const userMap: Record<string, UserData> = {};
  users.forEach((u) => {
    userMap[u.id] = u;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Persetujuan Konten (Approval Workflow)
          </h1>
          <p className="text-xs text-[#64748d]">
            Tinjau konten yang diajukan oleh Content Manager sebelum dipublikasikan ke website publik.
          </p>
        </div>
      </div>

      {/* Keyed by page so the client's local copy of the list resets when the page changes. */}
      <ApprovalsClient
        key={result.page}
        initialApprovals={result.items}
        userMap={userMap}
      />

      <PaginationBar
        page={result.page}
        pageSize={DEFAULT_PAGE_SIZE}
        total={result.total}
        noun="pengajuan"
        hrefForPage={pageHref(`/${web}/dashboard/approvals`)}
      />
    </div>
  );
}
