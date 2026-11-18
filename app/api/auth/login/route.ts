import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { resolveTenantFromWebParam } from "@/lib/tenant/resolver";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password, web } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const res = await authenticate(email, password);

    if (!res.success || !res.user) {
      return NextResponse.json(
        { error: res.error || "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    const user = res.user;

    // Determine target redirect & check web authorization
    let redirectTo = "/superadmin";

    if (user.isSuperadmin) {
      // Superadmin can login from any web endpoint and always goes to /superadmin
      redirectTo = "/superadmin";
    } else if (web) {
      const targetTenantId = resolveTenantFromWebParam(web);
      const hasAccess = user.tenantMemberships.some((m) => m.tenantId === targetTenantId);

      if (!hasAccess) {
        const targetTenant = await db.getTenantById(targetTenantId);
        const websiteName = targetTenant?.name || web.toUpperCase();
        return NextResponse.json(
          {
            error: `Akses ditolak: Akun ${user.email} tidak memiliki izin akses ke ${websiteName}. Hanya staf terdaftar untuk ${websiteName} atau Superadmin yang diizinkan masuk.`,
          },
          { status: 403 }
        );
      }

      redirectTo = `/${web}/dashboard`;
    } else {
      const firstMembership = user.tenantMemberships[0];
      const webSlug =
        firstMembership?.tenantId === "tenant-b"
          ? "web-b"
          : firstMembership?.tenantId === "tenant-c"
          ? "web-c"
          : "web-a";
      redirectTo = `/${webSlug}/dashboard`;
    }

    await createSession(user);

    return NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuperadmin: user.isSuperadmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
