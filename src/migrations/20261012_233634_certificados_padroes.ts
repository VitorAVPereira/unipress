import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reference_certificates_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reference_certificates_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "reference_standards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL,
  	"search_key" varchar NOT NULL,
  	"visible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reference_certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"standard_id" integer,
  	"year" numeric,
  	"is_current" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_reference_certificates_status" DEFAULT 'draft',
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "_reference_certificates_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_standard_id" integer,
  	"version_year" numeric,
  	"version_is_current" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__reference_certificates_v_version_status" DEFAULT 'draft',
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reference_standards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reference_certificates_id" integer;
  ALTER TABLE "reference_certificates" ADD CONSTRAINT "reference_certificates_standard_id_reference_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."reference_standards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reference_certificates_v" ADD CONSTRAINT "_reference_certificates_v_parent_id_reference_certificates_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reference_certificates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reference_certificates_v" ADD CONSTRAINT "_reference_certificates_v_version_standard_id_reference_standards_id_fk" FOREIGN KEY ("version_standard_id") REFERENCES "public"."reference_standards"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "reference_standards_tag_idx" ON "reference_standards" USING btree ("tag");
  CREATE UNIQUE INDEX "reference_standards_search_key_idx" ON "reference_standards" USING btree ("search_key");
  CREATE INDEX "reference_standards_visible_idx" ON "reference_standards" USING btree ("visible");
  CREATE INDEX "reference_standards_updated_at_idx" ON "reference_standards" USING btree ("updated_at");
  CREATE INDEX "reference_standards_created_at_idx" ON "reference_standards" USING btree ("created_at");
  CREATE INDEX "reference_certificates_standard_idx" ON "reference_certificates" USING btree ("standard_id");
  CREATE INDEX "reference_certificates_year_idx" ON "reference_certificates" USING btree ("year");
  CREATE INDEX "reference_certificates_is_current_idx" ON "reference_certificates" USING btree ("is_current");
  CREATE UNIQUE INDEX "reference_certificates_one_published_current_per_standard_idx"
    ON "reference_certificates" USING btree ("standard_id")
    WHERE "is_current" = true AND "_status" = 'published';
  CREATE INDEX "reference_certificates_updated_at_idx" ON "reference_certificates" USING btree ("updated_at");
  CREATE INDEX "reference_certificates_created_at_idx" ON "reference_certificates" USING btree ("created_at");
  CREATE INDEX "reference_certificates__status_idx" ON "reference_certificates" USING btree ("_status");
  CREATE UNIQUE INDEX "reference_certificates_filename_idx" ON "reference_certificates" USING btree ("filename");
  CREATE INDEX "_reference_certificates_v_parent_idx" ON "_reference_certificates_v" USING btree ("parent_id");
  CREATE INDEX "_reference_certificates_v_version_version_standard_idx" ON "_reference_certificates_v" USING btree ("version_standard_id");
  CREATE INDEX "_reference_certificates_v_version_version_year_idx" ON "_reference_certificates_v" USING btree ("version_year");
  CREATE INDEX "_reference_certificates_v_version_version_is_current_idx" ON "_reference_certificates_v" USING btree ("version_is_current");
  CREATE INDEX "_reference_certificates_v_version_version_updated_at_idx" ON "_reference_certificates_v" USING btree ("version_updated_at");
  CREATE INDEX "_reference_certificates_v_version_version_created_at_idx" ON "_reference_certificates_v" USING btree ("version_created_at");
  CREATE INDEX "_reference_certificates_v_version_version__status_idx" ON "_reference_certificates_v" USING btree ("version__status");
  CREATE INDEX "_reference_certificates_v_version_version_filename_idx" ON "_reference_certificates_v" USING btree ("version_filename");
  CREATE INDEX "_reference_certificates_v_created_at_idx" ON "_reference_certificates_v" USING btree ("created_at");
  CREATE INDEX "_reference_certificates_v_updated_at_idx" ON "_reference_certificates_v" USING btree ("updated_at");
  CREATE INDEX "_reference_certificates_v_latest_idx" ON "_reference_certificates_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reference_standards_fk" FOREIGN KEY ("reference_standards_id") REFERENCES "public"."reference_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reference_certificates_fk" FOREIGN KEY ("reference_certificates_id") REFERENCES "public"."reference_certificates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reference_standards_id_idx" ON "payload_locked_documents_rels" USING btree ("reference_standards_id");
  CREATE INDEX "payload_locked_documents_rels_reference_certificates_id_idx" ON "payload_locked_documents_rels" USING btree ("reference_certificates_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "reference_certificates_one_published_current_per_standard_idx";
  ALTER TABLE "reference_standards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reference_certificates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reference_certificates_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reference_standards" CASCADE;
  DROP TABLE "reference_certificates" CASCADE;
  DROP TABLE "_reference_certificates_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reference_standards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reference_certificates_fk";
  
  DROP INDEX "payload_locked_documents_rels_reference_standards_id_idx";
  DROP INDEX "payload_locked_documents_rels_reference_certificates_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reference_standards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reference_certificates_id";
  DROP TYPE "public"."enum_reference_certificates_status";
  DROP TYPE "public"."enum__reference_certificates_v_version_status";`)
}
