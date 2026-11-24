import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Older migrations ran without the Blob adapter enabled, so they omitted
  // this optional storage field. Preserve existing records and file locations.
  await db.execute(sql`ALTER TABLE "calibrations" ADD COLUMN IF NOT EXISTS "prefix" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "calibrations" DROP COLUMN IF EXISTS "prefix";`)
}
