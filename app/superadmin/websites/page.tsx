import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SuperadminWebsitesPage() {
  const tenants = await db.getTenants();

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
              Website Management — Pengelolaan Multi-Website
            </h1>
          </div>
          <p className="text-xs text-[#64748d]">
            Konfigurasi domain, branding warna, kuota, dan status operasional ketiga website pariwisata.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tenants.map(async (t) => {
          const stats = await db.getTenantStats(t.id);
          const activeFeatures = Object.entries(t.features).filter(([, v]) => v);

          return (
            <Card key={t.id} variant="light" className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: t.brandColor }}
                  />
                  <div>
                    <h2 className="font-medium text-sm text-[#0d253d]">{t.name}</h2>
                    <span className="text-[11px] text-[#64748d] font-mono">
                      {t.slug}
                    </span>
                  </div>
                </div>
                <Badge variant={t.status === "ACTIVE" ? "success" : "danger"}>
                  {t.status}
                </Badge>
              </div>

              <p className="text-xs text-[#64748d] line-clamp-2">
                {t.description}
              </p>

              <div className="space-y-2 pt-2 border-t border-[#e3e8ee] text-xs">
                <div>
                  <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">
                    Domain / Subdomain
                  </span>
                  <div className="space-y-0.5 mt-0.5">
                    {t.domains.map((d) => (
                      <div
                        key={d.domain}
                        className="flex items-center justify-between text-[11px] font-mono text-[#533afd] bg-[#f6f9fc] p-1.5 rounded"
                      >
                        <span>{d.domain}</span>
                        {d.isPrimary && (
                          <span className="text-[9px] bg-indigo-100 text-[#533afd] px-1.5 py-0.2 rounded font-sans">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748d]">Pengguna Aktif</span>
                  <span className="font-medium tnum">
                    {stats.userCount} / 30 User
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748d]">Modul Diaktifkan</span>
                  <span className="font-medium text-emerald-600">
                    {activeFeatures.length} / 8 Modul ON
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#64748d]">Workflow Persetujuan</span>
                  <span className="font-medium text-[#0d253d]">
                    {t.settings.approvalActive ? "Wajib Approval" : "Publikasi Langsung"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={t.id === "tenant-b" ? "/web-b/dashboard" : t.id === "tenant-c" ? "/web-c/dashboard" : "/web-a/dashboard"}
                  className="flex-1 text-center py-2 px-3 rounded-full text-xs font-medium bg-[#1c1e54] hover:bg-[#12143b] text-white transition-colors"
                >
                  Kelola CMS
                </Link>
                <Link
                  href="/superadmin/features"
                  className="py-2 px-3 rounded-full text-xs font-medium border border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#533afd] transition-colors"
                >
                  Atur Fitur
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="p-2 rounded-full border border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#64748d] hover:text-[#0d253d]"
                  title="Buka Website Publik"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
