import {
  Prisma,
  PrismaClient,
  type Accommodation,
  type ActivityLog,
  type ContentApproval,
  type Culinary,
  type Destination,
  type Documentation,
  type Fashion,
  type Grocery,
  type TourGuide,
  type Vehicle,
} from "@prisma/client";
import type {
  TenantData,
  UserData,
  UserWithPassword,
  DestinationItem,
  AccommodationItem,
  CulinaryItem,
  VehicleItem,
  FashionItem,
  TourGuideItem,
  GroceryItem,
  DocumentationItem,
  ContentApprovalItem,
  ActivityLogItem,
} from "./mock-data";

function createPrismaClient() {
  // Password hashes are only loaded by queries that opt back in (login).
  return new PrismaClient({ omit: { user: { passwordHash: true } } });
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type ContentModuleName =
  | "destinations"
  | "accommodations"
  | "culinary"
  | "vehicles"
  | "fashion"
  | "tour_guides"
  | "groceries"
  | "documentations";

type ContentStatus = DestinationItem["status"];
type MembershipRole = UserData["tenantMemberships"][number]["role"];
type ContentFilter = { tenantId?: string; status?: ContentStatus; search?: string };
type SortById = { createdAt?: Prisma.SortOrder; id?: Prisma.SortOrder }[];
type PageRequest = { page: number; pageSize: number };
type Paginated<T> = { items: T[]; total: number; page: number; totalPages: number };

type OverviewModule = Extract<ContentModuleName, "destinations" | "accommodations" | "culinary" | "vehicles">;
export type ContentOverviewItem = {
  id: string;
  tenantId: string;
  title: string;
  module: OverviewModule;
  status: ContentStatus;
  createdById: string;
  createdAt: string;
};
type ContentOverviewRow = {
  id: string;
  tenant_id: string;
  title: string;
  module: OverviewModule;
  status: ContentStatus;
  created_by: string;
  created_at: Date;
};

const USER_QUOTA = 30;
const MISSING_CONTENT_TITLE = "(Konten tidak ditemukan)";
const newestFirst: SortById = [{ createdAt: "desc" }, { id: "desc" }];
const oldestFirst: SortById = [{ createdAt: "asc" }, { id: "asc" }];

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
const iso = (date: Date) => date.toISOString();

function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
}

// Prisma implements `contains` and case-insensitive `equals` with (I)LIKE and passes % and _ through
// as wildcards; escape them so lookups stay literal.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

const emailEquals = (email: string) => ({ equals: escapeLike(email.trim()), mode: "insensitive" as const });

function textSearch<F extends string>(fields: readonly F[], search?: string) {
  if (!search) return undefined;
  const filter = { contains: escapeLike(search), mode: "insensitive" as const };
  return fields.map((field) => ({ [field]: filter }) as Partial<Record<F, typeof filter>>);
}

const contentWhere = (filter?: ContentFilter) => ({
  deletedAt: null,
  tenantId: filter?.tenantId,
  status: filter?.status,
});

async function paginate<Row, Item>(
  request: PageRequest,
  count: () => Promise<number>,
  findPage: (range: { skip: number; take: number }) => Promise<Row[]>,
  toItem: (row: Row) => Item
): Promise<Paginated<Item>> {
  const total = await count();
  const totalPages = Math.max(1, Math.ceil(total / request.pageSize));
  // Invalid or out-of-range page numbers (e.g. hand-edited URLs) are clamped.
  const page = Math.min(Math.max(1, Math.trunc(request.page) || 1), totalPages);
  const rows = await findPage({ skip: (page - 1) * request.pageSize, take: request.pageSize });
  return { items: rows.map(toItem), total, page, totalPages };
}

async function nullIfMissing<T>(query: Promise<T>): Promise<T | null> {
  try {
    return await query;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
    throw error;
  }
}

type AuditRow = Pick<Destination, "createdById" | "updatedById" | "publishedById" | "createdAt" | "updatedAt" | "publishedAt">;

function auditFields(row: AuditRow) {
  return {
    createdById: row.createdById,
    updatedById: row.updatedById,
    publishedById: row.publishedById ?? undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    publishedAt: row.publishedAt ? iso(row.publishedAt) : undefined,
  };
}

function createAudit(status: ContentStatus | undefined, userId: string) {
  const published = status === "PUBLISHED";
  return {
    createdById: userId,
    updatedById: userId,
    publishedById: published ? userId : null,
    publishedAt: published ? new Date() : null,
  };
}

// Publication attribution is recorded when content moves into PUBLISHED.
function updateAudit(previous: ContentStatus, next: ContentStatus | undefined, userId: string) {
  const publishing = next === "PUBLISHED" && previous !== "PUBLISHED";
  return {
    updatedById: userId,
    ...(publishing ? { publishedById: userId, publishedAt: new Date() } : {}),
  };
}

// -----------------------------------------------------------------------------
// ROW MAPPERS (database rows -> plain, client-serializable items)
// -----------------------------------------------------------------------------
const SETTINGS_FIELDS = [
  "siteName",
  "logoUrl",
  "faviconUrl",
  "heroTitle",
  "heroSubtitle",
  "heroBannerUrl",
  "contactPhone",
  "contactEmail",
  "contactAddress",
  "seoTitle",
  "seoDescription",
  "approvalActive",
] as const;

const tenantInclude = {
  domains: { orderBy: [{ isPrimary: "desc" }, { domain: "asc" }] },
  websiteSettings: true,
  features: true,
} satisfies Prisma.TenantInclude;

type TenantRow = Prisma.TenantGetPayload<{ include: typeof tenantInclude }>;

