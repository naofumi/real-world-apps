import type { Context } from "hono";
import type { Account } from "../modules/identity/service.js";
import type { Db } from "@conduit/db";
import { AppError } from "../shared/errors.js";

export type AppEnv = {
  Variables: {
    db: Db;
    jwtSecret: string;
    viewer: Account | null;
  };
};

export function requireViewer(c: Context<AppEnv>): Account {
  if (!c.req.header("Authorization")) {
    throw new AppError("unauthorized", { token: ["is missing"] });
  }
  const viewer = c.get("viewer");
  if (!viewer) throw new AppError("unauthorized", { token: ["is invalid"] });
  return viewer;
}

export function viewerId(c: Context<AppEnv>): number | null {
  return c.get("viewer")?.id ?? null;
}
