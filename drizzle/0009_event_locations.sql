CREATE TABLE IF NOT EXISTS "event_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "normalized_address" text NOT NULL,
  "city" text,
  "state" text,
  "created_by_supplier_id" uuid REFERENCES "supplier_profiles"("user_id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_locations_address_idx" ON "event_locations" ("normalized_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_locations_name_idx" ON "event_locations" ("name");
--> statement-breakpoint
ALTER TABLE "supplier_listings" ADD COLUMN IF NOT EXISTS "event_location_id" uuid REFERENCES "event_locations"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "supplier_listings" ADD COLUMN IF NOT EXISTS "address" text;
--> statement-breakpoint
ALTER TABLE "event_packages" ADD COLUMN IF NOT EXISTS "event_location_id" uuid REFERENCES "event_locations"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_packages_location_idx" ON "event_packages" ("event_location_id");
