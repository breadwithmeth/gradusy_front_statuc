DO $$
BEGIN
  CREATE TYPE "LinkTarget" AS ENUM ('frontend', 'direct');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Link"
  ADD COLUMN IF NOT EXISTS "target" "LinkTarget" NOT NULL DEFAULT 'frontend';
