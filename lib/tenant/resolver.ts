import { headers, cookies } from "next/headers";
import { db } from "../db";
import type { TenantData } from "../db/mock-data";

export interface ResolvedTenantContext {
  tenant: TenantData;
  host: string;
  isCustomDomain: boolean;
}

/**
 * Mapping between URL segment and internal tenant ID:
 * /dashboard/web-a -> tenant-a (Wisata Bahari Nusantara)
 * /dashboard/web-b -> tenant-b (Ekowisata Dataran Tinggi)
 * /dashboard/web-c -> tenant-c (Warisan Budaya & Seni Tradisi)
 */
export function resolveTenantFromWebParam(webParam?: string): string {
  if (!webParam) return "tenant-a";
  const normalized = webParam.toLowerCase();
  if (
    normalized === "web-a" ||
    normalized === "wisata-a" ||
    normalized === "tenant-a" ||
    normalized === "bahari"
  ) {
    return "tenant-a";
  }
  if (
    normalized === "web-b" ||
    normalized === "wisata-b" ||
    normalized === "tenant-b" ||
    normalized === "ekowisata"
  ) {
    return "tenant-b";
  }
  if (
    normalized === "web-c" ||
    normalized === "wisata-c" ||
    normalized === "tenant-c" ||
    normalized === "budaya"
  ) {
    return "tenant-c";
  }
  return "tenant-a";
}

export function getWebSlugFromTenantId(tenantId: string): "web-a" | "web-b" | "web-c" {
  if (tenantId === "tenant-b") return "web-b";
  if (tenantId === "tenant-c") return "web-c";
  return "web-a";
}

/**
 * Resolves current tenant from explicit slug/id, domain, cookie, or default.
 */
export async function resolveCurrentTenant(explicitSlugOrId?: string): Promise<TenantData | null> {
  if (explicitSlugOrId) {
    const tenantId = resolveTenantFromWebParam(explicitSlugOrId);
    const byResolvedId = await db.getTenantById(tenantId);
    if (byResolvedId) return byResolvedId;

    const byId = await db.getTenantById(explicitSlugOrId);
    if (byId) return byId;

    const bySlug = await db.getTenantBySlug(explicitSlugOrId);
    if (bySlug) return bySlug;
  }

  const reqHeaders = await headers();
  const host = reqHeaders.get("x-forwarded-host") || reqHeaders.get("host") || "localhost:3000";
  const hostname = host.split(":")[0].toLowerCase();

  // 1. Check direct database match for domain
  const matched = (await db.getTenantByDomain(hostname)) || (await db.getTenantByDomain(host));
  if (matched) return matched;

  // 2. Check subdomain prefix (e.g., wisata-a from wisata-a.localhost)
  const parts = hostname.split(".");
  if (parts.length > 1) {
    const subdomain = parts[0];
    const mapped = resolveTenantFromWebParam(subdomain);
    if (mapped) {
      const byMapped = await db.getTenantById(mapped);
      if (byMapped) return byMapped;
    }
  }

  // 3. Check developer preview cookie or active tenant selection
  const cookieStore = await cookies();
  const devTenantCookie = cookieStore.get("active_tenant_id");
  if (devTenantCookie?.value) {
    const cookieTenant = await db.getTenantById(devTenantCookie.value);
    if (cookieTenant) return cookieTenant;
  }

  // 4. Default to tenant-a for primary entry point
  return db.getTenantById("tenant-a");
}

/**
 * Helper to retrieve all active tenants
 */
export async function getAvailableTenants(): Promise<TenantData[]> {
  const all = await db.getTenants();
  return all.filter((t) => t.status === "ACTIVE");
}
