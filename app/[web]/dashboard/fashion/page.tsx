import React from "react";
import { Shirt } from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { formatRupiah } from "@/lib/utils";

export default async function CMSFashionPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const isEnabled = await db.isFeatureEnabled(tenant.id, "fashion");
  if (!isEnabled) {
    return (
      <Card variant="light" className="p-8 text-center space-y-3">
        <Shirt className="h-10 w-10 text-[#64748d] mx-auto opacity-50" />
        <h2 className="text-lg font-medium text-[#0d253d]">Modul Dinonaktifkan</h2>
        <p className="text-xs text-[#64748d] max-w-md mx-auto">
          Modul Fashion & Souvenir sedang dinonaktifkan oleh Superadmin untuk website {tenant.name}.
        </p>
      </Card>
    );
  }

  const items = await db.getFashion({ tenantId: tenant.id });
  const users = await db.getUsers(tenant.id);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Fashion & Cenderamata — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Kelola pakaian pantai tropis, kerajinan tenun, batik keraton, dan suvenir khas lokal.
          </p>
        </div>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
            <tr>
              <th className="py-3 px-4">Nama Produk</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Harga</th>
              <th className="py-3 px-4">Penjual / Toko</th>
              <th className="py-3 px-4">Diunggah Oleh</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e8ee]">
            {items.map((i) => {
              const author = userMap.get(i.createdById);
              return (
                <tr key={i.id} className="hover:bg-[#f6f9fc]/50">
                  <td className="py-3 px-4 font-medium text-[#0d253d]">
                    <span className="block truncate max-w-xs">{i.name}</span>
                  </td>
                  <td className="py-3 px-4 text-[#64748d]">{i.category}</td>
                  <td className="py-3 px-4 font-medium text-[#0d253d] tnum">
                    {formatRupiah(i.price)}
                  </td>
                  <td className="py-3 px-4 text-[#64748d]">{i.sellerName}</td>
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
    </div>
  );
}
