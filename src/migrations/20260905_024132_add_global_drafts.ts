import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_contact_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_privacy_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__privacy_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_contact_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'Vamos entender a sua necessidade.',
  	"version_description" varchar DEFAULT 'Fale com a equipe UniPress para consultar disponibilidade, especificações ou calibração.',
  	"version__status" "enum__contact_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_privacy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_title" varchar DEFAULT 'Política de Privacidade',
  	"version_updated_at_label" varchar,
  	"version_content" jsonb,
  	"version__status" "enum__privacy_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "contact" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "description" DROP NOT NULL;
  ALTER TABLE "privacy" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "contact" ADD COLUMN "_status" "enum_contact_status" DEFAULT 'draft';
  ALTER TABLE "privacy" ADD COLUMN "_status" "enum_privacy_status" DEFAULT 'draft';
  CREATE INDEX "_contact_v_version_version__status_idx" ON "_contact_v" USING btree ("version__status");
  CREATE INDEX "_contact_v_created_at_idx" ON "_contact_v" USING btree ("created_at");
  CREATE INDEX "_contact_v_updated_at_idx" ON "_contact_v" USING btree ("updated_at");
  CREATE INDEX "_contact_v_latest_idx" ON "_contact_v" USING btree ("latest");
  CREATE INDEX "_contact_v_autosave_idx" ON "_contact_v" USING btree ("autosave");
  CREATE INDEX "_privacy_v_version_version__status_idx" ON "_privacy_v" USING btree ("version__status");
  CREATE INDEX "_privacy_v_created_at_idx" ON "_privacy_v" USING btree ("created_at");
  CREATE INDEX "_privacy_v_updated_at_idx" ON "_privacy_v" USING btree ("updated_at");
  CREATE INDEX "_privacy_v_latest_idx" ON "_privacy_v" USING btree ("latest");
  CREATE INDEX "_privacy_v_autosave_idx" ON "_privacy_v" USING btree ("autosave");
  CREATE INDEX "contact__status_idx" ON "contact" USING btree ("_status");
  CREATE INDEX "privacy__status_idx" ON "privacy" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_contact_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_privacy_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_contact_v" CASCADE;
  DROP TABLE "_privacy_v" CASCADE;
  DROP INDEX "contact__status_idx";
  DROP INDEX "privacy__status_idx";
  ALTER TABLE "contact" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "contact" ALTER COLUMN "description" SET NOT NULL;
  ALTER TABLE "privacy" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "contact" DROP COLUMN "_status";
  ALTER TABLE "privacy" DROP COLUMN "_status";
  DROP TYPE "public"."enum_contact_status";
  DROP TYPE "public"."enum__contact_v_version_status";
  DROP TYPE "public"."enum_privacy_status";
  DROP TYPE "public"."enum__privacy_v_version_status";`)
}
