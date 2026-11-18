import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_DESTINATIONS,
  INITIAL_ACCOMMODATIONS,
  INITIAL_CULINARIES,
  INITIAL_VEHICLES,
  INITIAL_FASHION,
  INITIAL_TOUR_GUIDES,
  INITIAL_GROCERIES,
  INITIAL_DOCUMENTATIONS,
  INITIAL_APPROVALS,
  INITIAL_ACTIVITY_LOGS,
  type TenantData,
  type UserData,
  type DestinationItem,
  type AccommodationItem,
  type CulinaryItem,
  type VehicleItem,
  type FashionItem,
  type TourGuideItem,
  type GroceryItem,
  type DocumentationItem,
  type ContentApprovalItem,
  type ActivityLogItem,
} from "./mock-data";

// Global in-memory cache preserved across HMR in Next.js development
declare global {
  var __cms_db: {
    tenants: TenantData[];
    users: UserData[];
    destinations: DestinationItem[];
    accommodations: AccommodationItem[];
    culinaries: CulinaryItem[];
    vehicles: VehicleItem[];
    fashion: FashionItem[];
    tourGuides: TourGuideItem[];
    groceries: GroceryItem[];
    documentations: DocumentationItem[];
    approvals: ContentApprovalItem[];
    activityLogs: ActivityLogItem[];
  } | undefined;
}

if (!globalThis.__cms_db) {
  globalThis.__cms_db = {
    tenants: JSON.parse(JSON.stringify(INITIAL_TENANTS)),
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    destinations: JSON.parse(JSON.stringify(INITIAL_DESTINATIONS)),
    accommodations: JSON.parse(JSON.stringify(INITIAL_ACCOMMODATIONS)),
    culinaries: JSON.parse(JSON.stringify(INITIAL_CULINARIES)),
    vehicles: JSON.parse(JSON.stringify(INITIAL_VEHICLES)),
    fashion: JSON.parse(JSON.stringify(INITIAL_FASHION)),
    tourGuides: JSON.parse(JSON.stringify(INITIAL_TOUR_GUIDES)),
    groceries: JSON.parse(JSON.stringify(INITIAL_GROCERIES)),
    documentations: JSON.parse(JSON.stringify(INITIAL_DOCUMENTATIONS)),
    approvals: JSON.parse(JSON.stringify(INITIAL_APPROVALS)),
    activityLogs: JSON.parse(JSON.stringify(INITIAL_ACTIVITY_LOGS)),
  };
}

const store = globalThis.__cms_db;

export type ContentModuleName =
  | "destinations"
  | "accommodations"
  | "culinary"
  | "vehicles"
  | "fashion"
  | "tour_guides"
  | "groceries"
  | "documentations";

