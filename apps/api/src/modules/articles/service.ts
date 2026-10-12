import { articleTags, articles, favorites, tags, type Db } from "@conduit/db";
import { and, eq, notExists, sql } from "drizzle-orm";
import { AppError } from "../../shared/errors.js";
import { nextIso, nowIso } from "../../shared/clock.js";
import { findArticleRef, getArticle } from "./queries.js";
import { slugify } from "./slug.js";

type ArticleInput = {
  title: string;
  description: string;
  body: string;
  tagList: string[];
};

type ArticleUpdate = {
  title?: string;
  description?: string;
  body?: string;
  tagList?: string[];
};

function uniqueSlug(db: Db, title: string, excludeId?: number): string {
  const base = slugify(title);
  let candidate = base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const existing = db.select({ id: articles.id }).from(articles).where(eq(articles.slug, candidate)).get();
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${suffix}`;
  }
  throw new Error("Could not allocate a unique slug");
}

function replaceTags(db: Db, articleId: number, names: string[]) {
  const links: { articleId: number; tagId: number; position: number }[] = [];
  names.forEach((name, position) => {
    db.insert(tags).values({ name }).onConflictDoNothing({ target: tags.name }).run();
    const tag = db.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).get();
    if (!tag) throw new Error("Tag insert did not persist");
    links.push({ articleId, tagId: tag.id, position });
  });
  db.delete(articleTags).where(eq(articleTags.articleId, articleId)).run();
  if (links.length > 0) db.insert(articleTags).values(links).run();
  deleteUnusedTags(db);
}

function deleteUnusedTags(db: Db) {
  db.delete(tags)
    .where(
      notExists(
        db.select({ one: sql`1` }).from(articleTags).where(eq(articleTags.tagId, tags.id)),
      ),
    )
    .run();
}

function requireArticle(db: Db, slug: string) {
  const article = db.select().from(articles).where(eq(articles.slug, slug)).get();
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  return article;
}

export function createArticle(db: Db, authorId: number, input: ArticleInput) {
  const slug = db.transaction((tx) => {
    const connection = tx as unknown as Db;
    const allocated = uniqueSlug(connection, input.title);
    const timestamp = nowIso();
    const row = connection
      .insert(articles)
      .values({
        authorId,
        slug: allocated,
        title: input.title,
        description: input.description,
        body: input.body,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()
      .get();
    if (!row) throw new Error("Failed to insert article");
    replaceTags(connection, row.id, input.tagList);
    return allocated;
  });
  return getArticle(db, slug, authorId);
}

export function updateArticle(db: Db, slug: string, userId: number, input: ArticleUpdate) {
  const current = requireArticle(db, slug);
  if (current.authorId !== userId) throw new AppError("forbidden", { article: ["forbidden"] });

  const nextSlug = db.transaction((tx) => {
    const connection = tx as unknown as Db;
    const allocated = input.title && input.title !== current.title ? uniqueSlug(connection, input.title, current.id) : current.slug;
    connection
      .update(articles)
      .set({
        slug: allocated,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        body: input.body ?? current.body,
        updatedAt: nextIso(current.updatedAt),
      })
      .where(eq(articles.id, current.id))
      .run();
    if (input.tagList !== undefined) replaceTags(connection, current.id, input.tagList);
    return allocated;
  });
  return getArticle(db, nextSlug, userId);
}

export function removeArticle(db: Db, slug: string, userId: number) {
  const current = requireArticle(db, slug);
  if (current.authorId !== userId) throw new AppError("forbidden", { article: ["forbidden"] });
  db.transaction((tx) => {
    const connection = tx as unknown as Db;
    connection.delete(articles).where(eq(articles.id, current.id)).run();
    deleteUnusedTags(connection);
  });
}

export function favoriteArticle(db: Db, userId: number, slug: string) {
  const article = findArticleRef(db, slug);
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  db.insert(favorites)
    .values({ userId, articleId: article.id, createdAt: nowIso() })
    .onConflictDoNothing()
    .run();
  return getArticle(db, slug, userId);
}

export function unfavoriteArticle(db: Db, userId: number, slug: string) {
  const article = findArticleRef(db, slug);
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  db.delete(favorites)
    .where(and(eq(favorites.articleId, article.id), eq(favorites.userId, userId)))
    .run();
  return getArticle(db, slug, userId);
}
