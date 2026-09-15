DO $$ BEGIN CREATE TYPE "event_origin" AS ENUM ('CLIENT', 'SUPPLIER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "whatsapp_number" text NOT NULL, "name" text NOT NULL, "email" text NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_by_supplier_id" uuid REFERENCES "supplier_profiles"("user_id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "client_contacts_whatsapp_idx" ON "client_contacts" ("whatsapp_number");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "client_contacts_user_idx" ON "client_contacts" ("user_id");
--> statement-breakpoint
INSERT INTO "client_contacts" ("whatsapp_number", "name", "email", "user_id") SELECT up."whatsapp_number", u."name", lower(u."email"), u."id" FROM "users" u JOIN "user_profiles" up ON up."user_id"=u."id" JOIN "user_roles" ur ON ur."user_id"=u."id" AND ur."role"='CLIENT' ON CONFLICT ("whatsapp_number") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "event_packages" ADD COLUMN IF NOT EXISTS "client_contact_id" uuid REFERENCES "client_contacts"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "event_packages" ADD COLUMN IF NOT EXISTS "venue_listing_id" uuid REFERENCES "supplier_listings"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "event_packages" ADD COLUMN IF NOT EXISTS "origin" "event_origin" DEFAULT 'SUPPLIER' NOT NULL;
--> statement-breakpoint
UPDATE "event_packages" ep SET "client_contact_id"=cc."id" FROM "client_contacts" cc WHERE ep."client_contact_id" IS NULL AND regexp_replace(coalesce(ep."client_whatsapp",''),'[^0-9]','','g')=cc."whatsapp_number";
