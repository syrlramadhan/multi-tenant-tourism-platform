import { NextResponse } from "next/server";
import { getCurrentUser, hasTenantAccess } from "@/lib/auth";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const tenant =
      typeof body.tenantId === "string" ? await db.getTenantById(body.tenantId) : await resolveCurrentTenant();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    if (!hasTenantAccess(sessionUser, tenant.id, ["WEBSITE_ADMIN"])) {
      return NextResponse.json(
        { error: "Hanya Website Admin atau Superadmin yang dapat mengubah konfigurasi website." },
        { status: 403 }
      );
    }

    await db.updateWebsiteSettings(tenant.id, body);

    await db.logActivity({
      tenantId: tenant.id,
      actorUserId: sessionUser.userId,
      action: "UPDATE_WEBSITE_SETTINGS",
      entityType: "WebsiteSetting",
      entityId: tenant.id,
      description: `Memperbarui konfigurasi website: ${tenant.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
