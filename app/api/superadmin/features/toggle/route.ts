import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireSuperadmin();
    const { tenantId, featureKey, isEnabled } = await request.json();

    if (!tenantId || !featureKey || typeof isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Parameter tidak lengkap." },
        { status: 400 }
      );
    }

    const tenant = await db.getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.updateTenantFeature(tenantId, featureKey, isEnabled);

    // Audit log
    await db.logActivity({
      tenantId,
      actorUserId: user.userId,
      action: isEnabled ? "ENABLE_FEATURE" : "DISABLE_FEATURE",
      entityType: "TenantFeature",
      entityId: `${tenantId}:${featureKey}`,
      description: `Superadmin mengubah status modul ${featureKey} pada website ${tenant.name} menjadi ${
        isEnabled ? "AKTIF (ON)" : "NONAKTIF (OFF)"
      }`,
    });

    return NextResponse.json({ success: true, isEnabled });
  } catch (error: unknown) {
    console.error("Feature toggle error:", error);
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
