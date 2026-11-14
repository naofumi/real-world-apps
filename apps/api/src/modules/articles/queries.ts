import type { Article, ArticleCard } from "@conduit/contracts";
import { articleTags, articles, favorites, follows, tags, users, type Db } from "@conduit/db";
import { alias } from "drizzle-orm/sqlite-core";
import { and, asc, desc, eq, exists, inArray, sql, type SQL } from "drizzle-orm";
import { followingSql } from "../../shared/author-sql.js";
import { AppError } from "../../shared/errors.js";
import { articlePermissions, profilePermissions } from "../../shared/permissions.js";

export type ArticleRef = {
  id: number;
  authorId: number;
  slug: string;
};

type ArticleRow = {
  id: number;
  authorId: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  favoritesCount: number;
  favorited: number;
  authorUsername: string;
  authorBio: string | null;
  authorImage: string | null;
  following: number;
};

export type ArticleListQuery = {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
  feedUserId?: number;
};

function favoritedSql(viewerId: number | null) {
  if (viewerId == null) return sql<number>`0`;
  return sql<number>`exists (select 1 from ${favorites} where ${favorites.articleId} = ${articles.id} and ${favorites.userId} = ${viewerId})`;
}

function articleQuery(db: Db, viewerId: number | null) {
  return db
    .select({
      id: articles.id,
      authorId: articles.authorId,
      slug: articles.slug,
      title: articles.title,
      description: articles.description,
      body: articles.body,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      favoritesCount: sql<number>`(select count(*) from ${favorites} where ${favorites.articleId} = ${articles.id})`,
      favorited: favoritedSql(viewerId),
      authorUsername: users.username,
      authorBio: users.bio,
      authorImage: users.image,
      following: followingSql(viewerId),
    })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId));
}

function filtersFor(db: Db, query: ArticleListQuery): SQL[] {
  const filters: SQL[] = [];
  if (query.tag) {
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(articleTags)
          .innerJoin(tags, eq(tags.id, articleTags.tagId))
          .where(and(eq(articleTags.articleId, articles.id), eq(tags.name, query.tag))),
      ),
    );
  }
  if (query.author) filters.push(eq(users.username, query.author));
  if (query.favorited) {
    const favoriter = alias(users, "favoriter");
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(favorites)
          .innerJoin(favoriter, eq(favoriter.id, favorites.userId))
          .where(and(eq(favorites.articleId, articles.id), eq(favoriter.username, query.favorited))),
      ),
    );
  }
  if (query.feedUserId != null) {
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(follows)
          .where(and(eq(follows.followerId, query.feedUserId), eq(follows.followedId, articles.authorId))),
      ),
    );
  }
  return filters;
}

function tagsByArticle(db: Db, ids: number[]): Map<number, string[]> {
  const grouped = new Map<number, string[]>();
  if (ids.length === 0) return grouped;
  const rows = db
    .select({ articleId: articleTags.articleId, name: tags.name })
    .from(articleTags)
    .innerJoin(tags, eq(tags.id, articleTags.tagId))
    .where(inArray(articleTags.articleId, ids))
    .orderBy(asc(articleTags.position))
    .all();
  for (const row of rows) {
    const list = grouped.get(row.articleId) ?? [];
    list.push(row.name);
    grouped.set(row.articleId, list);
  }
  return grouped;
}

function present(row: ArticleRow, tagList: string[], viewerId: number | null, includeBody: true): Article;
function present(row: ArticleRow, tagList: string[], viewerId: number | null, includeBody: false): ArticleCard;
function present(
  row: ArticleRow,
  tagList: string[],
  viewerId: number | null,
  includeBody: boolean,
): Article | ArticleCard {
  const card = {
    slug: row.slug,
    title: row.title,
    description: row.description,
    tagList,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    favorited: Number(row.favorited) === 1,
    favoritesCount: Number(row.favoritesCount),
    author: {
      username: row.authorUsername,
      bio: row.authorBio,
      image: row.authorImage,
      following: Number(row.following) === 1,
      permissions: profilePermissions(viewerId, row.authorId),
    },
    permissions: articlePermissions(viewerId, row.authorId),
  };
  if (!includeBody) return card;
  return { ...card, body: row.body };
}

export function listArticles(db: Db, query: ArticleListQuery, viewerId: number | null) {
  const filters = filtersFor(db, query);
  const where = filters.length > 0 ? and(...filters) : undefined;
  const selected = articleQuery(db, viewerId);
  const filtered = where ? selected.where(where) : selected;
  const rows = filtered
    .orderBy(desc(articles.createdAt), desc(articles.id))
    .limit(query.limit)
    .offset(query.offset)
    .all();
  const counted = db
    .select({ total: sql<number>`count(*)` })
    .from(articles)
    .innerJoin(users, eq(users.id, articles.authorId));
  const totalRow = (where ? counted.where(where) : counted).get();
  const tagsForRows = tagsByArticle(db, rows.map((row) => row.id));
  return {
    articles: rows.map((row) => present(row, tagsForRows.get(row.id) ?? [], viewerId, false)),
    articlesCount: Number(totalRow?.total ?? 0),
  };
}

export function getArticle(db: Db, slug: string, viewerId: number | null): Article {
  const row = articleQuery(db, viewerId).where(eq(articles.slug, slug)).get();
  if (!row) throw new AppError("not_found", { article: ["not found"] });
  const tagList = tagsByArticle(db, [row.id]).get(row.id) ?? [];
  return present(row, tagList, viewerId, true);
}

export function findArticleRef(db: Db, slug: string): ArticleRef | null {
  return db
    .select({ id: articles.id, authorId: articles.authorId, slug: articles.slug })
    .from(articles)
    .where(eq(articles.slug, slug))
    .get() ?? null;
}

export function listTagNames(db: Db): string[] {
  return db
    .select({ name: tags.name })
    .from(tags)
    .innerJoin(articleTags, eq(articleTags.tagId, tags.id))
    .groupBy(tags.name)
    .orderBy(asc(tags.name))
    .all()
    .map((row) => row.name);
}
