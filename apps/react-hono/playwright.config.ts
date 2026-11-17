import { join } from "node:path";
import { defineConfig } from "@playwright/test";

const databasePath = join(process.cwd(), "data/e2e.sqlite");
const apiPort = "8797";
const webPort = "4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${webPort}` },
  webServer: [
    {
      command: `rm -f "${databasePath}" "${databasePath}-wal" "${databasePath}-shm" && DATABASE_PATH="${databasePath}" npm run seed -w @conduit/api && DATABASE_PATH="${databasePath}" PORT=${apiPort} npm run dev -w @conduit/api`,
      url: `http://127.0.0.1:${apiPort}/api/tags`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `API_PROXY_TARGET=http://127.0.0.1:${apiPort} WEB_PORT=${webPort} npm run dev -w @conduit/web`,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
