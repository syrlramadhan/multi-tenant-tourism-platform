import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Compass,
  MapPin,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Lock,
} from "lucide-react";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { formatRupiah, formatIndonesianDate } from "@/lib/utils";

export default async function PublicWebPage({
  params,
}: {
  params: Promise<{ web: string }>;
}) {
  const { web } = await params;
  if (!["web-a", "web-b", "web-c"].includes(web)) {
    notFound();
  }

  const tenant = await resolveCurrentTenant(web);
  if (!tenant) {
    notFound();
  }

  const allUsers = await db.getUsers();
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const { settings, features } = tenant;

  // Retrieve published content for this tenant
  const destinations = await db.getDestinations({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const accommodations = await db.getAccommodations({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const culinaries = await db.getCulinaries({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const vehicles = await db.getVehicles({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const fashionItems = await db.getFashion({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });
  const tourGuides = await db.getTourGuides({
    tenantId: tenant.id,
    status: "PUBLISHED",
  });

  return (
    <div className="min-h-screen bg-white text-[#0d253d] font-sans selection:bg-[#533afd] selection:text-white flex flex-col">
      {/* Atmospheric Stripe Gradient Mesh Hero Header */}
      <header className="relative stripe-hero-mesh border-b border-[#e3e8ee] overflow-hidden">
        {/* Navigation Bar */}
        <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm font-semibold"
              style={{ backgroundColor: tenant.brandColor }}
            >
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-light tracking-tight text-[#0d253d] block leading-tight">
                {settings.siteName}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[#273951]">
            {features.destinations !== false && (
              <a href="#destinasi" className="hover:text-[#533afd] transition-colors">
                Destinasi
              </a>
            )}
            {features.accommodations !== false && (
              <a href="#akomodasi" className="hover:text-[#533afd] transition-colors">
                Akomodasi
              </a>
            )}
            {features.culinary !== false && (
              <a href="#kuliner" className="hover:text-[#533afd] transition-colors">
                Kuliner
              </a>
            )}
            {features.vehicles !== false && (
              <a href="#kendaraan" className="hover:text-[#533afd] transition-colors">
                Transportasi
              </a>
            )}
            {features.fashion !== false && (
              <a href="#fashion" className="hover:text-[#533afd] transition-colors">
                Cenderamata
              </a>
            )}
            {features.tour_guides !== false && (
              <a href="#tour-guides" className="hover:text-[#533afd] transition-colors">
                Pemandu
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <WhatsAppButton
              phone={settings.contactPhone}
              label="WhatsApp Kami"
              size="sm"
            />
            <Link href={`/${web}/login`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-[#533afd]" />
                <span>Login CMS</span>
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm border border-white text-xs font-medium text-[#533afd] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Portal Resmi Wisata Terpadu</span>
            </div>

            <h1 className="display-xxl text-[#0d253d] max-w-2xl leading-[1.05]">
              {settings.heroTitle}
            </h1>

            <p className="text-base text-[#273951] font-light max-w-xl leading-relaxed">
              {settings.heroSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a href="#destinasi">
                <Button variant="primary" size="lg">
                  Eksplorasi Destinasi
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </a>

              <WhatsAppButton
                phone={settings.contactPhone}
                size="lg"
                label="Konsultasi Perjalanan"
              />
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,55,112,0.14)] border border-white/60 aspect-[4/3] bg-[#e3e8ee]">
              <Image
                src={settings.heroBannerUrl}
                alt={settings.siteName}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 text-white">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-white/80 block">
                    Kawasan Terpilih
                  </span>
                  <span className="text-base font-medium">{settings.siteName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="flex-1 space-y-24 py-16">
        {/* SECTION 1: DESTINASI WISATA */}
        {features.destinations !== false && destinations.length > 0 && (
          <section id="destinasi" className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-1">
                  Eksplorasi Objek Wisata
                </span>
                <h2 className="display-lg text-[#0d253d]">
                  Destinasi Pilihan & Tempat Menarik
                </h2>
              </div>
              <p className="text-xs text-[#64748d] max-w-md">
                Jelajahi keindahan alam, panorama spektakuler, dan pengalaman wisata tak terlupakan di {settings.siteName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((d) => {
                const uploader = userMap.get(d.createdById);
                return (
                  <Card
                    key={d.id}
                    variant="light"
                    className="p-0 overflow-hidden group hover:shadow-[0_8px_24px_rgba(0,55,112,0.1)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-[#e3e8ee] overflow-hidden">
                        <Image
                          src={d.mainImage}
                          alt={d.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="subdued" className="bg-white/90 backdrop-blur-sm text-[#0d253d]">
                            {d.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <h3 className="text-base font-medium text-[#0d253d] group-hover:text-[#533afd] transition-colors">
                          {d.name}
                        </h3>
                        <p className="text-xs text-[#64748d] line-clamp-2 leading-relaxed">
                          {d.shortDescription}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748d] pt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#533afd]" />
                          <span>{d.city}, {d.province}</span>
                        </div>

                        {/* Uploader Attribution in Destination Card */}
                        <div className="pt-2.5 mt-2 border-t border-[#e3e8ee]/70 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#e3e8ee] flex-shrink-0 border border-white shadow-xs flex items-center justify-center text-[10px] font-semibold text-[#1c1e54]">
                              {uploader?.avatarUrl ? (
                                <Image
                                  src={uploader.avatarUrl}
                                  alt={uploader.name}
                                  fill
                                  className="object-cover"
                                  sizes="24px"
                                />
                              ) : (
                                <span>{uploader?.name ? uploader.name.slice(0, 2).toUpperCase() : "ST"}</span>
                              )}
                            </div>
                            <div className="truncate">
                              <span className="text-[11px] font-medium text-[#0d253d] block truncate">
                                {uploader?.name || "Staf Pengelola"}
                              </span>
                              <span className="text-[10px] text-[#64748d] block font-light">
                                Diunggah {formatIndonesianDate(d.createdAt)}
                              </span>
                            </div>
                          </div>
                          {/* <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex-shrink-0">
                            Verified
                          </span> */}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-[#e3e8ee]/80 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#64748d] uppercase tracking-wider block">
                          Tiket Masuk
                        </span>
                        <span className="text-sm font-semibold text-[#0d253d] tnum">
                          {formatRupiah(d.ticketPrice)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <WhatsAppButton
                          phone={d.whatsappNumber}
                          label="WA"
                          size="sm"
                          message={`Halo, saya tertarik dengan informasi tiket destinasi: ${d.name}`}
                        />
                        <Link href={`/${web}/destinasi/${d.slug}`}>
                          <Button variant="secondary" size="sm">
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: AKOMODASI */}
        {features.accommodations !== false && accommodations.length > 0 && (
          <section id="akomodasi" className="max-w-7xl mx-auto px-6">
            <div className="p-8 md:p-12 card-cream space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#9b6829] uppercase tracking-wider block mb-1">
                    Tempat Menginap Istimewa
                  </span>
                  <h2 className="display-lg text-[#0d253d]">
                    Resor, Kabin, & Vila Peristirahatan
                  </h2>
                </div>
                <p className="text-xs text-[#0d253d]/80 max-w-md">
                  Menginap dengan kenyamanan prima dan panorama alami yang memanjakan jiwa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accommodations.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-xl p-5 border border-[#ecd5af] shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#e3e8ee]">
                        <Image
                          src={a.images[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"}
                          alt={a.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Badge variant="subdued">{a.accommodationType}</Badge>
                      <h3 className="text-base font-medium text-[#0d253d]">{a.name}</h3>
                      <p className="text-xs text-[#64748d]">{a.description}</p>
                      <div className="text-xs font-semibold text-[#533afd] tnum">
                        {a.priceRange}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#e3e8ee] flex items-center justify-between">
                      <span className="text-xs text-[#64748d] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {a.location}
                      </span>
                      <WhatsAppButton
                        phone={a.whatsappNumber}
                        label="Reservasi Kamar"
                        size="sm"
                        message={`Halo, saya ingin menanyakan ketersediaan kamar di: ${a.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: KULINER UNGGULAN */}
        {features.culinary !== false && culinaries.length > 0 && (
          <section id="kuliner" className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-1">
                  Cita Rasa Autentik
                </span>
                <h2 className="display-lg text-[#0d253d]">
                  Kuliner Khas & Tempat Makan
                </h2>
              </div>
              <p className="text-xs text-[#64748d] max-w-md">
                Manjakan lidah dengan sajian rempah khas, hidangan laut segar, dan aroma kopi lokal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {culinaries.map((c) => (
                <Card key={c.id} variant="light" className="p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#e3e8ee]">
                      <Image
                        src={c.images[0] || "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800"}
                        alt={c.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Badge variant="subdued">{c.culinaryType}</Badge>
                    <h3 className="text-base font-medium text-[#0d253d]">{c.name}</h3>
                    <p className="text-xs text-[#64748d]">{c.description}</p>
                    <div className="text-xs text-[#0d253d]">
                      <strong>Menu Unggulan:</strong> {c.menu}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#e3e8ee] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0d253d] tnum">
                      {c.priceRange}
                    </span>
                    <WhatsAppButton
                      phone={c.whatsappNumber}
                      label="Pesan Meja / Menu"
                      size="sm"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: KENDARAAN (Sewa Transportasi) */}
        {features.vehicles !== false && vehicles.length > 0 && (
          <section id="kendaraan" className="max-w-7xl mx-auto px-6">
            <div className="p-8 rounded-2xl bg-[#f6f9fc] border border-[#e3e8ee] space-y-6">
              <div>
                <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block mb-1">
                  Mobilitas & Transportasi
                </span>
                <h2 className="display-lg text-[#0d253d]">
                  Sewa Kendaraan & Kapal Wisata
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-xl p-5 border border-[#e3e8ee] flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#e3e8ee] mb-3">
                        <Image
                          src={v.images[0] || "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800"}
                          alt={v.serviceName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Badge variant="subdued">{v.vehicleType}</Badge>
                      <h3 className="text-base font-medium text-[#0d253d]">{v.serviceName}</h3>
                      <p className="text-xs text-[#64748d]">{v.description}</p>
                      <span className="text-xs text-[#64748d] block">
                        Kapasitas: {v.capacity} Penumpang
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#e3e8ee] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#0d253d] tnum">
                        {formatRupiah(v.rentalPrice)} / hari
                      </span>
                      <WhatsAppButton
                        phone={v.whatsappNumber}
                        label="Sewa Sekarang"
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: FASHION & TOUR GUIDES */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {features.fashion !== false && fashionItems.length > 0 && (
            <div id="fashion" className="space-y-4">
              <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block">
                Cenderamata & Oleh-oleh
              </span>
              <h2 className="text-xl font-light text-[#0d253d]">
                Fashion & Kerajinan Tradisional
              </h2>

              <div className="space-y-3">
                {fashionItems.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-[#e3e8ee] bg-white flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#e3e8ee] flex-shrink-0">
                        <Image
                          src={f.images[0] || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"}
                          alt={f.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#533afd] font-medium block">
                          {f.category}
                        </span>
                        <h4 className="text-xs font-medium text-[#0d253d]">{f.name}</h4>
                        <span className="text-xs font-semibold text-[#0d253d] tnum">
                          {formatRupiah(f.price)}
                        </span>
                      </div>
                    </div>
                    <WhatsAppButton
                      phone={f.whatsappNumber}
                      label="Beli"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {features.tour_guides !== false && tourGuides.length > 0 && (
            <div id="tour-guides" className="space-y-4">
              <span className="text-xs font-semibold text-[#533afd] uppercase tracking-wider block">
                Pemandu Berlisensi
              </span>
              <h2 className="text-xl font-light text-[#0d253d]">
                Tour Guide & Narasumber
              </h2>

              <div className="space-y-3">
                {tourGuides.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl border border-[#e3e8ee] bg-white flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#e3e8ee] flex-shrink-0 border-2 border-white shadow-sm">
                        <Image
                          src={g.profileImage || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200"}
                          alt={g.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#0d253d]">{g.name}</h4>
                        <span className="text-[11px] text-[#64748d] block">{g.expertise}</span>
                        <span className="text-[10px] text-[#533afd] font-medium">
                          {g.experienceYears} Tahun Pengalaman · {g.languages.join(", ")}
                        </span>
                      </div>
                    </div>
                    <WhatsAppButton
                      phone={g.whatsappNumber}
                      label="Hubungi"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Site-Wide Footer */}
      <footer className="border-t border-[#e3e8ee] bg-[#f6f9fc] py-16 px-6 text-xs text-[#64748d]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: tenant.brandColor }}
              />
              <span className="text-sm font-medium text-[#0d253d]">
                {settings.siteName}
              </span>
            </div>
            <p className="text-xs text-[#64748d] leading-relaxed">
              {tenant.description}
            </p>
            <span className="text-[11px] text-[#64748d] block">
              Didukung oleh Multi-Tenant Tourism CMS Platform
            </span>
          </div>

          <div>
            <h4 className="font-semibold text-[#0d253d] mb-3 uppercase tracking-wider text-[11px]">
              Navigasi Modul
            </h4>
            <ul className="space-y-2">
              <li><a href="#destinasi" className="hover:text-[#533afd]">Destinasi Wisata</a></li>
              {features.accommodations !== false && <li><a href="#akomodasi" className="hover:text-[#533afd]">Akomodasi & Resor</a></li>}
              {features.culinary !== false && <li><a href="#kuliner" className="hover:text-[#533afd]">Kuliner Nusantara</a></li>}
              {features.vehicles !== false && <li><a href="#kendaraan" className="hover:text-[#533afd]">Sewa Transportasi</a></li>}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#0d253d] mb-3 uppercase tracking-wider text-[11px]">
              Kontak Resmi
            </h4>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#533afd]" />
                <span>{settings.contactPhone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#533afd]" />
                <span>{settings.contactEmail}</span>
              </p>
              <p className="text-[11px] text-[#64748d]">
                {settings.contactAddress}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#e3e8ee] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© 2026 {settings.siteName}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
