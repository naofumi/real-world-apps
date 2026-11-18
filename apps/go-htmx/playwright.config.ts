import { join } from "node:path";
import { defineConfig } from "@playwright/test";

const databasePath = join(process.cwd(), "storage/e2e.sqlite3");
const port = "8091";
const quotedDb = JSON.stringify(databasePath);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: [
      `rm -f ${quotedDb} ${quotedDb}-wal ${quotedDb}-shm`,
      `APP_DATABASE_PATH=${quotedDb} go run ./cmd/seed`,
      `APP_DATABASE_PATH=${quotedDb} APP_ADDR=127.0.0.1:${port} go run ./cmd/server`,
    ].join(" && "),
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
