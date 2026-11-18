import React from "react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { SettingsClient } from "./settings-client";

export default async function CMSSettingsPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  const tenant = await resolveCurrentTenant(web);
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e3e8ee]">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d]">
            Konfigurasi Website — {tenant.name}
          </h1>
          <p className="text-xs text-[#64748d]">
            Atur identitas website, slogan hero, kontak WhatsApp resmi, dan alur persetujuan konten.
          </p>
        </div>
      </div>

      <SettingsClient tenant={tenant} />
    </div>
  );
}
