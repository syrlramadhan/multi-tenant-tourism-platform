import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDateTime } from "@/lib/utils";

export default async function SuperadminActivityLogsPage() {
  const logs = await db.getActivityLogs(undefined, 100);
  const tenants = await db.getTenants();
  const users = await db.getUsers();

  const tenantMap = new Map(tenants.map((t) => [t.id, t]));
  const userMap = new Map(users.map((u) => [u.id, u]));

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
              Log Audit Sistem Global (Global Activity Logs)
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Pengawasan rekam jejak sistem lintas seluruh website pariwisata.
          </p>
        </div>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1c1e54] text-white">
            <tr>
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Website (Tenant)</th>
              <th className="py-3 px-4">Pengguna (Aktor)</th>
              <th className="py-3 px-4">Aksi</th>
              <th className="py-3 px-4">Entitas</th>
              <th className="py-3 px-4">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {logs.map((log) => {
              const actor = userMap.get(log.actorUserId);
              const tenant = log.tenantId ? tenantMap.get(log.tenantId) : null;

              return (
                <tr key={log.id} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3 px-4 tnum whitespace-nowrap text-[#64748d]">
                    {formatIndonesianDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {tenant ? (
                      <span className="flex items-center gap-1.5 font-medium text-[#0d253d]">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tenant.brandColor }}
                        />
                        <span>{tenant.name}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Global Platform</span>
                    )}
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
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
