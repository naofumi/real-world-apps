import { Hono } from "hono";
import type { AppEnv } from "../../http/context.js";
import { requireViewer, viewerId } from "../../http/context.js";
import { listQuery, newArticleJson, updateArticleJson } from "../../http/schemas.js";
import { zJson, zQuery } from "../../http/validate.js";
import { getArticle, listArticles, listTagNames } from "./queries.js";
import { createArticle, favoriteArticle, removeArticle, unfavoriteArticle, updateArticle } from "./service.js";

export function registerArticleRoutes(api: Hono<AppEnv>) {
  api.get("/articles/feed", zQuery(listQuery), (c) => {
    const viewer = requireViewer(c);
    const query = c.req.valid("query");
    const page = listArticles(c.get("db"), { ...query, feedUserId: viewer.id }, viewer.id);
    return c.json(page);
  });

  api.get("/articles", zQuery(listQuery), (c) => {
    const query = c.req.valid("query");
    const page = listArticles(c.get("db"), query, viewerId(c));
    return c.json(page);
  });

  api.post("/articles", zJson(newArticleJson), (c) => {
    const viewer = requireViewer(c);
    const input = c.req.valid("json");
    const article = createArticle(c.get("db"), viewer.id, input);
    return c.json({ article }, 201);
  });

  api.get("/articles/:slug", (c) => {
    const article = getArticle(c.get("db"), c.req.param("slug"), viewerId(c));
    return c.json({ article });
  });

  api.put("/articles/:slug", zJson(updateArticleJson), (c) => {
    const viewer = requireViewer(c);
    const input = c.req.valid("json");
    const article = updateArticle(c.get("db"), c.req.param("slug"), viewer.id, input);
    return c.json({ article });
  });

  api.delete("/articles/:slug", (c) => {
    const viewer = requireViewer(c);
    removeArticle(c.get("db"), c.req.param("slug"), viewer.id);
    return c.body(null, 204);
  });

  api.post("/articles/:slug/favorite", (c) => {
    const viewer = requireViewer(c);
    const article = favoriteArticle(c.get("db"), viewer.id, c.req.param("slug"));
    return c.json({ article });
  });

  api.delete("/articles/:slug/favorite", (c) => {
    const viewer = requireViewer(c);
    const article = unfavoriteArticle(c.get("db"), viewer.id, c.req.param("slug"));
    return c.json({ article });
  });

  api.get("/tags", (c) => {
    return c.json({ tags: listTagNames(c.get("db")) });
  });
}
