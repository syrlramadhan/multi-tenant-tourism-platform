import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "../db";
import type { UserData } from "../db/mock-data";

const SESSION_COOKIE_NAME = "tourism_cms_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperadmin: boolean;
  tenantMemberships: {
    tenantId: string;
    role: "SUPERADMIN" | "WEBSITE_ADMIN" | "CONTENT_MANAGER";
  }[];
}

/**
 * Validates user credentials and returns user payload
 */
export async function authenticate(
  email: string,
  plainPassword: string
): Promise<{ success: boolean; user?: UserData; error?: string }> {
  const user = await db.getUserByEmail(email);
  if (!user) {
    return { success: false, error: "Email atau kata sandi tidak valid." };
  }

  if (user.status !== "ACTIVE") {
    return { success: false, error: "Akun Anda saat ini dinonaktifkan." };
  }

  const isMatch = bcrypt.compareSync(plainPassword, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: "Email atau kata sandi tidak valid." };
  }

  return { success: true, user };
}

/**
 * Creates authenticated session cookie
 */
export async function createSession(user: UserData) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isSuperadmin: user.isSuperadmin,
    tenantMemberships: user.tenantMemberships,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");

  cookieStore.set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears authenticated session
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieves currently logged-in user from session
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;

    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    const payload = JSON.parse(decoded) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Asserts user is logged in
 */
export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Anda harus masuk terlebih dahulu.");
  }
  return user;
}

/**
 * Verifies user has access to the specified tenant with appropriate role.
 * Superadmin always bypasses tenant checks with global access.
 */
export async function requireTenantAccess(
  tenantId: string,
  allowedRoles?: ("WEBSITE_ADMIN" | "CONTENT_MANAGER")[]
): Promise<SessionPayload> {
  const user = await requireAuth();

  // Superadmin has global privilege across all tenants
  if (user.isSuperadmin) {
    return user;
  }

  const membership = user.tenantMemberships.find((m) => m.tenantId === tenantId);
  if (!membership) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke website ini.");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(membership.role as "WEBSITE_ADMIN" | "CONTENT_MANAGER")) {
      throw new Error("Forbidden: Peran Anda tidak memiliki izin untuk tindakan ini.");
    }
  }

  return user;
}

/**
 * Asserts user is Superadmin
 */
export async function requireSuperadmin(): Promise<SessionPayload> {
  const user = await requireAuth();
  if (!user.isSuperadmin) {
    throw new Error("Forbidden: Tindakan ini memerlukan akses Superadmin.");
  }
  return user;
}
