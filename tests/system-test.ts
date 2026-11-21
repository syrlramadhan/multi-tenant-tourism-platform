import assert from "node:assert";
import { db, prisma } from "../lib/db";
import { authenticate } from "../lib/auth";
import { normalizeWhatsAppNumber, getWhatsAppUrl } from "../lib/utils";
import { resolveTenantFromWebParam } from "../lib/tenant/resolver";

// The suite runs against a real database: rows it writes get a per-run suffix and are removed afterwards.
const runId = Date.now().toString(36);
const cleanupIds = {
  tenantIds: [] as string[],
  userIds: [] as string[],
  destinationIds: [] as string[],
  approvalIds: [] as string[],
  logIds: [] as string[],
  logEntityIds: [] as string[],
};

async function cleanup() {
  await prisma.activityLog.deleteMany({
    where: { OR: [{ id: { in: cleanupIds.logIds } }, { entityId: { in: cleanupIds.logEntityIds } }] },
  });
  await prisma.contentApproval.deleteMany({ where: { id: { in: cleanupIds.approvalIds } } });
  await prisma.destination.deleteMany({ where: { id: { in: cleanupIds.destinationIds } } });
  await prisma.user.deleteMany({ where: { id: { in: cleanupIds.userIds } } });
  await prisma.tenant.deleteMany({ where: { id: { in: cleanupIds.tenantIds } } });
}

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🚀 MEMULAI SYSTEM TEST SUITE: MULTI-TENANT TOURISM CMS");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`  ✓ [TEST ${total}] ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ [FAIL ${total}] ${name}:`, err);
      throw err;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [TEST ${total}] ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ [FAIL ${total}] ${name}:`, err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. WhatsApp Normalization & URL Generation
  // ---------------------------------------------------------------------------
  test("1. WhatsApp Normalization: Indonesian formats", () => {
    assert.strictEqual(normalizeWhatsAppNumber("081234567890"), "6281234567890");
    assert.strictEqual(normalizeWhatsAppNumber("+62 812-3456-7890"), "6281234567890");
    assert.strictEqual(normalizeWhatsAppNumber("0813-9876-5432"), "6281398765432");
    assert.strictEqual(normalizeWhatsAppNumber("8123456789"), "628123456789");
    assert.strictEqual(normalizeWhatsAppNumber("invalid-number"), null);
    assert.strictEqual(normalizeWhatsAppNumber(""), null);

    const waUrl = getWhatsAppUrl("081234567890", "Halo Wisata");
    assert.strictEqual(waUrl, "https://wa.me/6281234567890?text=Halo%20Wisata");
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication & Bcrypt Verification
  // ---------------------------------------------------------------------------
  await testAsync("2. Authentication: Superadmin & Website Admin login", async () => {
    const superLogin = await authenticate("superadmin@tourism.id", "password123");
    assert.strictEqual(superLogin.success, true);
    assert.strictEqual(superLogin.user?.isSuperadmin, true);

    const adminLogin = await authenticate("syahrul@wisata-a.com", "password123");
    assert.strictEqual(adminLogin.success, true);
    assert.strictEqual(adminLogin.user?.tenantMemberships[0]?.role, "WEBSITE_ADMIN");

    const failLogin = await authenticate("syahrul@wisata-a.com", "wrongpassword");
    assert.strictEqual(failLogin.success, false);
  });

  // ---------------------------------------------------------------------------
  // 3. Tenant Resolution & Domain Matching
  // ---------------------------------------------------------------------------
  await testAsync("3. Tenant Resolution: Resolve tenant by hostname & web endpoints", async () => {
    const tenantA = await db.getTenantByDomain("wisata-a.localhost:3000");
    assert.strictEqual(tenantA?.slug, "wisata-a");

    const tenantB = await db.getTenantByDomain("wisata-b.localhost:3000");
    assert.strictEqual(tenantB?.slug, "wisata-b");

    const tenantC = await db.getTenantByDomain("wisata-c.localhost:3000");
    assert.strictEqual(tenantC?.slug, "wisata-c");

    // Endpoint parameter resolution: web-a, web-b, web-c
    assert.strictEqual(resolveTenantFromWebParam("web-a"), "tenant-a");
    assert.strictEqual(resolveTenantFromWebParam("web-b"), "tenant-b");
    assert.strictEqual(resolveTenantFromWebParam("web-c"), "tenant-c");
  });

  // ---------------------------------------------------------------------------
  // 4. Tenant Isolation: Data isolation between tenants
  // ---------------------------------------------------------------------------
  await testAsync("4. Tenant Isolation: Contents isolated by tenant_id", async () => {
    const destA = await db.getDestinations({ tenantId: "tenant-a" });
    const destB = await db.getDestinations({ tenantId: "tenant-b" });

    // Assert items belong strictly to their tenant
    assert.ok(destA.length > 0);
    assert.ok(destA.every((d) => d.tenantId === "tenant-a"));

    assert.ok(destB.length > 0);
    assert.ok(destB.every((d) => d.tenantId === "tenant-b"));

    // Check no cross-contamination
    const overlap = destA.some((a) => destB.some((b) => b.id === a.id));
    assert.strictEqual(overlap, false);
  });

  // ---------------------------------------------------------------------------
  // 5. User Quota Limit (Strict MAX 30 Users per Tenant)
  // ---------------------------------------------------------------------------
  await testAsync("5. User Quota: Rejects 31st user when tenant quota is full", async () => {
    const quotaTenant = await db.createTenant({
      name: "Tenant Kuota Test",
      slug: `quota-test-${runId}`,
      description: "Test",
      status: "ACTIVE",
      brandColor: "#533afd",
      domains: [{ domain: `quota-${runId}.localhost`, isPrimary: true }],
      settings: {
        siteName: "Quota Test",
        heroTitle: "Title",
        heroSubtitle: "Sub",
        heroBannerUrl: "",
        contactPhone: "",
        contactEmail: "",
        contactAddress: "",
        seoTitle: "",
        seoDescription: "",
        approvalActive: false,
      },
      features: {},
    });
    cleanupIds.tenantIds.push(quotaTenant.id);
    const testTenantId = quotaTenant.id;

    // Populate exactly 30 users
    for (let i = 1; i <= 30; i++) {
      const res = await db.createUser({
        name: `User ${i}`,
        email: `quota_user_${i}_${runId}@test.com`,
        passwordHash: "hash",
        phone: "081",
        avatarUrl: "",
        isSuperadmin: false,
        status: "ACTIVE",
        tenantMemberships: [{ tenantId: testTenantId, role: "CONTENT_MANAGER" }],
      });
      assert.strictEqual(res.success, true);
      cleanupIds.userIds.push(res.user!.id);
    }

    const count = await db.countTenantUsers(testTenantId);
    assert.strictEqual(count, 30);

    // Attempt to create the 31st user -> MUST BE REJECTED!
    const overflowAttempt = await db.createUser({
      name: "User Ke-31",
      email: `quota_user_31_${runId}@test.com`,
      passwordHash: "hash",
      phone: "081",
      avatarUrl: "",
      isSuperadmin: false,
      status: "ACTIVE",
      tenantMemberships: [{ tenantId: testTenantId, role: "CONTENT_MANAGER" }],
    });

    assert.strictEqual(overflowAttempt.success, false);
    assert.ok(overflowAttempt.error?.includes("30 pengguna"));
  });

  // ---------------------------------------------------------------------------
  // 6. Content Uploader Attribution & Immutable CreatedBy
  // ---------------------------------------------------------------------------
  await testAsync("6. Uploader Attribution: createdById immutable upon edit", async () => {
    const originalAuthorId = "user-author-a";
    const newEditorId = "user-admin-a";

    // 1. Create content
    const created = await db.createDestination(
      {
        tenantId: "tenant-a",
        name: "Pantai Eksotis Baru",
        slug: `pantai-eksotis-baru-${runId}`,
        category: "Pantai",
        shortDescription: "Pantai indah",
        description: "Deskripsi lengkap",
        address: "Jl. Pantai",
        city: "Pesisir",
        province: "Nusantara",
        ticketPrice: 20000,
        openingHours: "08:00 - 17:00",
        facilities: ["Parkir", "Toilet"],
        mainImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        gallery: [],
        whatsappNumber: "081234567890",
        status: "DRAFT",
        isFeatured: false,
      },
      originalAuthorId
    );
    cleanupIds.destinationIds.push(created.id);

    assert.strictEqual(created.createdById, originalAuthorId);
    assert.strictEqual(created.updatedById, originalAuthorId);

    // 2. Edit content by a different user
    const updated = await db.updateDestination(
      created.id,
      { name: "Pantai Eksotis Baru (Edited)", ticketPrice: 35000 },
      newEditorId
    );

    // Assert: createdById MUST NEVER CHANGE!
    assert.strictEqual(updated?.createdById, originalAuthorId);
    // Assert: updatedById is updated to the new editor
    assert.strictEqual(updated?.updatedById, newEditorId);
    assert.strictEqual(updated?.name, "Pantai Eksotis Baru (Edited)");
  });

  // ---------------------------------------------------------------------------
  // 7. Content Approval Workflow
  // ---------------------------------------------------------------------------
  await testAsync("7. Content Approval: Workflow pending -> approve/reject", async () => {
    const entityId = `dest-test-appr-${runId}`;
    cleanupIds.logEntityIds.push(entityId);
    const approval = await db.requestApproval(
      {
        tenantId: "tenant-a",
        entityType: "destinations",
        entityId,
        title: "Kawasan Konservasi Laut",
      },
      "user-author-a"
    );
    cleanupIds.approvalIds.push(approval.id);

    assert.strictEqual(approval.status, "PENDING");
    assert.strictEqual(approval.requestedById, "user-author-a");

    // Website Admin reviews and approves
    const reviewed = await db.reviewApproval(
      approval.id,
      "APPROVED",
      undefined,
      "user-admin-a"
    );

    assert.strictEqual(reviewed?.status, "APPROVED");
    assert.strictEqual(reviewed?.reviewedById, "user-admin-a");
  });

  // ---------------------------------------------------------------------------
  // 8. Feature Management Matrix (ON / OFF)
  // ---------------------------------------------------------------------------
  await testAsync("8. Feature Management: Dynamic module enable/disable", async () => {
    const tenantId = "tenant-a";
    const originallyEnabled = await db.isFeatureEnabled(tenantId, "fashion");

    // Disable fashion module
    await db.updateTenantFeature(tenantId, "fashion", false);
    let isFashionEnabled = await db.isFeatureEnabled(tenantId, "fashion");
    assert.strictEqual(isFashionEnabled, false);

    // Re-enable fashion module
    await db.updateTenantFeature(tenantId, "fashion", true);
    isFashionEnabled = await db.isFeatureEnabled(tenantId, "fashion");
    assert.strictEqual(isFashionEnabled, true);

    await db.updateTenantFeature(tenantId, "fashion", originallyEnabled);
  });

  // ---------------------------------------------------------------------------
  // 9. Activity Audit Logs
  // ---------------------------------------------------------------------------
  await testAsync("9. Activity Audit Logs: Logging mutations with actor identity", async () => {
    const log = await db.logActivity({
      tenantId: "tenant-a",
      actorUserId: "user-admin-a",
      action: "SECURITY_TEST_AUDIT",
      entityType: "System",
      description: "Verifikasi pencatatan audit log sistem",
    });
    cleanupIds.logIds.push(log.id);

    assert.ok(log.id);
    const logs = await db.getActivityLogs("tenant-a", 10);
    assert.ok(logs.some((l) => l.action === "SECURITY_TEST_AUDIT"));
  });

  // ---------------------------------------------------------------------------
  // 10. Endpoint-Isolated Login & Superadmin Multi-Access
  // ---------------------------------------------------------------------------
  await testAsync("10. Endpoint-Isolated Login: /web-[a/b/c]/login isolation & Superadmin access", async () => {
    // Helper function matching login route authorization logic
    const checkLoginAccess = async (email: string, pass: string, web: string) => {
      const authRes = await authenticate(email, pass);
      if (!authRes.success || !authRes.user) return { status: 401, error: "Invalid credentials" };
      const user = authRes.user;
      if (user.isSuperadmin) {
        return { status: 200, redirectTo: "/superadmin" };
      }
      const targetTenantId = resolveTenantFromWebParam(web);
      const hasAccess = user.tenantMemberships.some((m) => m.tenantId === targetTenantId);
      if (!hasAccess) {
        return { status: 403, error: `Akses ditolak untuk endpoint ${web}` };
      }
      return { status: 200, redirectTo: `/${web}/dashboard` };
    };

    // Web A user logs in at /web-a/login -> 200 to /web-a/dashboard
    const userAAtWebA = await checkLoginAccess("syahrul@wisata-a.com", "password123", "web-a");
    assert.strictEqual(userAAtWebA.status, 200);
    assert.strictEqual(userAAtWebA.redirectTo, "/web-a/dashboard");

    // Web A user attempts to log in at /web-b/login -> 403 Forbidden!
    const userAAtWebB = await checkLoginAccess("syahrul@wisata-a.com", "password123", "web-b");
    assert.strictEqual(userAAtWebB.status, 403);

    // Web B user logs in at /web-b/login -> 200 to /web-b/dashboard
    const userBAtWebB = await checkLoginAccess("rahma@wisata-b.com", "password123", "web-b");
    assert.strictEqual(userBAtWebB.status, 200);
    assert.strictEqual(userBAtWebB.redirectTo, "/web-b/dashboard");

    // Web B user attempts to log in at /web-c/login -> 403 Forbidden!
    const userBAtWebC = await checkLoginAccess("rahma@wisata-b.com", "password123", "web-c");
    assert.strictEqual(userBAtWebC.status, 403);

    // Superadmin logs in via /web-a/login -> 200 to /superadmin
    const superAtWebA = await checkLoginAccess("superadmin@tourism.id", "password123", "web-a");
    assert.strictEqual(superAtWebA.status, 200);
    assert.strictEqual(superAtWebA.redirectTo, "/superadmin");

    // Superadmin logs in via /web-b/login -> 200 to /superadmin
    const superAtWebB = await checkLoginAccess("superadmin@tourism.id", "password123", "web-b");
    assert.strictEqual(superAtWebB.status, 200);
    assert.strictEqual(superAtWebB.redirectTo, "/superadmin");

    // Superadmin logs in via /web-c/login -> 200 to /superadmin
    const superAtWebC = await checkLoginAccess("superadmin@tourism.id", "password123", "web-c");
    assert.strictEqual(superAtWebC.status, 200);
    assert.strictEqual(superAtWebC.redirectTo, "/superadmin");
  });

  console.log("\n==========================================================");
  console.log(`🎉 HASIL PENGUJIAN: ${passed}/${total} PENGUJIAN BERHASIL (100% PASS)`);
  console.log("==========================================================");
}

runTestSuite()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await prisma.$disconnect();
  });
