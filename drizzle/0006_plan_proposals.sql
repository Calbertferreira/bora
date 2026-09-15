DO $$ BEGIN
  CREATE TYPE "proposal_status" AS ENUM ('DRAFT', 'PUBLISHED', 'SELECTED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "total_cents" integer NOT NULL,
  "status" "proposal_status" DEFAULT 'PUBLISHED' NOT NULL,
  "valid_until" date,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_proposals_plan_idx" ON "plan_proposals" ("plan_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_proposal_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proposal_id" uuid NOT NULL REFERENCES "plan_proposals"("id") ON DELETE CASCADE,
  "listing_id" uuid REFERENCES "supplier_listings"("id") ON DELETE SET NULL,
  "supplier_user_id" uuid REFERENCES "supplier_profiles"("user_id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text,
  "price_cents" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_proposal_items_proposal_idx" ON "plan_proposal_items" ("proposal_id");