function toTenant(row: TenantRow): TenantData {
  const settings = row.websiteSettings;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    status: row.status,
    domains: row.domains.map((d) => ({ domain: d.domain, isPrimary: d.isPrimary })),
    brandColor: settings?.brandColor ?? "#533afd",
    settings: {
      siteName: settings?.siteName ?? row.name,
      logoUrl: settings?.logoUrl ?? undefined,
      faviconUrl: settings?.faviconUrl ?? undefined,
      heroTitle: settings?.heroTitle ?? "",
      heroSubtitle: settings?.heroSubtitle ?? "",
      heroBannerUrl: settings?.heroBannerUrl ?? "",
      contactPhone: settings?.contactPhone ?? "",
      contactEmail: settings?.contactEmail ?? "",
      contactAddress: settings?.contactAddress ?? "",
      seoTitle: settings?.seoTitle ?? "",
      seoDescription: settings?.seoDescription ?? "",
      approvalActive: settings?.approvalActive ?? false,
    },
    features: Object.fromEntries(row.features.map((f) => [f.featureKey, f.isEnabled])),
  };
}

const userInclude = {
  userTenants: {
    select: { tenantId: true, role: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude; omit: { passwordHash: true } }>;

function toUser(row: UserRow): UserData {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatarUrl ?? "",
    phone: row.phone ?? "",
    isSuperadmin: row.isSuperadmin,
    status: row.status,
    tenantMemberships: row.userTenants.map((m) => ({
      tenantId: m.tenantId,
      role: m.role.name as MembershipRole,
    })),
    createdAt: iso(row.createdAt),
  };
}

const USER_FIELDS = ["name", "email", "avatarUrl", "phone", "isSuperadmin", "status"] as const;

const DESTINATION_FIELDS = [
  "name",
  "slug",
  "category",
  "shortDescription",
  "description",
  "address",
  "city",
  "province",
  "latitude",
  "longitude",
  "ticketPrice",
  "openingHours",
  "facilities",
  "mainImage",
  "gallery",
  "whatsappNumber",
  "status",
  "isFeatured",
  "seoTitle",
  "seoDescription",
] as const;

function toDestination(row: Destination): DestinationItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    slug: row.slug,
    category: row.category,
    shortDescription: row.shortDescription,
    description: row.description,
    address: row.address,
    city: row.city,
    province: row.province,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    ticketPrice: row.ticketPrice.toNumber(),
    openingHours: row.openingHours,
    facilities: row.facilities,
    mainImage: row.mainImage,
    gallery: row.gallery,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    isFeatured: row.isFeatured,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    ...auditFields(row),
  };
}

const ACCOMMODATION_FIELDS = [
  "name",
  "slug",
  "accommodationType",
  "description",
  "address",
  "location",
  "priceRange",
  "facilities",
  "images",
  "whatsappNumber",
  "status",
  "isFeatured",
] as const;

function toAccommodation(row: Accommodation): AccommodationItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    slug: row.slug,
    accommodationType: row.accommodationType,
    description: row.description,
    address: row.address,
    location: row.location,
    priceRange: row.priceRange,
    facilities: row.facilities,
    images: row.images,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    isFeatured: row.isFeatured,
    ...auditFields(row),
  };
}

const CULINARY_FIELDS = [
  "name",
  "slug",
  "culinaryType",
  "description",
  "address",
  "location",
  "menu",
  "priceRange",
  "openingHours",
  "images",
  "whatsappNumber",
  "status",
  "isFeatured",
] as const;

function toCulinary(row: Culinary): CulinaryItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    slug: row.slug,
    culinaryType: row.culinaryType,
    description: row.description,
    address: row.address,
    location: row.location,
    menu: row.menu ?? "",
    priceRange: row.priceRange,
    openingHours: row.openingHours,
    images: row.images,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    isFeatured: row.isFeatured,
    ...auditFields(row),
  };
}

const VEHICLE_FIELDS = [
  "serviceName",
  "vehicleType",
  "description",
  "rentalPrice",
  "capacity",
  "images",
  "location",
  "whatsappNumber",
  "status",
] as const;

function toVehicle(row: Vehicle): VehicleItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    serviceName: row.serviceName,
    vehicleType: row.vehicleType,
    description: row.description,
    rentalPrice: row.rentalPrice.toNumber(),
    capacity: row.capacity,
    images: row.images,
    location: row.location,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    ...auditFields(row),
  };
}

const FASHION_FIELDS = [
  "name",
  "slug",
  "description",
  "category",
  "price",
  "images",
  "sellerName",
  "location",
  "whatsappNumber",
  "status",
] as const;

function toFashion(row: Fashion): FashionItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    price: row.price.toNumber(),
    images: row.images,
    sellerName: row.sellerName,
    location: row.location,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    ...auditFields(row),
  };
}

const TOUR_GUIDE_FIELDS = [
  "name",
  "profileImage",
  "description",
  "experienceYears",
  "languages",
  "expertise",
  "portfolio",
  "location",
  "whatsappNumber",
  "status",
] as const;

function toTourGuide(row: TourGuide): TourGuideItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    profileImage: row.profileImage ?? "",
    description: row.description,
    experienceYears: row.experienceYears,
    languages: row.languages,
    expertise: row.expertise,
    portfolio: row.portfolio ?? "",
    location: row.location,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    ...auditFields(row),
  };
}

const GROCERY_FIELDS = ["storeName", "description", "products", "address", "images", "whatsappNumber", "status"] as const;

