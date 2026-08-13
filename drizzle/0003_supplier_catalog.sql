DO $$ BEGIN
  CREATE TYPE "supplier_listing_type" AS ENUM ('VENUE', 'BUFFET', 'DECORATION_THEME', 'SERVICE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "supplier_price_unit" AS ENUM ('PER_EVENT', 'PER_PERSON', 'PER_DAY', 'STARTING_AT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "supplier_listing_status" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "supplier_user_id" uuid NOT NULL REFERENCES "supplier_profiles"("user_id") ON DELETE CASCADE,
  "type" "supplier_listing_type" NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price_cents" integer NOT NULL CHECK ("price_cents" > 0),
  "price_unit" "supplier_price_unit" NOT NULL,
  "capacity" integer CHECK ("capacity" IS NULL OR "capacity" > 0),
  "city" text,
  "state" text,
  "status" "supplier_listing_status" DEFAULT 'DRAFT' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_listings_supplier_idx" ON "supplier_listings" ("supplier_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_listings_type_status_idx" ON "supplier_listings" ("type", "status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_listing_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "listing_id" uuid NOT NULL REFERENCES "supplier_listings"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "pathname" text NOT NULL,
  "alt_text" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_listing_images_listing_idx" ON "supplier_listing_images" ("listing_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "supplier_listing_images_pathname_idx" ON "supplier_listing_images" ("pathname");
