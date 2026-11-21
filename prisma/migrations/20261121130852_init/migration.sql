-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "phone" TEXT,
    "is_superadmin" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tenants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_features" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ticket_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "opening_hours" TEXT NOT NULL,
    "facilities" TEXT[],
    "main_image" TEXT NOT NULL,
    "gallery" TEXT[],
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accommodations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "accommodation_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price_range" TEXT NOT NULL,
    "facilities" TEXT[],
    "images" TEXT[],
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accommodations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fashion" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "images" TEXT[],
    "seller_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "fashion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rental_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "images" TEXT[],
    "location" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culinary" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "culinary_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "menu" TEXT,
    "price_range" TEXT NOT NULL,
    "opening_hours" TEXT NOT NULL,
    "images" TEXT[],
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "culinary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_guides" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_image" TEXT,
    "description" TEXT NOT NULL,
    "experience_years" INTEGER NOT NULL DEFAULT 1,
    "languages" TEXT[],
    "expertise" TEXT NOT NULL,
    "portfolio" TEXT,
    "location" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tour_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groceries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "images" TEXT[],
    "whatsapp_number" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "groceries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "documentation_type" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "gallery" TEXT[],
    "event_date" TIMESTAMP(3),
    "location" TEXT,
    "social_media_link" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "brand_color" TEXT NOT NULL DEFAULT '#533afd',
    "hero_title" TEXT,
    "hero_subtitle" TEXT,
    "hero_banner_url" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "social_links" JSONB,
    "approval_active" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "actor_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_domains_domain_key" ON "tenant_domains"("domain");

-- CreateIndex
CREATE INDEX "tenant_domains_tenant_id_idx" ON "tenant_domains"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_domains_domain_idx" ON "tenant_domains"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_tenants_tenant_id_idx" ON "user_tenants"("tenant_id");

-- CreateIndex
CREATE INDEX "user_tenants_user_id_idx" ON "user_tenants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenants_user_id_tenant_id_key" ON "user_tenants"("user_id", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "features_key_key" ON "features"("key");

-- CreateIndex
CREATE INDEX "tenant_features_tenant_id_idx" ON "tenant_features"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_features_tenant_id_feature_key_key" ON "tenant_features"("tenant_id", "feature_key");

-- CreateIndex
CREATE INDEX "destinations_tenant_id_idx" ON "destinations"("tenant_id");

-- CreateIndex
CREATE INDEX "destinations_status_idx" ON "destinations"("status");

-- CreateIndex
CREATE INDEX "destinations_is_featured_idx" ON "destinations"("is_featured");

-- CreateIndex
CREATE INDEX "destinations_category_idx" ON "destinations"("category");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_tenant_id_slug_key" ON "destinations"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "accommodations_tenant_id_idx" ON "accommodations"("tenant_id");

-- CreateIndex
CREATE INDEX "accommodations_status_idx" ON "accommodations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "accommodations_tenant_id_slug_key" ON "accommodations"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "fashion_tenant_id_idx" ON "fashion"("tenant_id");

-- CreateIndex
CREATE INDEX "fashion_status_idx" ON "fashion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fashion_tenant_id_slug_key" ON "fashion"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_idx" ON "vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "culinary_tenant_id_idx" ON "culinary"("tenant_id");

-- CreateIndex
CREATE INDEX "culinary_status_idx" ON "culinary"("status");

-- CreateIndex
CREATE UNIQUE INDEX "culinary_tenant_id_slug_key" ON "culinary"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "tour_guides_tenant_id_idx" ON "tour_guides"("tenant_id");

-- CreateIndex
CREATE INDEX "tour_guides_status_idx" ON "tour_guides"("status");

-- CreateIndex
CREATE INDEX "groceries_tenant_id_idx" ON "groceries"("tenant_id");

-- CreateIndex
CREATE INDEX "groceries_status_idx" ON "groceries"("status");

-- CreateIndex
CREATE INDEX "documentations_tenant_id_idx" ON "documentations"("tenant_id");

-- CreateIndex
CREATE INDEX "documentations_status_idx" ON "documentations"("status");

-- CreateIndex
CREATE INDEX "media_tenant_id_idx" ON "media"("tenant_id");

-- CreateIndex
CREATE INDEX "media_uploaded_by_idx" ON "media"("uploaded_by");

-- CreateIndex
CREATE UNIQUE INDEX "website_settings_tenant_id_key" ON "website_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_idx" ON "activity_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "activity_logs_actor_user_id_idx" ON "activity_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "content_approvals_tenant_id_idx" ON "content_approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "content_approvals_status_idx" ON "content_approvals"("status");

-- AddForeignKey
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenants" ADD CONSTRAINT "user_tenants_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_features" ADD CONSTRAINT "tenant_features_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_features" ADD CONSTRAINT "tenant_features_feature_key_fkey" FOREIGN KEY ("feature_key") REFERENCES "features"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accommodations" ADD CONSTRAINT "accommodations_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion" ADD CONSTRAINT "fashion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion" ADD CONSTRAINT "fashion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion" ADD CONSTRAINT "fashion_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion" ADD CONSTRAINT "fashion_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culinary" ADD CONSTRAINT "culinary_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culinary" ADD CONSTRAINT "culinary_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culinary" ADD CONSTRAINT "culinary_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culinary" ADD CONSTRAINT "culinary_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guides" ADD CONSTRAINT "tour_guides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guides" ADD CONSTRAINT "tour_guides_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guides" ADD CONSTRAINT "tour_guides_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tour_guides" ADD CONSTRAINT "tour_guides_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentations" ADD CONSTRAINT "documentations_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_settings" ADD CONSTRAINT "website_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_approvals" ADD CONSTRAINT "content_approvals_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EnableRowLevelSecurity
-- Supabase exposes "public" through its Data API; with no policies, anon/authenticated are denied while the
-- app's "prisma" user (table owner, BYPASSRLS) is unaffected.
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_features" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "destinations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accommodations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fashion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "culinary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tour_guides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groceries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documentations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "website_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_approvals" ENABLE ROW LEVEL SECURITY;