function toGrocery(row: Grocery): GroceryItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    storeName: row.storeName,
    description: row.description,
    products: row.products,
    address: row.address,
    images: row.images,
    whatsappNumber: row.whatsappNumber ?? "",
    status: row.status,
    ...auditFields(row),
  };
}

const DOCUMENTATION_FIELDS = [
  "title",
  "description",
  "documentationType",
  "mediaUrl",
  "gallery",
  "location",
  "socialMediaLink",
  "status",
] as const;

// Accepts date-only values ("2026-11-10") as well as full ISO timestamps.
const toEventDate = (value?: string) => (value === undefined ? undefined : value ? new Date(value) : null);

function toDocumentation(row: Documentation): DocumentationItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    documentationType: row.documentationType,
    mediaUrl: row.mediaUrl,
    gallery: row.gallery,
    eventDate: row.eventDate ? iso(row.eventDate) : "",
    location: row.location ?? "",
    socialMediaLink: row.socialMediaLink ?? undefined,
    status: row.status,
    ...auditFields(row),
  };
}

function toApproval(row: ContentApproval, title: string): ContentApprovalItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    entityType: row.entityType,
    entityId: row.entityId,
    title,
    requestedById: row.requestedById,
    reviewedById: row.reviewedById ?? undefined,
    status: row.status,
    rejectionReason: row.rejectionReason ?? undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function toActivityLog(row: ActivityLog): ActivityLogItem {
  return {
    id: row.id,
    tenantId: row.tenantId ?? undefined,
    actorUserId: row.actorUserId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    description: row.description,
    createdAt: iso(row.createdAt),
  };
}

