"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ContentAttributionBox } from "@/components/shared/uploader-avatar";
import type { DestinationItem } from "@/lib/db/mock-data";

export function DestinationForm({
  initialData,
  attribution,
}: {
  initialData?: DestinationItem;
  attribution?: {
    createdByName: string;
    createdByAvatar?: string | null;
    createdAt: string;
    updatedByName: string;
    updatedByAvatar?: string | null;
    updatedAt: string;
    publishedByName?: string | null;
    publishedByAvatar?: string | null;
    publishedAt?: string | null;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pathParts = pathname?.split("/").filter(Boolean) || [];
  const web = pathParts[0]?.startsWith("web-") ? pathParts[0] : (pathParts[1]?.startsWith("web-") ? pathParts[1] : "web-a");
  const backHref = `/${web}/dashboard/destinations`;
  const isEdit = !!initialData;

  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "Wisata Alam & Pesisir");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [province, setProvince] = useState(initialData?.province || "");
  const [ticketPrice, setTicketPrice] = useState(initialData?.ticketPrice?.toString() || "25000");
  const [openingHours, setOpeningHours] = useState(initialData?.openingHours || "08:00 - 17:00 WIB");
  const [facilities, setFacilities] = useState(initialData?.facilities?.join(", ") || "Parkir, Toilet, Gazebo, Warung");
  const [mainImage, setMainImage] = useState(
    initialData?.mainImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
  );
  const [whatsappNumber, setWhatsappNumber] = useState(initialData?.whatsappNumber || "081234567890");
  const [status, setStatus] = useState<DestinationItem["status"]>(initialData?.status || "PUBLISHED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        name,
        category,
        shortDescription,
        description,
        address,
        city,
        province,
        ticketPrice: parseFloat(ticketPrice) || 0,
        openingHours,
        facilities: facilities.split(",").map((s) => s.trim()).filter(Boolean),
        mainImage,
        whatsappNumber,
        status,
      };

      const url = isEdit ? `/api/destinations/${initialData.id}` : "/api/destinations";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan destinasi.");
      }

      setSuccess("Destinasi berhasil disimpan!");
      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !confirm("Apakah Anda yakin ingin menghapus destinasi ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/destinations/${initialData.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus");
      router.push(backHref);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#e3e8ee]">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="text-[#64748d] hover:text-[#0d253d] p-1 rounded-full hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-light tracking-tight text-[#0d253d]">
            {isEdit ? `Edit Destinasi — ${initialData.name}` : "Tambah Destinasi Baru"}
          </h1>
        </div>

        {isEdit && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Hapus Destinasi
          </Button>
        )}
      </div>

      {/* Attribution Box in Edit Mode */}
      {isEdit && attribution && (
        <ContentAttributionBox
          createdByName={attribution.createdByName}
          createdByAvatar={attribution.createdByAvatar}
          createdAt={attribution.createdAt}
          updatedByName={attribution.updatedByName}
          updatedByAvatar={attribution.updatedByAvatar}
          updatedAt={attribution.updatedAt}
          publishedByName={attribution.publishedByName}
          publishedByAvatar={attribution.publishedByAvatar}
          publishedAt={attribution.publishedAt}
        />
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <Card variant="light" className="p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
            Informasi Pokok
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Nama Destinasi *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Pantai Pasir Putih Tanjung Karang"
              />
            </div>

            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Kategori Destinasi *</label>
              <Input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Misal: Pantai & Pesisir, Snorkeling, Cagar Budaya"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#0d253d] font-medium mb-1">Deskripsi Singkat *</label>
            <Input
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ringkasan 1-2 kalimat untuk kartu destinasi..."
            />
          </div>

          <div>
            <label className="block text-[#0d253d] font-medium mb-1">Deskripsi Lengkap *</label>
            <Textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan sejarah, keistimewaan, daya tarik utama, dan informasi penting bagi wisatawan..."
            />
          </div>
        </Card>

        <Card variant="light" className="p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
            Lokasi, Akses & Tiket Masuk
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Alamat Lengkap</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Bahari No. 12"
              />
            </div>

            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Kabupaten / Kota</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kab. Pesisir Barat"
              />
            </div>

            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Provinsi</label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Provinsi Nusantara"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Harga Tiket Masuk (Rp)</label>
              <Input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                placeholder="25000"
              />
            </div>

            <div>
              <label className="block text-[#0d253d] font-medium mb-1">Jam Operasional</label>
              <Input
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="06:00 - 18:30 WIB"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#0d253d] font-medium mb-1">
              Fasilitas (Pisahkan dengan koma)
            </label>
            <Input
              value={facilities}
              onChange={(e) => setFacilities(e.target.value)}
              placeholder="Parkir Luas, Gazebo, Toilet Bersih, Snorkeling Gear, Warung Makan"
            />
          </div>
        </Card>

        <Card variant="light" className="p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
            Media, Kontak WhatsApp & Status Publikasi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#0d253d] font-medium mb-1">URL Foto Utama</label>
              <Input
                value={mainImage}
                onChange={(e) => setMainImage(e.target.value)}
                placeholder="https://..."
              />
              <span className="text-[10px] text-[#64748d] mt-1 block">
                Gambar resolusi tinggi berorientasi lanskap.
              </span>
            </div>

            <div>
              <label className="block text-[#0d253d] font-medium mb-1">
                Nomor WhatsApp Pengelola (Untuk Tombol Click-to-Chat)
              </label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="081234567890"
              />
              <span className="text-[10px] text-[#64748d] mt-1 block">
                Secara otomatis dinormalisasi ke format internasional https://wa.me/62...
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[#0d253d] font-medium mb-1">Status Publikasi</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DestinationItem["status"])}
            >
              <option value="PUBLISHED">Published (Langsung tayang di website publik)</option>
              <option value="PENDING_REVIEW">Pending Review (Kirim untuk persetujuan admin)</option>
              <option value="DRAFT">Draft (Disimpan sebagai draf)</option>
              <option value="ARCHIVED">Archived (Diarsipkan / Tidak ditampilkan)</option>
            </Select>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={backHref}>
            <Button type="button" variant="ghost" size="md">
              Batal
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" isLoading={loading}>
            <Save className="h-4 w-4 mr-1.5" />
            {isEdit ? "Simpan Perubahan Destinasi" : "Terbitkan Destinasi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
