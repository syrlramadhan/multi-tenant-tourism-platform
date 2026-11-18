import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json();
    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("active_tenant_id", tenantId, {
      path: "/",
      maxAge: 86400,
      httpOnly: false,
    });

    return NextResponse.json({ success: true, tenantId });
  } catch {
    return NextResponse.json({ error: "Failed to switch tenant" }, { status: 500 });
  }
}
