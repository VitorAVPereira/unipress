import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Snapshot-only migration.
 *
 * The reference certificate tables are already created by
 * 20261012_233634_certificados_padroes. This migration intentionally emits no
 * SQL and only advances Payload's stored schema snapshot so future migrations
 * see both the reference-certificate schema and the catalog changes.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {}

export async function down(_args: MigrateDownArgs): Promise<void> {}
