import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" RENAME COLUMN "logo_id" TO "header_logo_id";
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_logo_id_media_id_fk";
  
  DROP INDEX "site_settings_logo_idx";
  ALTER TABLE "site_settings" ADD COLUMN "footer_logo_id" integer;
  UPDATE "site_settings" SET "footer_logo_id" = "header_logo_id" WHERE "footer_logo_id" IS NULL;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_header_logo_id_media_id_fk" FOREIGN KEY ("header_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_footer_logo_id_media_id_fk" FOREIGN KEY ("footer_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_header_logo_idx" ON "site_settings" USING btree ("header_logo_id");
  CREATE INDEX "site_settings_footer_logo_idx" ON "site_settings" USING btree ("footer_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "site_settings" SET "header_logo_id" = COALESCE("header_logo_id", "footer_logo_id");
  ALTER TABLE "site_settings" RENAME COLUMN "header_logo_id" TO "logo_id";
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_header_logo_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_footer_logo_id_media_id_fk";
  
  DROP INDEX "site_settings_header_logo_idx";
  DROP INDEX "site_settings_footer_logo_idx";
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  ALTER TABLE "site_settings" DROP COLUMN "footer_logo_id";`)
}
