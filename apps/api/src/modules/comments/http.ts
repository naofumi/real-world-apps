import { Hono } from "hono";
import type { AppEnv } from "../../http/context.js";
import { requireViewer, viewerId } from "../../http/context.js";
import { newCommentJson } from "../../http/schemas.js";
import { zJson } from "../../http/validate.js";
import { AppError } from "../../shared/errors.js";
import { findArticleRef } from "../articles/queries.js";
import { createComment, deleteComment, listComments } from "./service.js";

export function registerCommentRoutes(api: Hono<AppEnv>) {
  api.get("/articles/:slug/comments", (c) => {
    const comments = listComments(c.get("db"), c.req.param("slug"), viewerId(c));
    return c.json({ comments });
  });

  api.post("/articles/:slug/comments", zJson(newCommentJson), (c) => {
    const viewer = requireViewer(c);
    const input = c.req.valid("json");
    const comment = createComment(c.get("db"), c.req.param("slug"), viewer.id, input.body);
    return c.json({ comment }, 201);
  });

  api.delete("/articles/:slug/comments/:id", (c) => {
    const viewer = requireViewer(c);
    const slug = c.req.param("slug");
    const rawId = c.req.param("id");
    if (!/^\d+$/.test(rawId)) {
      if (!findArticleRef(c.get("db"), slug)) throw new AppError("not_found", { article: ["not found"] });
      throw new AppError("not_found", { comment: ["not found"] });
    }
    deleteComment(c.get("db"), slug, Number(rawId), viewer.id);
    return c.body(null, 204);
  });
}
