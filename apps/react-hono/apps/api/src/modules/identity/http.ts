import type { User } from "@conduit/contracts";
import { Hono } from "hono";
import type { AppEnv } from "../../http/context.js";
import { requireViewer } from "../../http/context.js";
import { loginJson, registerJson, updateUserJson } from "../../http/schemas.js";
import { zJson } from "../../http/validate.js";
import type { Account } from "./service.js";
import { authenticate, register, updateAccount } from "./service.js";
import { signToken } from "./token.js";

function presentUser(account: Account, secret: string): User {
  return {
    email: account.email,
    username: account.username,
    bio: account.bio,
    image: account.image,
    token: signToken(account.id, secret),
  };
}

export function registerIdentityRoutes(api: Hono<AppEnv>) {
  api.post("/users", zJson(registerJson), async (c) => {
    const input = c.req.valid("json");
    const account = await register(c.get("db"), input);
    return c.json({ user: presentUser(account, c.get("jwtSecret")) }, 201);
  });

  api.post("/users/login", zJson(loginJson), async (c) => {
    const input = c.req.valid("json");
    const account = await authenticate(c.get("db"), input.email, input.password);
    return c.json({ user: presentUser(account, c.get("jwtSecret")) });
  });

  api.get("/user", (c) => {
    const viewer = requireViewer(c);
    return c.json({ user: presentUser(viewer, c.get("jwtSecret")) });
  });

  api.put("/user", zJson(updateUserJson), async (c) => {
    const viewer = requireViewer(c);
    const input = c.req.valid("json");
    const account = await updateAccount(c.get("db"), viewer.id, input);
    return c.json({ user: presentUser(account, c.get("jwtSecret")) });
  });
}
