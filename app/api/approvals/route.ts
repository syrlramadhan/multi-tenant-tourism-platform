import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resolveCurrentTenant } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const tenant = await resolveCurrentTenant();
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    const approvals = await db.getApprovals(tenant.id);
    return NextResponse.json(approvals);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { approvalId, status, rejectionReason } = body;

    if (!approvalId || !status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Data approval tidak valid" }, { status: 400 });
    }

    const updated = await db.reviewApproval(
      approvalId,
      status,
      rejectionReason,
      sessionUser.userId
    );

    return NextResponse.json({ success: true, approval: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
