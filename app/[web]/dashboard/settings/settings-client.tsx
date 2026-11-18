"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { TenantData } from "@/lib/db/mock-data";

export function SettingsClient({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const [siteName, setSiteName] = useState(tenant.settings.siteName);
  const [heroTitle, setHeroTitle] = useState(tenant.settings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(tenant.settings.heroSubtitle);
  const [heroBannerUrl, setHeroBannerUrl] = useState(tenant.settings.heroBannerUrl);
  const [contactPhone, setContactPhone] = useState(tenant.settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(tenant.settings.contactEmail);
  const [contactAddress, setContactAddress] = useState(tenant.settings.contactAddress);
  const [approvalActive, setApprovalActive] = useState(tenant.settings.approvalActive);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName,
          heroTitle,
          heroSubtitle,
          heroBannerUrl,
          contactPhone,
          contactEmail,
          contactAddress,
          approvalActive,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan konfigurasi.");
      setSuccess("Konfigurasi website berhasil disimpan!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs max-w-3xl">
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card variant="light" className="p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
          Identitas & Tampilan Utama
        </h2>

        <div>
          <label className="block text-[#0d253d] font-medium mb-1">Nama Website</label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[#0d253d] font-medium mb-1">Judul Hero (Headline)</label>
          <Input
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[#0d253d] font-medium mb-1">Subjudul Hero (Tagline)</label>
          <Textarea
            rows={2}
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[#0d253d] font-medium mb-1">URL Foto Banner Utama</label>
          <Input
            value={heroBannerUrl}
            onChange={(e) => setHeroBannerUrl(e.target.value)}
            required
          />
        </div>
      </Card>

      <Card variant="light" className="p-6 space-y-4">
        <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
          Kontak Resmi & Dukungan
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#0d253d] font-medium mb-1">Nomor WhatsApp Resmi</label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="081234567890"
            />
          </div>

          <div>
            <label className="block text-[#0d253d] font-medium mb-1">Email Resmi</label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="kontak@wisata.id"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#0d253d] font-medium mb-1">Alamat Kantor / Pusat Informasi</label>
          <Input
            value={contactAddress}
            onChange={(e) => setContactAddress(e.target.value)}
          />
        </div>
      </Card>

      <Card variant="light" className="p-6 space-y-3">
        <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
          Kebijakan Persetujuan Konten (Approval Workflow)
        </h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={approvalActive}
            onChange={(e) => setApprovalActive(e.target.checked)}
            className="rounded text-[#533afd] focus:ring-[#533afd]"
          />
          <span className="font-medium text-[#0d253d]">
            Wajibkan Peninjauan & Persetujuan Admin sebelum Konten Terpublikasi
          </span>
        </label>
        <p className="text-[11px] text-[#64748d] pl-6">
          Jika diaktifkan, konten yang dibuat oleh Content Manager akan berstatus PENDING_REVIEW dan harus disetujui terlebih dahulu oleh Admin Website sebelum tampil di halaman publik.
        </p>
      </Card>

      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="md" isLoading={loading}>
          <Save className="h-4 w-4 mr-1.5" />
          Simpan Konfigurasi
        </Button>
      </div>
    </form>
  );
}
