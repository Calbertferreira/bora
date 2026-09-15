ALTER TYPE "experience_type" ADD VALUE IF NOT EXISTS 'suggest';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "plan_status" AS ENUM (
    'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'PROPOSALS_AVAILABLE', 'SELECTED',
    'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "occasion" text;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "idea" text;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "city" text;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "state" text;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "start_date" date;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "end_date" date;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "budget_label" text;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "status" "plan_status" DEFAULT 'SUBMITTED' NOT NULL;
--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plans_user_created_idx" ON "plans" ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plans_status_created_idx" ON "plans" ("status", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "plan_services_plan_name_idx" ON "plan_services" ("plan_id", "name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_services_plan_idx" ON "plan_services" ("plan_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plan_id" uuid NOT NULL REFERENCES "plans"("id") ON DELETE CASCADE,
  "status" "plan_status" NOT NULL,
  "note" text,
  "changed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "plan_status_history_plan_idx" ON "plan_status_history" ("plan_id", "created_at");
