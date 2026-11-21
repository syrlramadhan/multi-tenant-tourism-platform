import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, hasTenantAccess } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    if (user.isSuperadmin) {
      const users = await db.getUsers(tenantId);
      return NextResponse.json(users);
    }

    // Other roles can only view users of a website they belong to
    const allowedTenantId = tenantId ?? user.tenantMemberships[0]?.tenantId;
    if (!allowedTenantId || !hasTenantAccess(user, allowedTenantId)) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke website ini." }, { status: 403 });
    }

    const users = await db.getUsers(allowedTenantId);
    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, tenantId, role, isSuperadmin } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    // Role verification
    if (!sessionUser.isSuperadmin && isSuperadmin) {
      return NextResponse.json(
        { error: "Hanya Superadmin yang dapat membuat Superadmin baru." },
        { status: 403 }
      );
    }

    const memberships: { tenantId: string; role: "SUPERADMIN" | "WEBSITE_ADMIN" | "CONTENT_MANAGER" }[] = [];
    if (tenantId) {
      // Only the website's admins (or Superadmin) may add users to it
      if (!hasTenantAccess(sessionUser, tenantId, ["WEBSITE_ADMIN"])) {
        return NextResponse.json(
          { error: "Anda tidak memiliki izin mengelola pengguna website ini." },
          { status: 403 }
        );
      }
      if (role !== "WEBSITE_ADMIN" && role !== "CONTENT_MANAGER") {
        return NextResponse.json({ error: "Peran pengguna tidak valid." }, { status: 400 });
      }
      if (!(await db.getTenantById(tenantId))) {
        return NextResponse.json({ error: "Website tidak ditemukan." }, { status: 404 });
      }
      memberships.push({ tenantId, role });
    } else if (!sessionUser.isSuperadmin) {
      return NextResponse.json(
        { error: "Hanya Superadmin yang dapat membuat pengguna tanpa website." },
        { status: 403 }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 8);

    const result = await db.createUser({
      name,
      email,
      passwordHash,
      phone: phone || "",
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      isSuperadmin: isSuperadmin || false,
      status: "ACTIVE",
      tenantMemberships: memberships,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    // Activity audit
    await db.logActivity({
      tenantId: tenantId || undefined,
      actorUserId: sessionUser.userId,
      action: "CREATE_USER",
      entityType: "User",
      entityId: result.user?.id,
      description: `Menambahkan pengguna baru: ${name} (${email}) dengan peran ${role || "User"}`,
    });

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: unknown) {
    console.error("Create user error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
