import { PrismaClient } from "@prisma/client";
import {
  INITIAL_ACCOMMODATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_APPROVALS,
  INITIAL_CULINARIES,
  INITIAL_DESTINATIONS,
  INITIAL_DOCUMENTATIONS,
  INITIAL_FASHION,
  INITIAL_GROCERIES,
  INITIAL_TENANTS,
  INITIAL_TOUR_GUIDES,
  INITIAL_USERS,
  INITIAL_VEHICLES,
} from "../lib/db/mock-data";

const prisma = new PrismaClient();

const ROLES = ["SUPERADMIN", "WEBSITE_ADMIN", "CONTENT_MANAGER"];

const FEATURES = [
  { key: "destinations", name: "Destinasi Wisata", description: "Objek wisata alam, bahari, cagar budaya" },
  { key: "accommodations", name: "Akomodasi", description: "Hotel, resor pantai, homestay, vila, glamping" },
  { key: "fashion", name: "Fashion & Souvenir", description: "Kain batik, tenun, kemeja pantai, suvenir khas" },
  { key: "vehicles", name: "Kendaraan", description: "Speedboat, mobil car rental, motor, jeep 4x4" },
  { key: "culinary", name: "Kuliner", description: "Resto seafood, kedai kopi lereng, kuliner tradisional" },
  { key: "tour_guides", name: "Tour Guide", description: "Pemandu diving, pemandu sejarah cagar budaya" },
  { key: "groceries", name: "Sembako", description: "Toko kebutuhan pokok pesisir & hasil bumi" },
  { key: "documentations", name: "Dokumentasi", description: "Liputan festival tahunan, galeri acara, video" },
];

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

// skipDuplicates keeps existing rows (same id / unique key), so the seed can be re-run safely.
async function main() {
  await prisma.role.createMany({ data: ROLES.map((name) => ({ name })), skipDuplicates: true });
  await prisma.feature.createMany({ data: FEATURES, skipDuplicates: true });

  await prisma.tenant.createMany({
    data: INITIAL_TENANTS.map((t) => omit(t, ["domains", "brandColor", "settings", "features"])),
    skipDuplicates: true,
  });
  await prisma.tenantDomain.createMany({
    data: INITIAL_TENANTS.flatMap((t) => t.domains.map((d) => ({ ...d, tenantId: t.id }))),
    skipDuplicates: true,
  });
  await prisma.websiteSetting.createMany({
    data: INITIAL_TENANTS.map((t) => ({ ...t.settings, tenantId: t.id, brandColor: t.brandColor })),
    skipDuplicates: true,
  });
  await prisma.tenantFeature.createMany({
    data: INITIAL_TENANTS.flatMap((t) =>
      Object.entries(t.features).map(([featureKey, isEnabled]) => ({ tenantId: t.id, featureKey, isEnabled }))
    ),
    skipDuplicates: true,
  });

  await prisma.user.createMany({
    data: INITIAL_USERS.map((u) => omit(u, ["tenantMemberships"])),
    skipDuplicates: true,
  });
  const roleIds = new Map((await prisma.role.findMany()).map((r) => [r.name, r.id]));
  await prisma.userTenant.createMany({
    data: INITIAL_USERS.flatMap((u) =>
      u.tenantMemberships.map((m) => ({ userId: u.id, tenantId: m.tenantId, roleId: roleIds.get(m.role)! }))
    ),
    skipDuplicates: true,
  });

  await prisma.destination.createMany({ data: INITIAL_DESTINATIONS, skipDuplicates: true });
  await prisma.accommodation.createMany({ data: INITIAL_ACCOMMODATIONS, skipDuplicates: true });
  await prisma.culinary.createMany({ data: INITIAL_CULINARIES, skipDuplicates: true });
  await prisma.vehicle.createMany({ data: INITIAL_VEHICLES.map((v) => omit(v, ["name"])), skipDuplicates: true });
  await prisma.fashion.createMany({ data: INITIAL_FASHION, skipDuplicates: true });
  await prisma.tourGuide.createMany({ data: INITIAL_TOUR_GUIDES, skipDuplicates: true });
  await prisma.grocery.createMany({ data: INITIAL_GROCERIES.map((g) => omit(g, ["name"])), skipDuplicates: true });
  await prisma.documentation.createMany({ data: INITIAL_DOCUMENTATIONS, skipDuplicates: true });

  // content_approvals has no title column; the referenced entity holds the name.
  await prisma.contentApproval.createMany({
    data: INITIAL_APPROVALS.map((a) => omit(a, ["title"])),
    skipDuplicates: true,
  });
  await prisma.activityLog.createMany({ data: INITIAL_ACTIVITY_LOGS, skipDuplicates: true });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
