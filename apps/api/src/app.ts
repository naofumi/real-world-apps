import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Db } from "@conduit/db";
import { getAccount } from "./modules/identity/service.js";
import { readUserId } from "./modules/identity/token.js";
import { registerArticleRoutes } from "./modules/articles/http.js";
import { registerCommentRoutes } from "./modules/comments/http.js";
import { registerIdentityRoutes } from "./modules/identity/http.js";
import { registerProfileRoutes } from "./modules/profiles/http.js";
import type { AppEnv } from "./http/context.js";
import { AppError } from "./shared/errors.js";

const DEV_SECRET = "dev-only-change-me";

export type AppOptions = {
  jwtSecret?: string;
};

function accountFromHeader(header: string | undefined, db: Db, secret: string) {
  if (header == null || header === "") return null;
  const match = /^Token (.+)$/.exec(header);
  const token = match?.[1]?.trim();
  if (!token) throw new AppError("unauthorized", { token: ["is invalid"] });
  const userId = readUserId(token, secret);
  if (userId == null) throw new AppError("unauthorized", { token: ["is invalid"] });
  const account = getAccount(db, userId);
  if (!account) throw new AppError("unauthorized", { token: ["is invalid"] });
  return account;
}

export function createApp(db: Db, options: AppOptions = {}) {
  const jwtSecret = options.jwtSecret ?? process.env.JWT_SECRET ?? DEV_SECRET;
  const app = new Hono<AppEnv>();

  app.onError((error, c) => {
    if (error instanceof AppError) return c.json({ errors: error.errors }, error.status);
    if (
      error instanceof HTTPException &&
      error.status === 400 &&
      error.message === "Malformed JSON in request body"
    ) {
      return c.json({ errors: { body: ["is invalid"] } }, 422);
    }
    console.error(error);
    return c.json({ errors: { server: ["internal error"] } }, 500);
  });

  app.use("/api/*", async (c, next) => {
    c.set("db", db);
    c.set("jwtSecret", jwtSecret);
    c.set("viewer", accountFromHeader(c.req.header("Authorization"), db, jwtSecret));
    await next();
    const contentType = c.res.headers.get("content-type");
    if (contentType?.startsWith("application/json") && !contentType.includes("charset")) {
      c.res.headers.set("content-type", "application/json; charset=utf-8");
    }
  });

  const api = new Hono<AppEnv>();
  registerIdentityRoutes(api);
  registerProfileRoutes(api);
  registerArticleRoutes(api);
  registerCommentRoutes(api);
  api.notFound((c) => c.json({ errors: { resource: ["not found"] } }, 404));
  app.route("/api", api);

  return app;
}
