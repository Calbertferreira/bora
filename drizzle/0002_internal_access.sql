DO $$ BEGIN
  CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internal_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "role" "app_role" NOT NULL,
  "whatsapp_number" text,
  "whatsapp_name" text,
  "token_hash" text NOT NULL UNIQUE,
  "status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
  "invited_by" uuid NOT NULL REFERENCES "users"("id"),
  "accepted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internal_invitations_email_idx" ON "internal_invitations" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "internal_invitations_status_idx" ON "internal_invitations" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "target_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" ("actor_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_target_idx" ON "audit_logs" ("target_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at");
