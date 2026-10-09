import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { Client } from "@neondatabase/serverless";

// Applies db/migrations/*.sql in name order, each in its own transaction, and
// records them in private.schema_migrations. Uses the direct (unpooled)
// connection because migrations run multi-statement transactions.
//
//   npm run db:migrate            apply pending migrations
//   npm run db:migrate -- --status list applied and pending migrations

const statusOnly = process.argv.includes("--status");
const connectionString = process.env.NEON_DATABASE_URL_UNPOOLED ?? process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("Set NEON_DATABASE_URL_UNPOOLED (or NEON_DATABASE_URL) in .env.local");

const directory = path.join(process.cwd(), "db", "migrations");
const files = fs.readdirSync(directory).filter((file) => /^\d{4}_[a-z0-9_]+\.sql$/.test(file)).sort();

function checksum(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("create schema if not exists private");
    await client.query(`create table if not exists private.schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )`);
    const { rows } = await client.query<{ name: string; checksum: string }>("select name, checksum from private.schema_migrations");
    const applied = new Map(rows.map((row) => [row.name, row.checksum]));

    for (const file of files) {
      const sql = fs.readFileSync(path.join(directory, file), "utf8");
      const sum = checksum(sql);
      const previous = applied.get(file);
      if (previous) {
        if (previous !== sum) throw new Error(`${file} changed after it was applied. Add a new migration instead.`);
        console.log(`applied  ${file}`);
        continue;
      }
      if (statusOnly) {
        console.log(`pending  ${file}`);
        continue;
      }
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into private.schema_migrations(name, checksum) values ($1, $2)", [file, sum]);
        await client.query("commit");
        console.log(`applied  ${file} (now)`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`${file} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
