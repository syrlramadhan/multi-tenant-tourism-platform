import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "../db";
import type { UserData } from "../db/mock-data";

const SESSION_COOKIE_NAME = "tourism_cms_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type MembershipRole = "WEBSITE_ADMIN" | "CONTENT_MANAGER";

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

function signSessionData(data: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET belum diatur (minimal 32 karakter). Lihat .env.example.");
  }
  return createHmac("sha256", secret).update(data).digest("base64url");
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
 * Creates authenticated session cookie (HMAC-signed so it cannot be forged or edited)
 */
export async function createSession(user: UserData) {
  const cookieStore = await cookies();
  const payload: SessionPayload & { exp: number } = {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    isSuperadmin: user.isSuperadmin,
    tenantMemberships: user.tenantMemberships,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");

  cookieStore.set(SESSION_COOKIE_NAME, `${data}.${signSessionData(data)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
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
 * Retrieves currently logged-in user from session (null if missing, tampered, or expired)
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const [data, signature] = cookieStore.get(SESSION_COOKIE_NAME)?.value.split(".") ?? [];
  if (!data || !signature) return null;

  const expected = Buffer.from(signSessionData(data));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const { exp, ...session } = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (typeof exp !== "number" || exp * 1000 < Date.now()) return null;
    return session as SessionPayload;
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
 * Whether the user may act on the tenant (optionally limited to roles).
 * Superadmin always has global access.
 */
export function hasTenantAccess(
  user: SessionPayload,
  tenantId: string,
  allowedRoles?: MembershipRole[]
): boolean {
  if (user.isSuperadmin) return true;
  const membership = user.tenantMemberships.find((m) => m.tenantId === tenantId);
  if (!membership) return false;
  return !allowedRoles?.length || allowedRoles.includes(membership.role as MembershipRole);
}

/**
 * Verifies user has access to the specified tenant with appropriate role.
 * Superadmin always bypasses tenant checks with global access.
 */
export async function requireTenantAccess(
  tenantId: string,
  allowedRoles?: MembershipRole[]
): Promise<SessionPayload> {
  const user = await requireAuth();

  if (!hasTenantAccess(user, tenantId)) {
    throw new Error("Forbidden: Anda tidak memiliki akses ke website ini.");
  }

  if (!hasTenantAccess(user, tenantId, allowedRoles)) {
    throw new Error("Forbidden: Peran Anda tidak memiliki izin untuk tindakan ini.");
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