export const db = {
  // ---------------------------------------------------------------------------
  // TENANTS
  // ---------------------------------------------------------------------------
  async getTenants(): Promise<TenantData[]> {
    return [...store.tenants];
  },

  async getTenantById(id: string): Promise<TenantData | null> {
    const t = store.tenants.find((item) => item.id === id);
    return t ? { ...t } : null;
  },

  async getTenantBySlug(slug: string): Promise<TenantData | null> {
    const t = store.tenants.find((item) => item.slug === slug);
    return t ? { ...t } : null;
  },

  async getTenantByDomain(domain: string): Promise<TenantData | null> {
    const cleaned = domain.toLowerCase().split(":")[0];
    const t = store.tenants.find((item) =>
      item.domains.some((d) => d.domain.toLowerCase().split(":")[0] === cleaned)
    );
    return t ? { ...t } : null;
  },

  async createTenant(data: Omit<TenantData, "id">): Promise<TenantData> {
    const newTenant: TenantData = {
      ...data,
      id: `tenant-${Date.now().toString(36)}`,
    };
    store.tenants.push(newTenant);
    return newTenant;
  },

  async updateTenant(id: string, data: Partial<TenantData>): Promise<TenantData | null> {
    const idx = store.tenants.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    store.tenants[idx] = { ...store.tenants[idx], ...data };
    return store.tenants[idx];
  },

  async updateTenantFeature(tenantId: string, featureKey: string, isEnabled: boolean): Promise<boolean> {
    const tenant = store.tenants.find((t) => t.id === tenantId);
    if (!tenant) return false;
    tenant.features[featureKey] = isEnabled;
    return true;
  },

  async isFeatureEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = store.tenants.find((t) => t.id === tenantId);
    if (!tenant) return false;
    // Default to true if not explicitly disabled
    return tenant.features[featureKey] !== false;
  },

  async updateWebsiteSettings(tenantId: string, settings: Partial<TenantData["settings"]>): Promise<boolean> {
    const tenant = store.tenants.find((t) => t.id === tenantId);
    if (!tenant) return false;
    tenant.settings = { ...tenant.settings, ...settings };
    return true;
  },

  // ---------------------------------------------------------------------------
  // USERS & QUOTA MANAGEMENT (Max 30 users per tenant)
  // ---------------------------------------------------------------------------
  async getUsers(tenantId?: string): Promise<UserData[]> {
    if (!tenantId) return [...store.users];
    return store.users.filter((u) =>
      u.tenantMemberships.some((m) => m.tenantId === tenantId)
    );
  },

  async getUserById(id: string): Promise<UserData | null> {
    const u = store.users.find((user) => user.id === id);
    return u ? { ...u } : null;
  },

  async getUserByEmail(email: string): Promise<UserData | null> {
    const u = store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    return u ? { ...u } : null;
  },

  async countTenantUsers(tenantId: string): Promise<number> {
    return store.users.filter(
      (u) =>
        u.status === "ACTIVE" &&
        u.tenantMemberships.some((m) => m.tenantId === tenantId)
    ).length;
  },

  /**
   * Safe server-side user creation with strict MAX 30 USERS quota check
   */
  async createUser(data: Omit<UserData, "id" | "createdAt">): Promise<{ success: boolean; user?: UserData; error?: string }> {
    // Check email uniqueness
    if (store.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: "Email sudah terdaftar dalam sistem." };
    }

    // Enforce quota limit (30 users) for each tenant the user is assigned to
    for (const membership of data.tenantMemberships) {
      const activeCount = await this.countTenantUsers(membership.tenantId);
      if (activeCount >= 30) {
        return {
          success: false,
          error: `Batas kuota maksimal 30 pengguna untuk website ini telah tercapai (saat ini: ${activeCount}/30).`,
        };
      }
    }

    const newUser: UserData = {
      ...data,
      id: `user-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    return { success: true, user: newUser };
  },

  async updateUser(id: string, data: Partial<UserData>): Promise<UserData | null> {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...data };
    return store.users[idx];
  },

  async deleteUser(id: string): Promise<boolean> {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    // We soft-delete or deactivate to maintain content attribution integrity
    store.users[idx].status = "INACTIVE";
    return true;
  },

  // ---------------------------------------------------------------------------
  // 1. DESTINATIONS
  // ---------------------------------------------------------------------------
  async getDestinations(options?: {
    tenantId?: string;
    status?: DestinationItem["status"];
    category?: string;
    isFeatured?: boolean;
    search?: string;
  }): Promise<DestinationItem[]> {
    let list = [...store.destinations];
    if (options?.tenantId) {
      list = list.filter((i) => i.tenantId === options.tenantId);
    }
    if (options?.status) {
      list = list.filter((i) => i.status === options.status);
    }
    if (options?.category) {
      list = list.filter((i) => i.category.toLowerCase().includes(options.category!.toLowerCase()));
    }
    if (options?.isFeatured !== undefined) {
      list = list.filter((i) => i.isFeatured === options.isFeatured);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.shortDescription.toLowerCase().includes(q));
    }
    return list;
  },

  async getDestinationBySlug(tenantId: string, slug: string): Promise<DestinationItem | null> {
    const item = store.destinations.find((i) => i.tenantId === tenantId && i.slug === slug);
    return item ? { ...item } : null;
  },

  async getDestinationById(id: string): Promise<DestinationItem | null> {
    const item = store.destinations.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createDestination(
    data: Omit<DestinationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<DestinationItem> {
    const now = new Date().toISOString();
    const item: DestinationItem = {
      ...data,
      id: `dest-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.destinations.unshift(item);
    return item;
  },

  async updateDestination(id: string, data: Partial<DestinationItem>, userId: string): Promise<DestinationItem | null> {
    const idx = store.destinations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.destinations[idx];
    const now = new Date().toISOString();

    const updated: DestinationItem = {
      ...existing,
      ...data,
      createdById: existing.createdById, // Preserved forever
      createdAt: existing.createdAt,     // Preserved forever
      updatedById: userId,
      updatedAt: now,
      publishedById: data.status === "PUBLISHED" && existing.status !== "PUBLISHED" ? userId : existing.publishedById,
      publishedAt: data.status === "PUBLISHED" && existing.status !== "PUBLISHED" ? now : existing.publishedAt,
    };

    store.destinations[idx] = updated;
    return updated;
  },

  async deleteDestination(id: string): Promise<boolean> {
    const idx = store.destinations.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.destinations.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 2. ACCOMMODATIONS
  // ---------------------------------------------------------------------------
  async getAccommodations(options?: {
    tenantId?: string;
    status?: AccommodationItem["status"];
    search?: string;
  }): Promise<AccommodationItem[]> {
    let list = [...store.accommodations];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getAccommodationById(id: string): Promise<AccommodationItem | null> {
    const item = store.accommodations.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createAccommodation(
    data: Omit<AccommodationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<AccommodationItem> {
    const now = new Date().toISOString();
    const item: AccommodationItem = {
      ...data,
      id: `accom-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.accommodations.unshift(item);
    return item;
  },

  async updateAccommodation(id: string, data: Partial<AccommodationItem>, userId: string): Promise<AccommodationItem | null> {
    const idx = store.accommodations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.accommodations[idx];
    const now = new Date().toISOString();

    const updated: AccommodationItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.accommodations[idx] = updated;
    return updated;
  },

  async deleteAccommodation(id: string): Promise<boolean> {
    const idx = store.accommodations.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.accommodations.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 3. CULINARY
  // ---------------------------------------------------------------------------
  async getCulinaries(options?: {
    tenantId?: string;
    status?: CulinaryItem["status"];
    search?: string;
  }): Promise<CulinaryItem[]> {
    let list = [...store.culinaries];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getCulinaryById(id: string): Promise<CulinaryItem | null> {
    const item = store.culinaries.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createCulinary(
    data: Omit<CulinaryItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<CulinaryItem> {
    const now = new Date().toISOString();
    const item: CulinaryItem = {
      ...data,
      id: `cul-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.culinaries.unshift(item);
    return item;
  },

  async updateCulinary(id: string, data: Partial<CulinaryItem>, userId: string): Promise<CulinaryItem | null> {
    const idx = store.culinaries.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.culinaries[idx];
    const now = new Date().toISOString();

    const updated: CulinaryItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.culinaries[idx] = updated;
    return updated;
  },

  async deleteCulinary(id: string): Promise<boolean> {
    const idx = store.culinaries.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.culinaries.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 4. VEHICLES
  // ---------------------------------------------------------------------------
  async getVehicles(options?: {
    tenantId?: string;
    status?: VehicleItem["status"];
    search?: string;
  }): Promise<VehicleItem[]> {
    let list = [...store.vehicles];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.serviceName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getVehicleById(id: string): Promise<VehicleItem | null> {
    const item = store.vehicles.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createVehicle(
    data: Omit<VehicleItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<VehicleItem> {
    const now = new Date().toISOString();
    const item: VehicleItem = {
      ...data,
      id: `veh-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.vehicles.unshift(item);
    return item;
  },

  async updateVehicle(id: string, data: Partial<VehicleItem>, userId: string): Promise<VehicleItem | null> {
    const idx = store.vehicles.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.vehicles[idx];
    const now = new Date().toISOString();

    const updated: VehicleItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.vehicles[idx] = updated;
    return updated;
  },

  async deleteVehicle(id: string): Promise<boolean> {
    const idx = store.vehicles.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.vehicles.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 5. FASHION
  // ---------------------------------------------------------------------------
  async getFashion(options?: {
    tenantId?: string;
    status?: FashionItem["status"];
    search?: string;
  }): Promise<FashionItem[]> {
    let list = [...store.fashion];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getFashionById(id: string): Promise<FashionItem | null> {
    const item = store.fashion.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createFashion(
    data: Omit<FashionItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<FashionItem> {
    const now = new Date().toISOString();
    const item: FashionItem = {
      ...data,
      id: `fash-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.fashion.unshift(item);
    return item;
  },

  async updateFashion(id: string, data: Partial<FashionItem>, userId: string): Promise<FashionItem | null> {
    const idx = store.fashion.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.fashion[idx];
    const now = new Date().toISOString();

    const updated: FashionItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.fashion[idx] = updated;
    return updated;
  },

  async deleteFashion(id: string): Promise<boolean> {
    const idx = store.fashion.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.fashion.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 6. TOUR GUIDES
  // ---------------------------------------------------------------------------
  async getTourGuides(options?: {
    tenantId?: string;
    status?: TourGuideItem["status"];
    search?: string;
  }): Promise<TourGuideItem[]> {
    let list = [...store.tourGuides];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getTourGuideById(id: string): Promise<TourGuideItem | null> {
    const item = store.tourGuides.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createTourGuide(
    data: Omit<TourGuideItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<TourGuideItem> {
    const now = new Date().toISOString();
    const item: TourGuideItem = {
      ...data,
      id: `guide-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.tourGuides.unshift(item);
    return item;
  },

  async updateTourGuide(id: string, data: Partial<TourGuideItem>, userId: string): Promise<TourGuideItem | null> {
    const idx = store.tourGuides.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.tourGuides[idx];
    const now = new Date().toISOString();

    const updated: TourGuideItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.tourGuides[idx] = updated;
    return updated;
  },

  async deleteTourGuide(id: string): Promise<boolean> {
    const idx = store.tourGuides.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.tourGuides.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 7. GROCERIES
  // ---------------------------------------------------------------------------
  async getGroceries(options?: {
    tenantId?: string;
    status?: GroceryItem["status"];
    search?: string;
  }): Promise<GroceryItem[]> {
    let list = [...store.groceries];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.storeName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getGroceryById(id: string): Promise<GroceryItem | null> {
    const item = store.groceries.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createGrocery(
    data: Omit<GroceryItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<GroceryItem> {
    const now = new Date().toISOString();
    const item: GroceryItem = {
      ...data,
      id: `groc-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.groceries.unshift(item);
    return item;
  },

  async updateGrocery(id: string, data: Partial<GroceryItem>, userId: string): Promise<GroceryItem | null> {
    const idx = store.groceries.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.groceries[idx];
    const now = new Date().toISOString();

    const updated: GroceryItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.groceries[idx] = updated;
    return updated;
  },

  async deleteGrocery(id: string): Promise<boolean> {
    const idx = store.groceries.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.groceries.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // 8. DOCUMENTATIONS
  // ---------------------------------------------------------------------------
  async getDocumentations(options?: {
    tenantId?: string;
    status?: DocumentationItem["status"];
    search?: string;
  }): Promise<DocumentationItem[]> {
    let list = [...store.documentations];
    if (options?.tenantId) list = list.filter((i) => i.tenantId === options.tenantId);
    if (options?.status) list = list.filter((i) => i.status === options.status);
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return list;
  },

  async getDocumentationById(id: string): Promise<DocumentationItem | null> {
    const item = store.documentations.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async createDocumentation(
    data: Omit<DocumentationItem, "id" | "createdAt" | "updatedAt" | "createdById" | "updatedById">,
    userId: string
  ): Promise<DocumentationItem> {
    const now = new Date().toISOString();
    const item: DocumentationItem = {
      ...data,
      id: `doc-${Date.now().toString(36)}`,
      createdById: userId,
      updatedById: userId,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "PUBLISHED" ? now : undefined,
      publishedById: data.status === "PUBLISHED" ? userId : undefined,
    };
    store.documentations.unshift(item);
    return item;
  },

  async updateDocumentation(id: string, data: Partial<DocumentationItem>, userId: string): Promise<DocumentationItem | null> {
    const idx = store.documentations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const existing = store.documentations[idx];
    const now = new Date().toISOString();

    const updated: DocumentationItem = {
      ...existing,
      ...data,
      createdById: existing.createdById,
      createdAt: existing.createdAt,
      updatedById: userId,
      updatedAt: now,
    };
    store.documentations[idx] = updated;
    return updated;
  },

  async deleteDocumentation(id: string): Promise<boolean> {
    const idx = store.documentations.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    store.documentations.splice(idx, 1);
    return true;
  },

  // ---------------------------------------------------------------------------
  // CONTENT APPROVAL SYSTEM
  // ---------------------------------------------------------------------------
  async getApprovals(tenantId?: string): Promise<ContentApprovalItem[]> {
    if (!tenantId) return [...store.approvals];
    return store.approvals.filter((a) => a.tenantId === tenantId);
  },

  async requestApproval(
    data: Omit<ContentApprovalItem, "id" | "createdAt" | "updatedAt" | "status" | "reviewedById" | "requestedById">,
    userId: string
  ): Promise<ContentApprovalItem> {
    const now = new Date().toISOString();
    const approval: ContentApprovalItem = {
      ...data,
      id: `appr-${Date.now().toString(36)}`,
      requestedById: userId,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    store.approvals.unshift(approval);
    return approval;
  },

  async reviewApproval(
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason: string | undefined,
    reviewerUserId: string
  ): Promise<ContentApprovalItem | null> {
    const idx = store.approvals.findIndex((a) => a.id === approvalId);
    if (idx === -1) return null;
    const now = new Date().toISOString();

    const updated: ContentApprovalItem = {
      ...store.approvals[idx],
      status,
      rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
      reviewedById: reviewerUserId,
      updatedAt: now,
    };
    store.approvals[idx] = updated;

    // Automatically update the underlying content status if approved
    const { entityType, entityId, tenantId } = updated;
    if (status === "APPROVED") {
      if (entityType === "destinations") {
        await this.updateDestination(entityId, { status: "PUBLISHED" }, reviewerUserId);
      }
    }

    await this.logActivity({
      tenantId,
      actorUserId: reviewerUserId,
      action: status === "APPROVED" ? "APPROVE_CONTENT" : "REJECT_CONTENT",
      entityType,
      entityId,
      description:
        status === "APPROVED"
          ? `Menyetujui konten ${updated.title}`
          : `Menolak konten ${updated.title} (Alasan: ${rejectionReason || "Tidak ada"})`,
    });

    return updated;
  },

  // ---------------------------------------------------------------------------
  // ACTIVITY AUDIT LOGGING
  // ---------------------------------------------------------------------------
  async logActivity(data: Omit<ActivityLogItem, "id" | "createdAt">): Promise<ActivityLogItem> {
    const log: ActivityLogItem = {
      ...data,
      id: `act-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    store.activityLogs.unshift(log);
    return log;
  },

  async getActivityLogs(tenantId?: string, limit: number = 50): Promise<ActivityLogItem[]> {
    let logs = [...store.activityLogs];
    if (tenantId) {
      logs = logs.filter((l) => l.tenantId === tenantId);
    }
    return logs.slice(0, limit);
  },

  // ---------------------------------------------------------------------------
  // METRICS & STATS
  // ---------------------------------------------------------------------------
  async getGlobalStats() {
    return {
      totalWebsites: store.tenants.length,
      totalUsers: store.users.length,
      totalDestinations: store.destinations.length,
      totalContents:
        store.destinations.length +
        store.accommodations.length +
        store.culinaries.length +
        store.vehicles.length +
        store.fashion.length +
        store.tourGuides.length +
        store.groceries.length +
        store.documentations.length,
      publishedContents:
        store.destinations.filter((i) => i.status === "PUBLISHED").length +
        store.accommodations.filter((i) => i.status === "PUBLISHED").length +
        store.culinaries.filter((i) => i.status === "PUBLISHED").length +
        store.vehicles.filter((i) => i.status === "PUBLISHED").length +
        store.fashion.filter((i) => i.status === "PUBLISHED").length +
        store.tourGuides.filter((i) => i.status === "PUBLISHED").length +
        store.groceries.filter((i) => i.status === "PUBLISHED").length +
        store.documentations.filter((i) => i.status === "PUBLISHED").length,
      draftContents:
        store.destinations.filter((i) => i.status === "DRAFT").length +
        store.accommodations.filter((i) => i.status === "DRAFT").length +
        store.culinaries.filter((i) => i.status === "DRAFT").length +
        store.vehicles.filter((i) => i.status === "DRAFT").length +
        store.fashion.filter((i) => i.status === "DRAFT").length +
        store.tourGuides.filter((i) => i.status === "DRAFT").length +
        store.groceries.filter((i) => i.status === "DRAFT").length +
        store.documentations.filter((i) => i.status === "DRAFT").length,
      pendingReview: store.approvals.filter((a) => a.status === "PENDING").length,
    };
  },

  async getTenantStats(tenantId: string) {
    const dest = store.destinations.filter((i) => i.tenantId === tenantId);
    const accom = store.accommodations.filter((i) => i.tenantId === tenantId);
    const cul = store.culinaries.filter((i) => i.tenantId === tenantId);
    const veh = store.vehicles.filter((i) => i.tenantId === tenantId);
    const fash = store.fashion.filter((i) => i.tenantId === tenantId);
    const guide = store.tourGuides.filter((i) => i.tenantId === tenantId);
    const groc = store.groceries.filter((i) => i.tenantId === tenantId);
    const doc = store.documentations.filter((i) => i.tenantId === tenantId);

    const all = [...dest, ...accom, ...cul, ...veh, ...fash, ...guide, ...groc, ...doc];
    const userCount = await this.countTenantUsers(tenantId);
    const pendingApprovals = store.approvals.filter(
      (a) => a.tenantId === tenantId && a.status === "PENDING"
    ).length;

    return {
      userCount,
      userLimit: 30,
      totalContents: all.length,
      publishedCount: all.filter((i) => i.status === "PUBLISHED").length,
      draftCount: all.filter((i) => i.status === "DRAFT").length,
      pendingCount: pendingApprovals,
      countsByModule: {
        destinations: dest.length,
        accommodations: accom.length,
        culinary: cul.length,
        vehicles: veh.length,
        fashion: fash.length,
        tour_guides: guide.length,
        groceries: groc.length,
        documentations: doc.length,
      },
    };
  },
};
