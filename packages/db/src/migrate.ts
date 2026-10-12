import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { fileURLToPath } from "node:url";
import type { Db } from "./client.js";

export function migrateDb(db: Db) {
  const migrationsFolder = fileURLToPath(new URL("../migrations", import.meta.url));
  migrate(db, { migrationsFolder });
}
