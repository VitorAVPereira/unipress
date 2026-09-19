import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_status" AS ENUM('pending', 'active', 'inactive');
  CREATE TYPE "public"."enum_clients_invite_delivery_status" AS ENUM('pending', 'sent', 'failed', 'accepted');
  CREATE TABLE "clients_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"cnpj" varchar NOT NULL,
  	"status" "enum_clients_status" DEFAULT 'pending' NOT NULL,
  	"invite_delivery_status" "enum_clients_invite_delivery_status" DEFAULT 'pending',
  	"invite_sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "calibrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" integer NOT NULL,
  	"calibration_date" timestamp(3) with time zone NOT NULL,
  	"certificate_number" varchar NOT NULL,
  	"tag" varchar NOT NULL,
  	"year_mismatch_confirmed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
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
  
  CREATE TABLE "audit_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"actor_id" integer,
  	"action" varchar NOT NULL,
  	"entity_type" varchar NOT NULL,
  	"entity_reference" varchar NOT NULL,
  	"details" jsonb,
  	"occurred_at" timestamp(3) with time zone NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "calibrations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_events_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "clients_sessions" ADD CONSTRAINT "clients_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "clients_sessions_order_idx" ON "clients_sessions" USING btree ("_order");
  CREATE INDEX "clients_sessions_parent_id_idx" ON "clients_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "clients_cnpj_idx" ON "clients" USING btree ("cnpj");
  CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
  CREATE UNIQUE INDEX "clients_email_idx" ON "clients" USING btree ("email");
  CREATE INDEX "calibrations_client_idx" ON "calibrations" USING btree ("client_id");
  CREATE INDEX "calibrations_calibration_date_idx" ON "calibrations" USING btree ("calibration_date");
  CREATE UNIQUE INDEX "calibrations_certificate_number_idx" ON "calibrations" USING btree ("certificate_number");
  CREATE INDEX "calibrations_tag_idx" ON "calibrations" USING btree ("tag");
  CREATE INDEX "calibrations_updated_at_idx" ON "calibrations" USING btree ("updated_at");
  CREATE INDEX "calibrations_created_at_idx" ON "calibrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "calibrations_filename_idx" ON "calibrations" USING btree ("filename");
  CREATE INDEX "audit_events_actor_idx" ON "audit_events" USING btree ("actor_id");
  CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_calibrations_fk" FOREIGN KEY ("calibrations_id") REFERENCES "public"."calibrations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_events_fk" FOREIGN KEY ("audit_events_id") REFERENCES "public"."audit_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");
  CREATE INDEX "payload_locked_documents_rels_calibrations_id_idx" ON "payload_locked_documents_rels" USING btree ("calibrations_id");
  CREATE INDEX "payload_locked_documents_rels_audit_events_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_events_id");
  CREATE INDEX "payload_preferences_rels_clients_id_idx" ON "payload_preferences_rels" USING btree ("clients_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clients_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "calibrations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "clients_sessions" CASCADE;
  DROP TABLE "clients" CASCADE;
  DROP TABLE "calibrations" CASCADE;
  DROP TABLE "audit_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_clients_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_calibrations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_events_fk";
  
  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_clients_fk";
  
  DROP INDEX "payload_locked_documents_rels_clients_id_idx";
  DROP INDEX "payload_locked_documents_rels_calibrations_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_events_id_idx";
  DROP INDEX "payload_preferences_rels_clients_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clients_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "calibrations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_events_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "clients_id";
  DROP TYPE "public"."enum_clients_status";
  DROP TYPE "public"."enum_clients_invite_delivery_status";`)
}