// content_approvals stores only entity references; titles come from the referenced content.
const titleLookups: Record<ContentModuleName, (ids: string[]) => Promise<{ id: string; title: string }[]>> = {
  destinations: async (ids) =>
    (await prisma.destination.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map(
      (r) => ({ id: r.id, title: r.name })
    ),
  accommodations: async (ids) =>
    (await prisma.accommodation.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map(
      (r) => ({ id: r.id, title: r.name })
    ),
  culinary: async (ids) =>
    (await prisma.culinary.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((r) => ({
      id: r.id,
      title: r.name,
    })),
  vehicles: async (ids) =>
    (await prisma.vehicle.findMany({ where: { id: { in: ids } }, select: { id: true, serviceName: true } })).map(
      (r) => ({ id: r.id, title: r.serviceName })
    ),
  fashion: async (ids) =>
    (await prisma.fashion.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((r) => ({
      id: r.id,
      title: r.name,
    })),
  tour_guides: async (ids) =>
    (await prisma.tourGuide.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((r) => ({
      id: r.id,
      title: r.name,
    })),
  groceries: async (ids) =>
    (await prisma.grocery.findMany({ where: { id: { in: ids } }, select: { id: true, storeName: true } })).map(
      (r) => ({ id: r.id, title: r.storeName })
    ),
  documentations: async (ids) =>
    (await prisma.documentation.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map(
      (r) => ({ id: r.id, title: r.title })
    ),
};

const isContentModule = (value: string): value is ContentModuleName => Object.hasOwn(titleLookups, value);

async function contentTitles(refs: { entityType: string; entityId: string }[]) {
  const idsByModule = new Map<ContentModuleName, string[]>();
  for (const { entityType, entityId } of refs) {
    if (isContentModule(entityType)) idsByModule.set(entityType, [...(idsByModule.get(entityType) ?? []), entityId]);
  }

  const titles = new Map<string, string>();
  await Promise.all(
    [...idsByModule].map(async ([moduleName, ids]) => {
      for (const { id, title } of await titleLookups[moduleName](ids)) titles.set(`${moduleName}:${id}`, title);
    })
  );
  return (ref: { entityType: string; entityId: string }) =>
    titles.get(`${ref.entityType}:${ref.entityId}`) ?? MISSING_CONTENT_TITLE;
}

type StatusCounts = Partial<Record<ContentStatus, number>>;

async function contentStatusCounts(tenantId?: string): Promise<Record<ContentModuleName, StatusCounts>> {
  const where = { tenantId, deletedAt: null };
  const toCounts = (rows: { status: ContentStatus; _count: { _all: number } }[]): StatusCounts =>
    Object.fromEntries(rows.map((r) => [r.status, r._count._all]));

  const [destinations, accommodations, culinary, vehicles, fashion, tourGuides, groceries, documentations] =
    await Promise.all([
      prisma.destination.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.accommodation.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.culinary.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.vehicle.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.fashion.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.tourGuide.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.grocery.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.documentation.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);

  return {
    destinations: toCounts(destinations),
    accommodations: toCounts(accommodations),
    culinary: toCounts(culinary),
    vehicles: toCounts(vehicles),
    fashion: toCounts(fashion),
    tour_guides: toCounts(tourGuides),
    groceries: toCounts(groceries),
    documentations: toCounts(documentations),
  };
}

const totalOf = (counts: StatusCounts) => Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

function summarize(byModule: Record<ContentModuleName, StatusCounts>) {
  const modules = Object.values(byModule);
  return {
    total: modules.reduce((sum, c) => sum + totalOf(c), 0),
    published: modules.reduce((sum, c) => sum + (c.PUBLISHED ?? 0), 0),
    draft: modules.reduce((sum, c) => sum + (c.DRAFT ?? 0), 0),
  };
}

const PUBLISH = { status: "PUBLISHED" } as const;

export const db = {
  // ---------------------------------------------------------------------------
  // TENANTS
  // ---------------------------------------------------------------------------
  async getTenants(): Promise<TenantData[]> {
    const rows = await prisma.tenant.findMany({ include: tenantInclude, orderBy: oldestFirst });
    return rows.map(toTenant);
  },

  async getTenantById(id: string): Promise<TenantData | null> {
    const row = await prisma.tenant.findUnique({ where: { id }, include: tenantInclude });
    return row ? toTenant(row) : null;
  },

  async getTenantBySlug(slug: string): Promise<TenantData | null> {
    const row = await prisma.tenant.findUnique({ where: { slug }, include: tenantInclude });
    return row ? toTenant(row) : null;
  },

  async getTenantByDomain(domain: string): Promise<TenantData | null> {
    const host = domain.toLowerCase().split(":")[0];
    if (!/^[a-z0-9.-]+$/.test(host)) return null;
    // Stored domains may carry a dev port (e.g. "wisata-a.localhost:3000"), so match on the hostname.
    const match = await prisma.tenantDomain.findFirst({
      where: {
        OR: [
          { domain: { equals: host, mode: "insensitive" } },
          { domain: { startsWith: `${host}:`, mode: "insensitive" } },
        ],
      },
      select: { tenant: { include: tenantInclude } },
    });
    return match ? toTenant(match.tenant) : null;
  },

  async createTenant(data: Omit<TenantData, "id">): Promise<TenantData> {
    const row = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        domains: { create: data.domains.map((d) => ({ domain: d.domain.toLowerCase(), isPrimary: d.isPrimary })) },
        websiteSettings: { create: { ...pick(data.settings, SETTINGS_FIELDS), brandColor: data.brandColor } },
        features: {
          create: Object.entries(data.features).map(([featureKey, isEnabled]) => ({ featureKey, isEnabled })),
        },
      },
      include: tenantInclude,
    });
    return toTenant(row);
  },

  async updateTenant(
    id: string,
    data: Partial<Pick<TenantData, "name" | "slug" | "description" | "status">>
  ): Promise<TenantData | null> {
    const row = await nullIfMissing(
      prisma.tenant.update({
        where: { id },
        data: pick(data, ["name", "slug", "description", "status"]),
        include: tenantInclude,
      })
    );
    return row ? toTenant(row) : null;
  },

  async updateTenantFeature(tenantId: string, featureKey: string, isEnabled: boolean): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) return false;
    await prisma.tenantFeature.upsert({
      where: { tenantId_featureKey: { tenantId, featureKey } },
      create: { tenantId, featureKey, isEnabled },
      update: { isEnabled },
    });
    return true;
  },

  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { features: { where: { featureKey }, select: { isEnabled: true } } },
    });
    // Default to true if not explicitly disabled
    return !!tenant && tenant.features[0]?.isEnabled !== false;
  },

  async updateWebsiteSettings(tenantId: string, settings: Partial<TenantData["settings"]>): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
    if (!tenant) return false;
    const data = pick(settings, SETTINGS_FIELDS);
    await prisma.websiteSetting.upsert({
      where: { tenantId },
      create: { siteName: tenant.name, ...data, tenantId },
      update: data,
    });
    return true;
  },

  // ---------------------------------------------------------------------------
  // USERS & QUOTA MANAGEMENT (Max 30 users per tenant)
  // ---------------------------------------------------------------------------
  async getUsers(tenantId?: string): Promise<UserData[]> {
    const rows = await prisma.user.findMany({
      where: tenantId ? { userTenants: { some: { tenantId } } } : undefined,
      include: userInclude,
      orderBy: oldestFirst,
    });
    return rows.map(toUser);
  },

  async getUserById(id: string): Promise<UserData | null> {
    const row = await prisma.user.findUnique({ where: { id }, include: userInclude });
    return row ? toUser(row) : null;
  },

  /** Includes the password hash; only for authentication. */
  async getUserByEmail(email: string): Promise<UserWithPassword | null> {
    const row = await prisma.user.findFirst({
      where: { email: emailEquals(email) },
      include: userInclude,
      omit: { passwordHash: false },
    });
    return row ? { ...toUser(row), passwordHash: row.passwordHash } : null;
  },

  async countTenantUsers(tenantId: string): Promise<number> {
    return prisma.user.count({ where: { status: "ACTIVE", userTenants: { some: { tenantId } } } });
  },

  /**
   * Safe server-side user creation with strict MAX 30 USERS quota check
   */
  async createUser(
    data: Omit<UserWithPassword, "id" | "createdAt">
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    const emailTaken = await prisma.user.findFirst({
      where: { email: emailEquals(data.email) },
      select: { id: true },
    });
    if (emailTaken) {
      return { success: false, error: "Email sudah terdaftar dalam sistem." };
    }

    const roles = await prisma.role.findMany({
      where: { name: { in: data.tenantMemberships.map((m) => m.role) } },
      select: { id: true, name: true },
    });
    const roleIds = new Map(roles.map((r) => [r.name, r.id]));

    try {
      const result = await prisma.$transaction(async (tx) => {
        for (const { tenantId } of data.tenantMemberships) {
          // Lock the tenant row so concurrent requests cannot both pass the quota check.
          await tx.$executeRaw`SELECT 1 FROM "tenants" WHERE "id" = ${tenantId} FOR UPDATE`;
          const activeCount = await tx.user.count({
            where: { status: "ACTIVE", userTenants: { some: { tenantId } } },
          });
          if (activeCount >= USER_QUOTA) return { activeCount };
        }

        const row = await tx.user.create({
          data: {
            name: data.name,
            email: data.email.trim(),
            passwordHash: data.passwordHash,
            avatarUrl: data.avatarUrl,
            phone: data.phone,
            isSuperadmin: data.isSuperadmin,
            status: data.status,
            userTenants: {
              create: data.tenantMemberships.map((m) => ({ tenantId: m.tenantId, roleId: roleIds.get(m.role)! })),
            },
          },
          include: userInclude,
        });
        return { row };
      }, { maxWait: 10_000, timeout: 20_000 }); // generous: a remote DB can take ~1s per round trip

      if ("activeCount" in result) {
        return {
          success: false,
          error: `Batas kuota maksimal 30 pengguna untuk website ini telah tercapai (saat ini: ${result.activeCount}/30).`,
        };
      }
      return { success: true, user: toUser(result.row) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { success: false, error: "Email sudah terdaftar dalam sistem." };
      }
      throw error;
    }
  },

  async updateUser(
    id: string,
    data: Partial<Pick<UserData, (typeof USER_FIELDS)[number]>>
  ): Promise<UserData | null> {
    const row = await nullIfMissing(
      prisma.user.update({ where: { id }, data: pick(data, USER_FIELDS), include: userInclude })
    );
    return row ? toUser(row) : null;
  },

  async deleteUser(id: string): Promise<boolean> {
    // Deactivate instead of deleting to keep content attribution intact
    const { count } = await prisma.user.updateMany({ where: { id }, data: { status: "INACTIVE" } });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 1. DESTINATIONS
  // ---------------------------------------------------------------------------
  async getDestinations(options?: ContentFilter & { category?: string; isFeatured?: boolean }): Promise<DestinationItem[]> {
    const rows = await prisma.destination.findMany({
      where: {
        ...contentWhere(options),
        isFeatured: options?.isFeatured,
        category: options?.category ? { contains: escapeLike(options.category), mode: "insensitive" } : undefined,
        OR: textSearch(["name", "shortDescription"], options?.search),
      },
      orderBy: newestFirst,
    });
    return rows.map(toDestination);
  },

  async getDestinationsPage(options: ContentFilter & PageRequest): Promise<Paginated<DestinationItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["name", "shortDescription"], options.search) };
    return paginate(
      options,
      () => prisma.destination.count({ where }),
      (range) => prisma.destination.findMany({ where, orderBy: newestFirst, ...range }),
      toDestination
    );
  },

  async getDestinationBySlug(tenantId: string, slug: string): Promise<DestinationItem | null> {
    const row = await prisma.destination.findFirst({ where: { tenantId, slug, deletedAt: null } });
    return row ? toDestination(row) : null;
  },

  async getDestinationById(id: string): Promise<DestinationItem | null> {
    const row = await prisma.destination.findFirst({ where: { id, deletedAt: null } });
    return row ? toDestination(row) : null;
  },

  async createDestination(
    data: Omit<DestinationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<DestinationItem> {
    const row = await prisma.destination.create({
      data: { ...pick(data, DESTINATION_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toDestination(row);
  },

  async updateDestination(id: string, data: Partial<DestinationItem>, userId: string): Promise<DestinationItem | null> {
    const existing = await prisma.destination.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.destination.update({
      where: { id },
      data: { ...pick(data, DESTINATION_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toDestination(row);
  },

  async deleteDestination(id: string): Promise<boolean> {
    const { count } = await prisma.destination.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 2. ACCOMMODATIONS
  // ---------------------------------------------------------------------------
  async getAccommodations(options?: ContentFilter): Promise<AccommodationItem[]> {
    const rows = await prisma.accommodation.findMany({
      where: { ...contentWhere(options), OR: textSearch(["name", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toAccommodation);
  },

  async getAccommodationsPage(options: ContentFilter & PageRequest): Promise<Paginated<AccommodationItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["name", "description"], options.search) };
    return paginate(
      options,
      () => prisma.accommodation.count({ where }),
      (range) => prisma.accommodation.findMany({ where, orderBy: newestFirst, ...range }),
      toAccommodation
    );
  },

  async getAccommodationById(id: string): Promise<AccommodationItem | null> {
    const row = await prisma.accommodation.findFirst({ where: { id, deletedAt: null } });
    return row ? toAccommodation(row) : null;
  },

  async createAccommodation(
    data: Omit<AccommodationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<AccommodationItem> {
    const row = await prisma.accommodation.create({
      data: { ...pick(data, ACCOMMODATION_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toAccommodation(row);
  },

  async updateAccommodation(
    id: string,
    data: Partial<AccommodationItem>,
    userId: string
  ): Promise<AccommodationItem | null> {
    const existing = await prisma.accommodation.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.accommodation.update({
      where: { id },
      data: { ...pick(data, ACCOMMODATION_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toAccommodation(row);
  },

  async deleteAccommodation(id: string): Promise<boolean> {
    const { count } = await prisma.accommodation.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 3. CULINARY
  // ---------------------------------------------------------------------------
  async getCulinaries(options?: ContentFilter): Promise<CulinaryItem[]> {
    const rows = await prisma.culinary.findMany({
      where: { ...contentWhere(options), OR: textSearch(["name", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toCulinary);
  },

  async getCulinariesPage(options: ContentFilter & PageRequest): Promise<Paginated<CulinaryItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["name", "description"], options.search) };
    return paginate(
      options,
      () => prisma.culinary.count({ where }),
      (range) => prisma.culinary.findMany({ where, orderBy: newestFirst, ...range }),
      toCulinary
    );
  },

  async getCulinaryById(id: string): Promise<CulinaryItem | null> {
    const row = await prisma.culinary.findFirst({ where: { id, deletedAt: null } });
    return row ? toCulinary(row) : null;
  },

  async createCulinary(
    data: Omit<CulinaryItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<CulinaryItem> {
    const row = await prisma.culinary.create({
      data: { ...pick(data, CULINARY_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toCulinary(row);
  },

  async updateCulinary(id: string, data: Partial<CulinaryItem>, userId: string): Promise<CulinaryItem | null> {
    const existing = await prisma.culinary.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.culinary.update({
      where: { id },
      data: { ...pick(data, CULINARY_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toCulinary(row);
  },

  async deleteCulinary(id: string): Promise<boolean> {
    const { count } = await prisma.culinary.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 4. VEHICLES
  // ---------------------------------------------------------------------------
  async getVehicles(options?: ContentFilter): Promise<VehicleItem[]> {
    const rows = await prisma.vehicle.findMany({
      where: { ...contentWhere(options), OR: textSearch(["serviceName", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toVehicle);
  },

  async getVehiclesPage(options: ContentFilter & PageRequest): Promise<Paginated<VehicleItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["serviceName", "description"], options.search) };
    return paginate(
      options,
      () => prisma.vehicle.count({ where }),
      (range) => prisma.vehicle.findMany({ where, orderBy: newestFirst, ...range }),
      toVehicle
    );
  },

  async getVehicleById(id: string): Promise<VehicleItem | null> {
    const row = await prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
    return row ? toVehicle(row) : null;
  },

  async createVehicle(
    data: Omit<VehicleItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<VehicleItem> {
    const row = await prisma.vehicle.create({
      data: { ...pick(data, VEHICLE_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toVehicle(row);
  },

  async updateVehicle(id: string, data: Partial<VehicleItem>, userId: string): Promise<VehicleItem | null> {
    const existing = await prisma.vehicle.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.vehicle.update({
      where: { id },
      data: { ...pick(data, VEHICLE_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toVehicle(row);
  },

  async deleteVehicle(id: string): Promise<boolean> {
    const { count } = await prisma.vehicle.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 5. FASHION
  // ---------------------------------------------------------------------------
  async getFashion(options?: ContentFilter): Promise<FashionItem[]> {
    const rows = await prisma.fashion.findMany({
      where: { ...contentWhere(options), OR: textSearch(["name", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toFashion);
  },

  async getFashionPage(options: ContentFilter & PageRequest): Promise<Paginated<FashionItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["name", "description"], options.search) };
    return paginate(
      options,
      () => prisma.fashion.count({ where }),
      (range) => prisma.fashion.findMany({ where, orderBy: newestFirst, ...range }),
      toFashion
    );
  },

  async getFashionById(id: string): Promise<FashionItem | null> {
    const row = await prisma.fashion.findFirst({ where: { id, deletedAt: null } });
    return row ? toFashion(row) : null;
  },

  async createFashion(
    data: Omit<FashionItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<FashionItem> {
    const row = await prisma.fashion.create({
      data: { ...pick(data, FASHION_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toFashion(row);
  },

  async updateFashion(id: string, data: Partial<FashionItem>, userId: string): Promise<FashionItem | null> {
    const existing = await prisma.fashion.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.fashion.update({
      where: { id },
      data: { ...pick(data, FASHION_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toFashion(row);
  },

  async deleteFashion(id: string): Promise<boolean> {
    const { count } = await prisma.fashion.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 6. TOUR GUIDES
  // ---------------------------------------------------------------------------
  async getTourGuides(options?: ContentFilter): Promise<TourGuideItem[]> {
    const rows = await prisma.tourGuide.findMany({
      where: { ...contentWhere(options), OR: textSearch(["name", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toTourGuide);
  },

  async getTourGuidesPage(options: ContentFilter & PageRequest): Promise<Paginated<TourGuideItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["name", "description"], options.search) };
    return paginate(
      options,
      () => prisma.tourGuide.count({ where }),
      (range) => prisma.tourGuide.findMany({ where, orderBy: newestFirst, ...range }),
      toTourGuide
    );
  },

  async getTourGuideById(id: string): Promise<TourGuideItem | null> {
    const row = await prisma.tourGuide.findFirst({ where: { id, deletedAt: null } });
    return row ? toTourGuide(row) : null;
  },

  async createTourGuide(
    data: Omit<TourGuideItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<TourGuideItem> {
    const row = await prisma.tourGuide.create({
      data: { ...pick(data, TOUR_GUIDE_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toTourGuide(row);
  },

  async updateTourGuide(id: string, data: Partial<TourGuideItem>, userId: string): Promise<TourGuideItem | null> {
    const existing = await prisma.tourGuide.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.tourGuide.update({
      where: { id },
      data: { ...pick(data, TOUR_GUIDE_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toTourGuide(row);
  },

  async deleteTourGuide(id: string): Promise<boolean> {
    const { count } = await prisma.tourGuide.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 7. GROCERIES
  // ---------------------------------------------------------------------------
  async getGroceries(options?: ContentFilter): Promise<GroceryItem[]> {
    const rows = await prisma.grocery.findMany({
      where: { ...contentWhere(options), OR: textSearch(["storeName", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toGrocery);
  },

  async getGroceriesPage(options: ContentFilter & PageRequest): Promise<Paginated<GroceryItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["storeName", "description"], options.search) };
    return paginate(
      options,
      () => prisma.grocery.count({ where }),
      (range) => prisma.grocery.findMany({ where, orderBy: newestFirst, ...range }),
      toGrocery
    );
  },

  async getGroceryById(id: string): Promise<GroceryItem | null> {
    const row = await prisma.grocery.findFirst({ where: { id, deletedAt: null } });
    return row ? toGrocery(row) : null;
  },

  async createGrocery(
    data: Omit<GroceryItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<GroceryItem> {
    const row = await prisma.grocery.create({
      data: { ...pick(data, GROCERY_FIELDS), tenantId: data.tenantId, ...createAudit(data.status, userId) },
    });
    return toGrocery(row);
  },

  async updateGrocery(id: string, data: Partial<GroceryItem>, userId: string): Promise<GroceryItem | null> {
    const existing = await prisma.grocery.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.grocery.update({
      where: { id },
      data: { ...pick(data, GROCERY_FIELDS), ...updateAudit(existing.status, data.status, userId) },
    });
    return toGrocery(row);
  },

  async deleteGrocery(id: string): Promise<boolean> {
    const { count } = await prisma.grocery.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // 8. DOCUMENTATIONS
  // ---------------------------------------------------------------------------
  async getDocumentations(options?: ContentFilter): Promise<DocumentationItem[]> {
    const rows = await prisma.documentation.findMany({
      where: { ...contentWhere(options), OR: textSearch(["title", "description"], options?.search) },
      orderBy: newestFirst,
    });
    return rows.map(toDocumentation);
  },

  async getDocumentationsPage(options: ContentFilter & PageRequest): Promise<Paginated<DocumentationItem>> {
    const where = { ...contentWhere(options), OR: textSearch(["title", "description"], options.search) };
    return paginate(
      options,
      () => prisma.documentation.count({ where }),
      (range) => prisma.documentation.findMany({ where, orderBy: newestFirst, ...range }),
      toDocumentation
    );
  },

  async getDocumentationById(id: string): Promise<DocumentationItem | null> {
    const row = await prisma.documentation.findFirst({ where: { id, deletedAt: null } });
    return row ? toDocumentation(row) : null;
  },

  async createDocumentation(
    data: Omit<DocumentationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<DocumentationItem> {
    const row = await prisma.documentation.create({
      data: {
        ...pick(data, DOCUMENTATION_FIELDS),
        eventDate: toEventDate(data.eventDate),
        tenantId: data.tenantId,
        ...createAudit(data.status, userId),
      },
    });
    return toDocumentation(row);
  },

  async updateDocumentation(
    id: string,
    data: Partial<DocumentationItem>,
    userId: string
  ): Promise<DocumentationItem | null> {
    const existing = await prisma.documentation.findFirst({ where: { id, deletedAt: null }, select: { status: true } });
    if (!existing) return null;
    const row = await prisma.documentation.update({
      where: { id },
      data: {
        ...pick(data, DOCUMENTATION_FIELDS),
        eventDate: toEventDate(data.eventDate),
        ...updateAudit(existing.status, data.status, userId),
      },
    });
    return toDocumentation(row);
  },

  async deleteDocumentation(id: string): Promise<boolean> {
    const { count } = await prisma.documentation.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return count > 0;
  },

  // ---------------------------------------------------------------------------
  // CONTENT APPROVAL SYSTEM
  // ---------------------------------------------------------------------------
  async getApprovals(tenantId?: string): Promise<ContentApprovalItem[]> {
    const rows = await prisma.contentApproval.findMany({ where: { tenantId }, orderBy: newestFirst });
    const titleOf = await contentTitles(rows);
    return rows.map((row) => toApproval(row, titleOf(row)));
  },

  /** Pending requests first (enum order PENDING, APPROVED, REJECTED), then newest. */
  async getApprovalsPage(options: { tenantId?: string } & PageRequest): Promise<Paginated<ContentApprovalItem>> {
    const where = { tenantId: options.tenantId };
    const result = await paginate(
      options,
      () => prisma.contentApproval.count({ where }),
      (range) =>
        prisma.contentApproval.findMany({
          where,
          orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
          ...range,
        }),
      (row) => row
    );
    const titleOf = await contentTitles(result.items);
    return { ...result, items: result.items.map((row) => toApproval(row, titleOf(row))) };
  },

  async getApprovalById(id: string): Promise<ContentApprovalItem | null> {
    const row = await prisma.contentApproval.findUnique({ where: { id } });
    if (!row) return null;
    const titleOf = await contentTitles([row]);
    return toApproval(row, titleOf(row));
  },

  async requestApproval(
    data: Omit<ContentApprovalItem, "id" | "createdAt" | "updatedAt" | "status" | "reviewedById" | "requestedById">,
    userId: string
  ): Promise<ContentApprovalItem> {
    const row = await prisma.contentApproval.create({
      data: {
        tenantId: data.tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        requestedById: userId,
        status: "PENDING",
      },
    });
    return toApproval(row, data.title);
  },

  async reviewApproval(
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason: string | undefined,
    reviewerUserId: string
  ): Promise<ContentApprovalItem | null> {
    const row = await nullIfMissing(
      prisma.contentApproval.update({
        where: { id: approvalId },
        data: {
          status,
          rejectionReason: status === "REJECTED" ? (rejectionReason ?? null) : null,
          reviewedById: reviewerUserId,
        },
      })
    );
    if (!row) return null;

    // Automatically publish the underlying content when approved
    const { entityType, entityId, tenantId } = row;
    if (status === "APPROVED" && isContentModule(entityType)) {
      await publishers[entityType](entityId, reviewerUserId);
    }

    const title = (await contentTitles([row]))(row);
    await db.logActivity({
      tenantId,
      actorUserId: reviewerUserId,
      action: status === "APPROVED" ? "APPROVE_CONTENT" : "REJECT_CONTENT",
      entityType,
      entityId,
      description:
        status === "APPROVED"
          ? `Menyetujui konten ${title}`
          : `Menolak konten ${title} (Alasan: ${rejectionReason || "Tidak ada"})`,
    });

    return toApproval(row, title);
  },

  // ---------------------------------------------------------------------------
  // ACTIVITY AUDIT LOGGING
  // ---------------------------------------------------------------------------
  async logActivity(data: Omit<ActivityLogItem, "id" | "createdAt">): Promise<ActivityLogItem> {
    const row = await prisma.activityLog.create({
      data: {
        tenantId: data.tenantId,
        actorUserId: data.actorUserId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
      },
    });
    return toActivityLog(row);
  },

  async getActivityLogs(tenantId?: string, limit: number = 50): Promise<ActivityLogItem[]> {
    const rows = await prisma.activityLog.findMany({ where: { tenantId }, orderBy: newestFirst, take: limit });
    return rows.map(toActivityLog);
  },

  async getActivityLogsPage(options: { tenantId?: string } & PageRequest): Promise<Paginated<ActivityLogItem>> {
    const where = { tenantId: options.tenantId };
    return paginate(
      options,
      () => prisma.activityLog.count({ where }),
      (range) => prisma.activityLog.findMany({ where, orderBy: newestFirst, ...range }),
      toActivityLog
    );
  },

  // ---------------------------------------------------------------------------
  // GLOBAL CONTENT OVERVIEW (Superadmin)
  // ---------------------------------------------------------------------------
  /** Destinations, accommodations, culinary and vehicles of every tenant in one list, newest first. */
  async getContentOverviewPage(request: PageRequest): Promise<Paginated<ContentOverviewItem>> {
    return paginate(
      request,
      async () => {
        const [{ total }] = await prisma.$queryRaw<{ total: bigint }[]>`
          SELECT (SELECT count(*) FROM "destinations" WHERE "deleted_at" IS NULL)
               + (SELECT count(*) FROM "accommodations" WHERE "deleted_at" IS NULL)
               + (SELECT count(*) FROM "culinary" WHERE "deleted_at" IS NULL)
               + (SELECT count(*) FROM "vehicles" WHERE "deleted_at" IS NULL) AS "total"`;
        return Number(total);
      },
      ({ skip, take }) => prisma.$queryRaw<ContentOverviewRow[]>`
        SELECT * FROM (
          SELECT "id", "tenant_id", "name" AS "title", 'destinations' AS "module", "status"::text AS "status", "created_by", "created_at"
            FROM "destinations" WHERE "deleted_at" IS NULL
          UNION ALL
          SELECT "id", "tenant_id", "name", 'accommodations', "status"::text, "created_by", "created_at"
            FROM "accommodations" WHERE "deleted_at" IS NULL
          UNION ALL
          SELECT "id", "tenant_id", "name", 'culinary', "status"::text, "created_by", "created_at"
            FROM "culinary" WHERE "deleted_at" IS NULL
          UNION ALL
          SELECT "id", "tenant_id", "service_name", 'vehicles', "status"::text, "created_by", "created_at"
            FROM "vehicles" WHERE "deleted_at" IS NULL
        ) AS "contents"
        ORDER BY "created_at" DESC, "id" DESC
        LIMIT ${take} OFFSET ${skip}`,
      (row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        title: row.title,
        module: row.module,
        status: row.status,
        createdById: row.created_by,
        createdAt: iso(row.created_at),
      })
    );
  },

  // ---------------------------------------------------------------------------
  // METRICS & STATS
  // ---------------------------------------------------------------------------
  async getGlobalStats() {
    const [byModule, totalWebsites, totalUsers, pendingReview] = await Promise.all([
      contentStatusCounts(),
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.contentApproval.count({ where: { status: "PENDING" } }),
    ]);
    const summary = summarize(byModule);

    return {
      totalWebsites,
      totalUsers,
      totalDestinations: totalOf(byModule.destinations),
      totalContents: summary.total,
      publishedContents: summary.published,
      draftContents: summary.draft,
      pendingReview,
    };
  },

  async getTenantStats(tenantId: string) {
    const [byModule, userCount, pendingCount] = await Promise.all([
      contentStatusCounts(tenantId),
      db.countTenantUsers(tenantId),
      prisma.contentApproval.count({ where: { tenantId, status: "PENDING" } }),
    ]);
    const summary = summarize(byModule);

    return {
      userCount,
      userLimit: USER_QUOTA,
      totalContents: summary.total,
      publishedCount: summary.published,
      draftCount: summary.draft,
      pendingCount,
      countsByModule: {
        destinations: totalOf(byModule.destinations),
        accommodations: totalOf(byModule.accommodations),
        culinary: totalOf(byModule.culinary),
        vehicles: totalOf(byModule.vehicles),
        fashion: totalOf(byModule.fashion),
        tour_guides: totalOf(byModule.tour_guides),
        groceries: totalOf(byModule.groceries),
        documentations: totalOf(byModule.documentations),
      },
    };
  },
};

const publishers: Record<ContentModuleName, (id: string, userId: string) => Promise<unknown>> = {
  destinations: (id, userId) => db.updateDestination(id, PUBLISH, userId),
  accommodations: (id, userId) => db.updateAccommodation(id, PUBLISH, userId),
  culinary: (id, userId) => db.updateCulinary(id, PUBLISH, userId),
  vehicles: (id, userId) => db.updateVehicle(id, PUBLISH, userId),
  fashion: (id, userId) => db.updateFashion(id, PUBLISH, userId),
  tour_guides: (id, userId) => db.updateTourGuide(id, PUBLISH, userId),
  groceries: (id, userId) => db.updateGrocery(id, PUBLISH, userId),
  documentations: (id, userId) => db.updateDocumentation(id, PUBLISH, userId),
};
