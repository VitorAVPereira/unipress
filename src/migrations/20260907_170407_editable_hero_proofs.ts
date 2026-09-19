import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" ADD COLUMN "hero_proof_one" varchar DEFAULT 'Atendimento nacional';
  ALTER TABLE "home" ADD COLUMN "hero_proof_two" varchar DEFAULT 'Consulta técnica';
  ALTER TABLE "home" ADD COLUMN "hero_proof_three" varchar DEFAULT 'Sem venda online';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_proof_one" varchar DEFAULT 'Atendimento nacional';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_proof_two" varchar DEFAULT 'Consulta técnica';
  ALTER TABLE "_home_v" ADD COLUMN "version_hero_proof_three" varchar DEFAULT 'Sem venda online';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "home" DROP COLUMN "hero_proof_one";
  ALTER TABLE "home" DROP COLUMN "hero_proof_two";
  ALTER TABLE "home" DROP COLUMN "hero_proof_three";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_proof_one";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_proof_two";
  ALTER TABLE "_home_v" DROP COLUMN "version_hero_proof_three";`)
}
