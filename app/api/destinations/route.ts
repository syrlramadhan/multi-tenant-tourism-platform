import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const tenant = tenantId
      ? await db.getTenantById(tenantId)
      : await resolveCurrentTenant();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }

    const items = await db.getDestinations({
      tenantId: tenant.id,
      category,
      search,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get destinations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await resolveCurrentTenant();
    if (!tenant) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }

    // Verify feature module is enabled for this tenant
    const isEnabled = await db.isFeatureEnabled(tenant.id, "destinations");
    if (!isEnabled) {
      return NextResponse.json(
        { error: "Modul Destinasi Wisata sedang dinonaktifkan oleh Superadmin pada website ini." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      category,
      shortDescription,
      description,
      address,
      city,
      province,
      ticketPrice,
      openingHours,
      facilities,
      mainImage,
      gallery,
      whatsappNumber,
      status,
    } = body;

    if (!name || !category || !shortDescription) {
      return NextResponse.json(
        { error: "Nama destinasi, kategori, dan deskripsi singkat wajib diisi." },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    // Automatic server-side attribution from session user
    const destination = await db.createDestination(
      {
        tenantId: tenant.id,
        name,
        slug,
        category,
        shortDescription,
        description: description || shortDescription,
        address: address || "",
        city: city || "",
        province: province || "",
        ticketPrice: parseFloat(ticketPrice) || 0,
        openingHours: openingHours || "08:00 - 17:00",
        facilities: Array.isArray(facilities) ? facilities : facilities ? [facilities] : [],
        mainImage: mainImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        gallery: Array.isArray(gallery) ? gallery : [],
        whatsappNumber: whatsappNumber || "",
        status: status || "PUBLISHED",
        isFeatured: false,
      },
      sessionUser.userId
    );

    // Audit log
    await db.logActivity({
      tenantId: tenant.id,
      actorUserId: sessionUser.userId,
      action: "CREATE_DESTINATION",
      entityType: "Destination",
      entityId: destination.id,
      description: `Membuat destinasi wisata baru: ${destination.name}`,
    });

    return NextResponse.json({ success: true, destination });
  } catch (error: unknown) {
    console.error("Create destination error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
