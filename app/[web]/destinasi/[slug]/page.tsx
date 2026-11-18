import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  Ticket,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { ContentAttributionBox } from "@/components/shared/uploader-avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatRupiah,
  formatIndonesianDate,
  formatIndonesianDateTime,
} from "@/lib/utils";

export default async function ScopedDestinationDetailPage({
  params,
}: {
  params: Promise<{ web: string; slug: string }>;
}) {
  const { web, slug } = await params;
  if (!["web-a", "web-b", "web-c"].includes(web)) {
    notFound();
  }

  const tenant = await resolveCurrentTenant(web);
  if (!tenant) notFound();

  const destination = await db.getDestinationBySlug(tenant.id, slug);
  if (!destination) {
    notFound();
  }

  // Retrieve user map for attribution
  const allUsers = await db.getUsers();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const creator = userMap.get(destination.createdById);
  const updater = destination.updatedById ? userMap.get(destination.updatedById) : null;
  const reviewer = destination.publishedById ? userMap.get(destination.publishedById) : null;

  const creatorMembership = creator?.tenantMemberships.find((m) => m.tenantId === tenant.id);
  const creatorRole = creator?.isSuperadmin
    ? "Superadmin Global"
    : creatorMembership?.role === "WEBSITE_ADMIN"
    ? "Website Administrator"
    : "Content Manager";

  // Related destinations
  const allDestinations = await db.getDestinations({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const related = allDestinations
    .filter((d) => d.id !== destination.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-[#0d253d] font-sans flex flex-col">
      {/* Detail Page Hero Header */}
      <div className="bg-[#f6f9fc] border-b border-[#e3e8ee] py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/${web}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#533afd] hover:underline font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda {tenant.name}</span>
          </Link>

          <WhatsAppButton
            phone={destination.whatsappNumber}
            label="Tanya Pengelola via WhatsApp"
            size="sm"
            message={`Halo, saya ingin menanyakan tentang destinasi: ${destination.name}`}
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 space-y-10">
        {/* Title, Badges & Metadata */}
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subdued">{destination.category}</Badge>
          </div>

          <h1 className="display-xl text-[#0d253d]">{destination.name}</h1>

          {/* Primary Metadata & Uploader Info */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#64748d] pt-1 border-b border-[#e3e8ee] pb-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#533afd]" />
              <span>{destination.address}, {destination.city}, {destination.province}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#533afd]" />
              <span>{destination.openingHours}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-[#0d253d]">
              <Ticket className="h-3.5 w-3.5 text-[#533afd]" />
              <span>{formatRupiah(destination.ticketPrice)} per orang</span>
            </span>

            {/* Uploader Quick Attribution Bar */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#e3e8ee]">
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#e3e8ee] border border-white shadow-xs flex items-center justify-center text-[10px] font-semibold text-[#1c1e54] flex-shrink-0">
                {creator?.avatarUrl ? (
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                ) : (
                  <span>{creator?.name ? creator.name.slice(0, 2).toUpperCase() : "ST"}</span>
                )}
              </div>
              <span className="text-[#0d253d] text-xs">
                Diunggah oleh <strong className="font-semibold text-[#533afd]">{creator?.name || "Staf Pengelola"}</strong>
              </span>
              <span className="text-[11px] text-[#64748d]">· {formatIndonesianDate(destination.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Main Photo & Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-[#e3e8ee] shadow-[0_8px_24px_rgba(0,55,112,0.08)]">
            <Image
              src={destination.mainImage}
              alt={destination.name}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>

          {destination.gallery && destination.gallery.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {destination.gallery.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#e3e8ee]"
                >
                  <Image
                    src={img}
                    alt={`${destination.name} galeri ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="prose prose-slate max-w-none text-sm text-[#273951] leading-relaxed space-y-4">
              <h2 className="text-lg font-medium text-[#0d253d] border-b border-[#e3e8ee] pb-2">
                Deskripsi & Daya Tarik
              </h2>
              <p>{destination.description}</p>
            </div>

            {/* Facilities */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#0d253d] uppercase tracking-wider">
                Fasilitas Tersedia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {destination.facilities.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[#f6f9fc] border border-[#e3e8ee]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-[#0d253d]">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Content Attribution Box */}
            <div className="pt-4">
              <ContentAttributionBox
                createdByName={creator?.name || "Staf Pengelola"}
                createdByAvatar={creator?.avatarUrl}
                createdAt={destination.createdAt}
                updatedByName={updater?.name || creator?.name || "Staf Pengelola"}
                updatedByAvatar={updater?.avatarUrl || creator?.avatarUrl}
                updatedAt={destination.updatedAt}
                publishedByName={reviewer?.name || "Superadmin Tourism"}
                publishedByAvatar={reviewer?.avatarUrl}
                publishedAt={destination.publishedAt || destination.createdAt}
              />
            </div>
          </div>

          {/* Sticky Booking / WhatsApp CTA & Uploader Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <Card variant="light" className="p-6 sticky top-20 space-y-5 border-[#e3e8ee] shadow-md">
              <div>
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">
                  Tiket Masuk
                </span>
                <span className="text-2xl font-light text-[#0d253d] tnum">
                  {formatRupiah(destination.ticketPrice)}
                </span>
                <span className="text-xs text-[#64748d] block mt-0.5">
                  Termasuk akses fasilitas dasar & asuransi wisata
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#273951] pt-3 border-t border-[#e3e8ee]">
                <div className="flex justify-between py-1">
                  <span className="text-[#64748d]">Jam Buka</span>
                  <span className="font-medium">{destination.openingHours}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748d]">Lokasi</span>
                  <span className="font-medium">{destination.city}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <WhatsAppButton
                  phone={destination.whatsappNumber}
                  size="lg"
                  className="w-full"
                  label="Hubungi Pengelola via WhatsApp"
                  message={`Halo, saya ingin menanyakan informasi pemesanan tiket untuk: ${destination.name}`}
                />
              </div>

              {/* Uploader Card in Sidebar */}
              <div className="pt-4 border-t border-[#e3e8ee] space-y-2.5">
                <span className="text-[10px] text-[#64748d] uppercase tracking-wider block font-semibold">
                  Pengunggah Konten Terdaftar
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#e3e8ee] border border-white shadow-xs flex items-center justify-center text-xs font-semibold text-[#1c1e54] flex-shrink-0">
                    {creator?.avatarUrl ? (
                      <Image
                        src={creator.avatarUrl}
                        alt={creator.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <span>{creator?.name ? creator.name.slice(0, 2).toUpperCase() : "ST"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[#0d253d] block truncate">
                      {creator?.name || "Staf Pengelola"}
                    </span>
                    <span className="text-[10px] text-[#533afd] font-semibold block">
                      {creatorRole}
                    </span>
                    <span className="text-[10px] text-[#64748d] block font-light">
                      {formatIndonesianDateTime(destination.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Destinations */}
        {related.length > 0 && (
          <div className="pt-8 border-t border-[#e3e8ee] space-y-6">
            <h2 className="display-md text-[#0d253d]">
              Rekomendasi Destinasi Terkait Lainnya
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((d) => {
                const relatedUploader = userMap.get(d.createdById);
                return (
                  <Card
                    key={d.id}
                    variant="light"
                    className="p-0 overflow-hidden flex flex-col justify-between group hover:shadow-[0_8px_24px_rgba(0,55,112,0.08)] transition-all"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-[#e3e8ee]">
                        <Image
                          src={d.mainImage}
                          alt={d.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 space-y-1.5">
                        <h4 className="font-medium text-xs text-[#0d253d]">{d.name}</h4>
                        <span className="text-xs font-semibold text-[#533afd] tnum">
                          {formatRupiah(d.ticketPrice)}
                        </span>

                        {/* Uploader Attribution on Related Card */}
                        <div className="pt-2 mt-2 border-t border-[#e3e8ee]/70 flex items-center gap-2 text-xs">
                          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#e3e8ee] flex-shrink-0 border border-white shadow-xs flex items-center justify-center text-[9px] font-semibold text-[#1c1e54]">
                            {relatedUploader?.avatarUrl ? (
                              <Image
                                src={relatedUploader.avatarUrl}
                                alt={relatedUploader.name}
                                fill
                                className="object-cover"
                                sizes="20px"
                              />
                            ) : (
                              <span>{relatedUploader?.name ? relatedUploader.name.slice(0, 2).toUpperCase() : "ST"}</span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#64748d] truncate">
                            {relatedUploader?.name || "Staf Pengelola"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <Link href={`/${web}/destinasi/${d.slug}`}>
                        <Button variant="secondary" size="sm" className="w-full">
                          Lihat Detail
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
