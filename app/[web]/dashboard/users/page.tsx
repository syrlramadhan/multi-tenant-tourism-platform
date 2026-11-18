import React from "react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { TenantUsersClient } from "./tenant-users-client";

export default async function TenantUsersPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const users = await db.getUsers(tenant.id);
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Pengguna Website — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Kelola staf pengelola konten dan administrator untuk website ini (Maksimal 30 pengguna aktif).
          </p>
        </div>
      </div>

      {/* Quota Progress Banner */}
      <Card variant="light" className="p-5 border-[#e3e8ee]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#0d253d] uppercase tracking-wider block">
              STATUS KUOTA PENGGUNA WEBSITE
            </span>
            <p className="text-xs text-[#64748d]">
              Sesuai kebijakan sistem, setiap website dibatasi maksimal 30 pengguna aktif pengelola konten.
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-2xl font-light text-[#0d253d] tnum">
              {activeCount} <span className="text-sm text-[#64748d]">/ 30 Terpakai</span>
            </span>
            <div className="w-48 bg-[#e3e8ee] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#533afd] h-full transition-all"
                style={{ width: `${(activeCount / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      <TenantUsersClient
        tenantId={tenant.id}
        tenantName={tenant.name}
        initialUsers={users}
        activeCount={activeCount}
      />
    </div>
  );
}
