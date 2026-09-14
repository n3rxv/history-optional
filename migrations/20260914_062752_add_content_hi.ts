import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."notes" ADD COLUMN "content_hi" jsonb;
  ALTER TABLE "payload"."_notes_v" ADD COLUMN "version_content_hi" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."notes" DROP COLUMN "content_hi";
  ALTER TABLE "payload"."_notes_v" DROP COLUMN "version_content_hi";`)
}
