import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createDb, migrateDb } from "@conduit/db";
import { createApp } from "./app.js";

const defaultDatabasePath = fileURLToPath(new URL("../../../data/conduit.sqlite", import.meta.url));

export function databasePath(): string {
  return process.env.DATABASE_PATH ?? defaultDatabasePath;
}

export function openDatabase() {
  const path = databasePath();
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = createDb(path);
  migrateDb(db);
  return db;
}

const isProduction = process.env.NODE_ENV === "production";
const staticRoot = isProduction ? fileURLToPath(new URL("../../web/dist", import.meta.url)) : undefined;
const db = openDatabase();
const app = createApp(db);

if (staticRoot) {
  app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api")) return next();
    return serveStatic({ root: staticRoot })(c, next);
  });
  app.get("*", async (c, next) => {
    if (c.req.path.startsWith("/api")) return next();
    return serveStatic({ root: staticRoot, path: "index.html" })(c, next);
  });
}

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`API listening on http://127.0.0.1:${info.port}`);
});
