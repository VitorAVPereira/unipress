import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_product_families_technical_profile" AS ENUM('manometro', 'acessorio', 'generico');
  CREATE TYPE "public"."enum_products_family_profile" AS ENUM('manometro', 'acessorio', 'generico');
  CREATE TYPE "public"."enum__products_v_version_family_profile" AS ENUM('manometro', 'acessorio', 'generico');
  CREATE TYPE "public"."enum_services_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "product_families" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"technical_profile" "enum_product_families_technical_profile" DEFAULT 'generico' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Serviços metrológicos',
  	"title" varchar DEFAULT 'Confiança para medir. Segurança para decidir.',
  	"description" varchar DEFAULT 'Atendimento em laboratório para instrumentos enviados de todo o Brasil.',
  	"_status" "enum_services_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_services_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_eyebrow" varchar DEFAULT 'Serviços metrológicos',
  	"version_title" varchar DEFAULT 'Confiança para medir. Segurança para decidir.',
  	"version_description" varchar DEFAULT 'Atendimento em laboratório para instrumentos enviados de todo o Brasil.',
  	"version__status" "enum__services_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  DROP INDEX "products_family_idx";
  DROP INDEX "_products_v_version_version_family_idx";
  DROP INDEX "product_categories_family_idx";
  ALTER TABLE "products" ADD COLUMN "_order" varchar;
  ALTER TABLE "products" ADD COLUMN "family_id" integer;
  ALTER TABLE "products" ADD COLUMN "family_profile" "enum_products_family_profile" DEFAULT 'generico';
  ALTER TABLE "_products_v" ADD COLUMN "version__order" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_family_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_family_profile" "enum__products_v_version_family_profile" DEFAULT 'generico';
  ALTER TABLE "product_categories" ADD COLUMN "family_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "product_families_id" integer;
  INSERT INTO "product_families" ("name", "slug", "technical_profile") VALUES
    ('Manômetro', 'manometro', 'manometro'),
    ('Acessório', 'acessorio', 'acessorio');
  UPDATE "products" AS product
    SET "family_id" = family."id",
        "family_profile" = product."family"::text::"public"."enum_products_family_profile"
    FROM "product_families" AS family
    WHERE family."slug" = product."family"::text;
  UPDATE "_products_v" AS version
    SET "version_family_id" = family."id",
        "version_family_profile" = version."version_family"::text::"public"."enum__products_v_version_family_profile"
    FROM "product_families" AS family
    WHERE family."slug" = version."version_family"::text;
  UPDATE "product_categories" AS category
    SET "family_id" = family."id"
    FROM "product_families" AS family
    WHERE family."slug" = category."family"::text;
  WITH ranked AS (
    SELECT "id", row_number() OVER (ORDER BY "name", "id") AS position
    FROM "products"
  )
  UPDATE "products" AS product
    SET "_order" = 'a' || lpad(ranked.position::text, 8, '0')
    FROM ranked
    WHERE ranked."id" = product."id";
  WITH ranked_versions AS (
    SELECT "id", row_number() OVER (ORDER BY "version_name", "id") AS position
    FROM "_products_v"
  )
  UPDATE "_products_v" AS version
    SET "version__order" = 'a' || lpad(ranked_versions.position::text, 8, '0')
    FROM ranked_versions
    WHERE ranked_versions."id" = version."id";
  ALTER TABLE "product_categories" ALTER COLUMN "family_id" SET NOT NULL;
  CREATE UNIQUE INDEX "product_families_slug_idx" ON "product_families" USING btree ("slug");
  CREATE INDEX "product_families_updated_at_idx" ON "product_families" USING btree ("updated_at");
  CREATE INDEX "product_families_created_at_idx" ON "product_families" USING btree ("created_at");
  CREATE INDEX "services_page__status_idx" ON "services_page" USING btree ("_status");
  CREATE INDEX "_services_page_v_version_version__status_idx" ON "_services_page_v" USING btree ("version__status");
  CREATE INDEX "_services_page_v_created_at_idx" ON "_services_page_v" USING btree ("created_at");
  CREATE INDEX "_services_page_v_updated_at_idx" ON "_services_page_v" USING btree ("updated_at");
  CREATE INDEX "_services_page_v_latest_idx" ON "_services_page_v" USING btree ("latest");
  CREATE INDEX "_services_page_v_autosave_idx" ON "_services_page_v" USING btree ("autosave");
  ALTER TABLE "products" ADD CONSTRAINT "products_family_id_product_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."product_families"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_family_id_product_families_id_fk" FOREIGN KEY ("version_family_id") REFERENCES "public"."product_families"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_family_id_product_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."product_families"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_families_fk" FOREIGN KEY ("product_families_id") REFERENCES "public"."product_families"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products__order_idx" ON "products" USING btree ("_order");
  CREATE INDEX "_products_v_version_version__order_idx" ON "_products_v" USING btree ("version__order");
  CREATE INDEX "payload_locked_documents_rels_product_families_id_idx" ON "payload_locked_documents_rels" USING btree ("product_families_id");
  CREATE INDEX "products_family_idx" ON "products" USING btree ("family_id");
  CREATE INDEX "_products_v_version_version_family_idx" ON "_products_v" USING btree ("version_family_id");
  CREATE INDEX "product_categories_family_idx" ON "product_categories" USING btree ("family_id");
  ALTER TABLE "products" DROP COLUMN "family";
  ALTER TABLE "_products_v" DROP COLUMN "version_family";
  ALTER TABLE "product_categories" DROP COLUMN "family";
  DROP TYPE "public"."enum_products_family";
  DROP TYPE "public"."enum__products_v_version_family";
  DROP TYPE "public"."enum_product_categories_family";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM "products" AS product
      JOIN "product_families" AS family ON family."id" = product."family_id"
      WHERE family."technical_profile" = 'generico'
    ) OR EXISTS (
      SELECT 1
      FROM "product_categories" AS category
      JOIN "product_families" AS family ON family."id" = category."family_id"
      WHERE family."technical_profile" = 'generico'
    ) THEN
      RAISE EXCEPTION 'Não é possível reverter: existem produtos ou categorias em famílias genéricas.';
    END IF;
  END $$;
  CREATE TYPE "public"."enum_products_family" AS ENUM('manometro', 'acessorio');
  CREATE TYPE "public"."enum__products_v_version_family" AS ENUM('manometro', 'acessorio');
  CREATE TYPE "public"."enum_product_categories_family" AS ENUM('manometro', 'acessorio');
  ALTER TABLE "product_categories" ADD COLUMN "family" "enum_product_categories_family";
  ALTER TABLE "products" ADD COLUMN "family" "enum_products_family";
  ALTER TABLE "_products_v" ADD COLUMN "version_family" "enum__products_v_version_family";
  UPDATE "products" AS product
    SET "family" = family."technical_profile"::text::"public"."enum_products_family"
    FROM "product_families" AS family
    WHERE family."id" = product."family_id";
  UPDATE "_products_v" AS version
    SET "version_family" = family."technical_profile"::text::"public"."enum__products_v_version_family"
    FROM "product_families" AS family
    WHERE family."id" = version."version_family_id";
  UPDATE "product_categories" AS category
    SET "family" = family."technical_profile"::text::"public"."enum_product_categories_family"
    FROM "product_families" AS family
    WHERE family."id" = category."family_id";
  ALTER TABLE "product_categories" ALTER COLUMN "family" SET NOT NULL;
  ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_family_id_product_families_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_family_id_product_families_id_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_family_id_product_families_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_product_families_fk";
  
  DROP INDEX "products__order_idx";
  DROP INDEX "_products_v_version_version__order_idx";
  DROP INDEX "payload_locked_documents_rels_product_families_id_idx";
  DROP INDEX "product_categories_family_idx";
  DROP INDEX "products_family_idx";
  DROP INDEX "_products_v_version_version_family_idx";
  CREATE INDEX "product_categories_family_idx" ON "product_categories" USING btree ("family");
  CREATE INDEX "products_family_idx" ON "products" USING btree ("family");
  CREATE INDEX "_products_v_version_version_family_idx" ON "_products_v" USING btree ("version_family");
  ALTER TABLE "product_categories" DROP COLUMN "family_id";
  ALTER TABLE "products" DROP COLUMN "_order";
  ALTER TABLE "products" DROP COLUMN "family_id";
  ALTER TABLE "products" DROP COLUMN "family_profile";
  ALTER TABLE "_products_v" DROP COLUMN "version__order";
  ALTER TABLE "_products_v" DROP COLUMN "version_family_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_family_profile";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "product_families_id";
  ALTER TABLE "product_families" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_page_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "product_families" CASCADE;
  DROP TABLE "services_page" CASCADE;
  DROP TABLE "_services_page_v" CASCADE;
  DROP TYPE "public"."enum_product_families_technical_profile";
  DROP TYPE "public"."enum_products_family_profile";
  DROP TYPE "public"."enum__products_v_version_family_profile";
  DROP TYPE "public"."enum_services_page_status";
  DROP TYPE "public"."enum__services_page_v_version_status";`)
}
