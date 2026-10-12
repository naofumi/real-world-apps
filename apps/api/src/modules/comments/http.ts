import { Hono } from "hono";
import { findArticleRef } from "../articles/queries.js";
import type { AppEnv } from "../../http/context.js";
import { requireViewer, viewerId } from "../../http/context.js";
import { parseNewComment } from "../../http/parse.js";
import { AppError } from "../../shared/errors.js";
import { createComment, deleteComment, listComments } from "./service.js";

export function registerCommentRoutes(api: Hono<AppEnv>) {
  api.get("/articles/:slug/comments", (c) => {
    const comments = listComments(c.get("db"), c.req.param("slug"), viewerId(c));
    return c.json({ comments });
  });

  api.post("/articles/:slug/comments", async (c) => {
    const viewer = requireViewer(c);
    const input = await parseNewComment(c);
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
