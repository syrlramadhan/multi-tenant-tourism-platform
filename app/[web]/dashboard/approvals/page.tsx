import React from "react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { ApprovalsClient } from "./approvals-client";
import type { UserData } from "@/lib/db/mock-data";

export default async function CMSApprovalsPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const approvals = await db.getApprovals(tenant.id);
  const users = await db.getUsers(tenant.id);

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

      <ApprovalsClient
        initialApprovals={approvals}
        userMap={userMap}
      />
    </div>
  );
}
