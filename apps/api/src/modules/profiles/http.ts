import { Hono } from "hono";
import type { AppEnv } from "../../http/context.js";
import { requireViewer, viewerId } from "../../http/context.js";
import { followUser, getProfile, unfollowUser } from "./service.js";

export function registerProfileRoutes(api: Hono<AppEnv>) {
  api.get("/profiles/:username", (c) => {
    const profile = getProfile(c.get("db"), c.req.param("username"), viewerId(c));
    return c.json({ profile });
  });

  api.post("/profiles/:username/follow", (c) => {
    const viewer = requireViewer(c);
    const profile = followUser(c.get("db"), viewer.id, c.req.param("username"));
    return c.json({ profile });
  });

  api.delete("/profiles/:username/follow", (c) => {
    const viewer = requireViewer(c);
    const profile = unfollowUser(c.get("db"), viewer.id, c.req.param("username"));
    return c.json({ profile });
  });
}
