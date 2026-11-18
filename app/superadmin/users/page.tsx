import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { SuperadminUsersClient } from "./users-client";

export default async function SuperadminUsersPage() {
  const users = await db.getUsers();
  const tenants = await db.getTenants();

  const tenantCounts: Record<string, number> = {};
  for (const t of tenants) {
    tenantCounts[t.id] = await db.countTenantUsers(t.id);
  }

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
              User Management — Pengelolaan Pengguna Lintas Website
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Pengawasan direktori pengguna global, pembagian peran RBAC, dan validasi kuota batas maksimal 30 pengguna per website.
          </p>
        </div>
      </div>

      <SuperadminUsersClient
        initialUsers={users}
        tenants={tenants}
        tenantCounts={tenantCounts}
      />
    </div>
  );
}
