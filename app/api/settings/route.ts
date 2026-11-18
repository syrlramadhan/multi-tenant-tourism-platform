import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenant = await resolveCurrentTenant();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const body = await request.json();
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
