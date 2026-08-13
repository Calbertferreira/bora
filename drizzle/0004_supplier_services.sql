CREATE TABLE IF NOT EXISTS "service_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "normalized_name" text NOT NULL,
  "is_system" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_categories_normalized_name_idx" ON "service_categories" ("normalized_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_categories_active_name_idx" ON "service_categories" ("active", "name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_services" (
  "supplier_user_id" uuid NOT NULL REFERENCES "supplier_profiles"("user_id") ON DELETE CASCADE,
  "service_category_id" uuid NOT NULL REFERENCES "service_categories"("id") ON DELETE RESTRICT,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("supplier_user_id", "service_category_id")
);
--> statement-breakpoint
INSERT INTO "service_categories" ("name", "normalized_name", "is_system") VALUES
  ('Espaço para festas', 'espaco para festas', true),
  ('Buffet e alimentação', 'buffet e alimentacao', true),
  ('Decoração', 'decoracao', true),
  ('Bolo e doces', 'bolo e doces', true),
  ('Fotografia', 'fotografia', true),
  ('Filmagem', 'filmagem', true),
  ('DJ', 'dj', true),
  ('Banda e música ao vivo', 'banda e musica ao vivo', true),
  ('Som e iluminação', 'som e iluminacao', true),
  ('Transporte e transfer', 'transporte e transfer', true),
  ('Cerimonial', 'cerimonial', true),
  ('Garçons e equipe', 'garcons e equipe', true),
  ('Bartender e open bar', 'bartender e open bar', true),
  ('Recreação infantil', 'recreacao infantil', true),
  ('Segurança', 'seguranca', true),
  ('Limpeza', 'limpeza', true),
  ('Hospedagem', 'hospedagem', true),
  ('Locação de mobiliário', 'locacao de mobiliario', true),
  ('Convites e lembranças', 'convites e lembrancas', true),
  ('Gerador de energia', 'gerador de energia', true)
ON CONFLICT ("normalized_name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "service_categories" ("name", "normalized_name", "is_system")
SELECT DISTINCT trim("service_category"), lower(trim("service_category")), false
FROM "supplier_profiles"
WHERE trim("service_category") <> ''
ON CONFLICT ("normalized_name") DO NOTHING;
--> statement-breakpoint
INSERT INTO "supplier_services" ("supplier_user_id", "service_category_id")
SELECT sp."user_id", sc."id"
FROM "supplier_profiles" sp
JOIN "service_categories" sc ON sc."normalized_name" = lower(trim(sp."service_category"))
ON CONFLICT DO NOTHING;
