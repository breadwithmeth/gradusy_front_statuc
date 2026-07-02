DO $$
BEGIN
  CREATE TYPE "UserRole" AS ENUM ('admin', 'editor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LinkKind" AS ENUM ('app', 'store', 'promo', 'bonus', 'messenger', 'social', 'phone', 'website');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'admin',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Link" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "href" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "kind" "LinkKind" NOT NULL,
  "icon" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Click" (
  "id" TEXT NOT NULL,
  "linkId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referer" TEXT,
  "source" TEXT,
  "country" TEXT,
  "city" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EntryLink" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "slug" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EntryLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Settings" (
  "id" TEXT NOT NULL DEFAULT 'site_settings',
  "brandName" TEXT NOT NULL DEFAULT 'Градусы24',
  "headline" TEXT NOT NULL DEFAULT 'Всегда в вашем кругу',
  "description" TEXT NOT NULL DEFAULT 'Круглосуточный маркет-бар. Доставка напитков, снеков и товаров для отдыха.',
  "primaryColor" TEXT NOT NULL DEFAULT '#F97300',
  "accentColor" TEXT NOT NULL DEFAULT '#7A1B12',
  "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
  "appStoreUrl" TEXT,
  "googlePlayUrl" TEXT,
  "phone" TEXT NOT NULL DEFAULT '+7 700 000 24 24',
  "whatsapp" TEXT NOT NULL DEFAULT 'https://wa.me/77000002424',
  "telegram" TEXT NOT NULL DEFAULT 'https://t.me/gradusy24',
  "instagram" TEXT NOT NULL DEFAULT 'https://instagram.com/gradusy24',
  "website" TEXT NOT NULL DEFAULT 'https://gradusy24.kz',
  "qrTargetUrl" TEXT NOT NULL DEFAULT 'https://gradusy24.kz',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");
CREATE INDEX IF NOT EXISTS "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Link_slug_key" ON "Link"("slug");
CREATE INDEX IF NOT EXISTS "Link_isActive_sortOrder_idx" ON "Link"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "Click_createdAt_idx" ON "Click"("createdAt");
CREATE INDEX IF NOT EXISTS "Click_linkId_createdAt_idx" ON "Click"("linkId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "EntryLink_slug_key" ON "EntryLink"("slug");
CREATE INDEX IF NOT EXISTS "EntryLink_isActive_sortOrder_idx" ON "EntryLink"("isActive", "sortOrder");

DO $$
BEGIN
  ALTER TABLE "Session"
    ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Click"
    ADD CONSTRAINT "Click_linkId_fkey"
    FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
