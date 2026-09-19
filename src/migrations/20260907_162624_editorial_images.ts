import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "manometers_image_id" integer;
  ALTER TABLE "home" ADD COLUMN "accessories_image_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_manometers_image_id" integer;
  ALTER TABLE "_home_v" ADD COLUMN "version_accessories_image_id" integer;
  ALTER TABLE "home" ADD CONSTRAINT "home_manometers_image_id_media_id_fk" FOREIGN KEY ("manometers_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_accessories_image_id_media_id_fk" FOREIGN KEY ("accessories_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_manometers_image_id_media_id_fk" FOREIGN KEY ("version_manometers_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_accessories_image_id_media_id_fk" FOREIGN KEY ("version_accessories_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "home_manometers_image_idx" ON "home" USING btree ("manometers_image_id");
  CREATE INDEX "home_accessories_image_idx" ON "home" USING btree ("accessories_image_id");
  CREATE INDEX "_home_v_version_version_manometers_image_idx" ON "_home_v" USING btree ("version_manometers_image_id");
  CREATE INDEX "_home_v_version_version_accessories_image_idx" ON "_home_v" USING btree ("version_accessories_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP CONSTRAINT "home_manometers_image_id_media_id_fk";
  
  ALTER TABLE "home" DROP CONSTRAINT "home_accessories_image_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_manometers_image_id_media_id_fk";
  
  ALTER TABLE "_home_v" DROP CONSTRAINT "_home_v_version_accessories_image_id_media_id_fk";
  
  DROP INDEX "home_manometers_image_idx";
  DROP INDEX "home_accessories_image_idx";
  DROP INDEX "_home_v_version_version_manometers_image_idx";
  DROP INDEX "_home_v_version_version_accessories_image_idx";
  ALTER TABLE "home" DROP COLUMN "manometers_image_id";
  ALTER TABLE "home" DROP COLUMN "accessories_image_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_manometers_image_id";
  ALTER TABLE "_home_v" DROP COLUMN "version_accessories_image_id";`)
}
