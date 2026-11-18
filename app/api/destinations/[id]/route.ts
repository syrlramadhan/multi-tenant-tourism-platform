import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await db.getDestinationById(id);
    if (!item) {
      return NextResponse.json({ error: "Destinasi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.getDestinationById(id);
    if (!existing) {
      return NextResponse.json({ error: "Destinasi tidak ditemukan" }, { status: 404 });
    }

    // Server-side update: strictly updates updatedById to sessionUser.userId
    const updated = await db.updateDestination(id, body, sessionUser.userId);

    // Activity log
    await db.logActivity({
      tenantId: existing.tenantId,
      actorUserId: sessionUser.userId,
      action: "UPDATE_DESTINATION",
      entityType: "Destination",
      entityId: id,
      description: `Memperbarui destinasi wisata: ${updated?.name || existing.name}`,
    });

    return NextResponse.json({ success: true, destination: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.getDestinationById(id);
    if (!existing) {
      return NextResponse.json({ error: "Destinasi tidak ditemukan" }, { status: 404 });
    }

    await db.deleteDestination(id);

    await db.logActivity({
      tenantId: existing.tenantId,
      actorUserId: sessionUser.userId,
      action: "DELETE_DESTINATION",
      entityType: "Destination",
      entityId: id,
      description: `Menghapus destinasi wisata: ${existing.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
