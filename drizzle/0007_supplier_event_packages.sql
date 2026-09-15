ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "administration_fee_bps" integer DEFAULT 1000 NOT NULL;
--> statement-breakpoint
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "contract_template_url" text;
--> statement-breakpoint
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "contract_template_pathname" text;
--> statement-breakpoint
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "contract_template_name" text;
--> statement-breakpoint
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "contract_template_uploaded_at" timestamp with time zone;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "event_package_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "package_provider_kind" AS ENUM ('SELF', 'REGISTERED', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organizer_supplier_id" uuid NOT NULL REFERENCES "supplier_profiles"("user_id") ON DELETE CASCADE,
  "client_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "client_name" text NOT NULL, "client_email" text NOT NULL, "client_whatsapp" text,
  "event_type" text NOT NULL, "event_title" text NOT NULL, "event_date" date, "event_location" text,
  "status" "event_package_status" DEFAULT 'DRAFT' NOT NULL,
  "subtotal_cents" integer NOT NULL, "administration_fee_bps" integer NOT NULL,
  "administration_fee_cents" integer NOT NULL, "total_cents" integer NOT NULL,
  "sent_at" timestamp with time zone, "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_packages_supplier_idx" ON "event_packages" ("organizer_supplier_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_packages_client_idx" ON "event_packages" ("client_user_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_package_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "package_id" uuid NOT NULL REFERENCES "event_packages"("id") ON DELETE CASCADE,
  "service_name" text NOT NULL, "description" text,
  "provider_kind" "package_provider_kind" NOT NULL,
  "provider_supplier_id" uuid REFERENCES "supplier_profiles"("user_id") ON DELETE SET NULL,
  "provider_name" text NOT NULL, "amount_cents" integer NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL, "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_package_items_package_idx" ON "event_package_items" ("package_id", "sort_order");
