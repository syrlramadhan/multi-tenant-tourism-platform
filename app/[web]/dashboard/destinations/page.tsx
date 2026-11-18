import React from "react";
import Link from "next/link";
import { Plus, Compass, Eye, Edit } from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { UploaderAvatar } from "@/components/shared/uploader-avatar";
import { formatRupiah } from "@/lib/utils";

export default async function CMSDestinationsPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  const isEnabled = await db.isFeatureEnabled(tenant.id, "destinations");
  if (!isEnabled) {
    return (
      <Card variant="light" className="p-8 text-center space-y-3">
        <Compass className="h-10 w-10 text-[#64748d] mx-auto opacity-50" />
        <h2 className="text-lg font-medium text-[#0d253d]">Modul Dinonaktifkan</h2>
        <p className="text-xs text-[#64748d] max-w-md mx-auto">
          Modul Destinasi Wisata sedang dinonaktifkan oleh Superadmin untuk website {tenant.name}.
        </p>
      </Card>
    );
  }

  const destinations = await db.getDestinations({ tenantId: tenant.id });
  const users = await db.getUsers(tenant.id);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Destinasi Wisata — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Kelola objek wisata alam, pesisir, dan cagar budaya dengan pelacakan identitas pengunggah.
          </p>
        </div>

        <Link href={`/${web}/dashboard/destinations/new`}>
          <Button variant="primary" size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Tambah Destinasi Baru
          </Button>
        </Link>
      </div>

      <Card variant="light" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
              <tr>
                <th className="py-3 px-4">Nama Destinasi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Diunggah Oleh</th>
                <th className="py-3 px-4">Terakhir Diperbarui</th>
                <th className="py-3 px-4">Harga Tiket</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]">
              {destinations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#64748d]">
                    Belum ada destinasi wisata yang diunggah.
                  </td>
                </tr>
              ) : (
                destinations.map((d) => {
                  const author = userMap.get(d.createdById);
                  const updater = userMap.get(d.updatedById);

                  return (
                    <tr key={d.id} className="hover:bg-[#f6f9fc]/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/${web}/dashboard/destinations/${d.id}`}
                          className="font-medium text-[#0d253d] hover:text-[#533afd] block truncate max-w-xs"
                        >
                          {d.name}
                        </Link>
                        <span className="text-[10px] text-[#64748d] truncate block">
                          {d.city}, {d.province}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748d]">{d.category}</td>
                      <td className="py-3 px-4">
                        <UploaderAvatar
                          name={author?.name || "Pengguna Terdaftar"}
                          avatarUrl={author?.avatarUrl}
                          timestamp={d.createdAt}
                          actionText=""
                          compact
                        />
                      </td>
                      <td className="py-3 px-4">
                        <UploaderAvatar
                          name={updater?.name || author?.name || "Pengguna"}
                          avatarUrl={updater?.avatarUrl || author?.avatarUrl}
                          timestamp={d.updatedAt}
                          actionText=""
                          compact
                        />
                      </td>
                      <td className="py-3 px-4 tnum font-medium text-[#0d253d]">
                        {formatRupiah(d.ticketPrice)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/${web}/dashboard/destinations/${d.id}`}
                            className="p-1.5 rounded hover:bg-white text-[#533afd] transition-colors"
                            title="Edit & Detail"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/${web}/destinasi/${d.slug}`}
                            target="_blank"
                            className="p-1.5 rounded hover:bg-white text-[#64748d] hover:text-[#0d253d] transition-colors"
                            title="Lihat Halaman Publik"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
