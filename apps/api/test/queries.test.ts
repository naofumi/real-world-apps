import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  articleTags,
  articles,
  comments,
  createDb,
  favorites,
  follows,
  migrateDb,
  tags,
  users,
  type Db,
} from "@conduit/db";
import { eq, sql } from "drizzle-orm";
import { favoriteArticle, removeArticle, updateArticle } from "../src/modules/articles/service.js";
import { getArticle, listArticles, listTagNames } from "../src/modules/articles/queries.js";
import { listComments } from "../src/modules/comments/service.js";

const db = createDb(":memory:");
migrateDb(db);

class Rollback extends Error {}

function countUsers(database: Db): number {
  const row = database.select({ total: sql<number>`count(*)` }).from(users).get();
  return Number(row?.total ?? 0);
}

function withTx(run: (tx: Db) => void) {
  assert.equal(countUsers(db), 0);
  try {
    db.transaction((tx) => {
      run(tx as unknown as Db);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
  assert.equal(countUsers(db), 0);
}

function insertUser(tx: Db, id: number, username: string) {
  tx.insert(users)
    .values({
      id,
      email: `${username}@test.com`,
      username,
      passwordHash: "unused",
      bio: null,
      image: null,
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    })
    .run();
}

function insertArticle(
  tx: Db,
  row: { id: number; authorId: number; slug: string; title: string; createdAt: string },
) {
  tx.insert(articles)
    .values({
      id: row.id,
      authorId: row.authorId,
      slug: row.slug,
      title: row.title,
      description: "d",
      body: "b",
      createdAt: row.createdAt,
      updatedAt: row.createdAt,
    })
    .run();
}

function insertTag(tx: Db, articleId: number, name: string, position: number) {
  tx.insert(tags).values({ name }).onConflictDoNothing({ target: tags.name }).run();
  const tag = tx.select({ id: tags.id }).from(tags).where(eq(tags.name, name)).get();
  if (!tag) throw new Error(`missing tag ${name}`);
  tx.insert(articleTags).values({ articleId, tagId: tag.id, position }).run();
}

function seed(tx: Db) {
  insertUser(tx, 1, "author");
  insertUser(tx, 2, "fan");
  insertUser(tx, 3, "stranger");
  insertArticle(tx, { id: 10, authorId: 1, slug: "tagged", title: "Tagged", createdAt: "2020-01-02T00:00:00.000Z" });
  insertArticle(tx, { id: 11, authorId: 1, slug: "plain", title: "Plain", createdAt: "2020-01-02T00:00:00.000Z" });
  insertArticle(tx, { id: 12, authorId: 3, slug: "own", title: "Own", createdAt: "2020-01-03T00:00:00.000Z" });
  insertTag(tx, 10, "zeta", 0);
  insertTag(tx, 10, "alpha", 1);
  insertTag(tx, 10, "shared", 2);
  insertTag(tx, 12, "shared", 0);
  tx.insert(favorites).values({ userId: 2, articleId: 10, createdAt: "2020-01-02T00:00:00.000Z" }).run();
  tx.insert(follows).values({ followerId: 3, followedId: 1, createdAt: "2020-01-02T00:00:00.000Z" }).run();
  tx.insert(comments)
    .values([
      {
        id: 1,
        articleId: 10,
        authorId: 1,
        body: "later",
        createdAt: "2020-01-04T00:00:00.000Z",
        updatedAt: "2020-01-04T00:00:00.000Z",
      },
      {
        id: 2,
        articleId: 10,
        authorId: 2,
        body: "earlier",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
    ])
    .run();
}

const page = { limit: 10, offset: 0 };

describe("article queries", { concurrency: 1 }, () => {
  test("counts every favorite and marks only the viewer", () => {
    withTx((tx) => {
      seed(tx);
      const asStranger = listArticles(tx, page, 3).articles.find((article) => article.slug === "tagged");
      const asFan = listArticles(tx, page, 2).articles.find((article) => article.slug === "tagged");
      const asAnonymous = listArticles(tx, page, null).articles.find((article) => article.slug === "tagged");
      assert.equal(asStranger?.favoritesCount, 1);
      assert.equal(asStranger?.favorited, false);
      assert.equal(asFan?.favoritesCount, 1);
      assert.equal(asFan?.favorited, true);
      assert.equal(asAnonymous?.favoritesCount, 1);
      assert.equal(asAnonymous?.favorited, false);
    });
  });

  test("following belongs to the viewer and the author", () => {
    withTx((tx) => {
      seed(tx);
      const cards = listArticles(tx, page, 3).articles;
      assert.equal(cards.find((article) => article.slug === "tagged")?.author.following, true);
      assert.equal(cards.find((article) => article.slug === "own")?.author.following, false);
      assert.equal(listArticles(tx, page, null).articles.every((article) => article.author.following === false), true);

      const detail = getArticle(tx, "tagged", 3);
      assert.equal(detail.author.following, true);

      const thread = listComments(tx, "tagged", 3);
      assert.deepEqual(
        thread.map((comment) => comment.author.username),
        ["fan", "author"],
      );
      assert.equal(thread[0]?.author.following, false);
      assert.equal(thread[1]?.author.following, true);
    });
  });

  test("filters by the fan, the author, and the tag together", () => {
    withTx((tx) => {
      seed(tx);
      const byFan = listArticles(tx, { ...page, favorited: "fan" }, null);
      assert.deepEqual(byFan.articles.map((article) => article.slug), ["tagged"]);
      const byFanAsAuthor = listArticles(tx, { ...page, author: "fan" }, null);
      assert.equal(byFanAsAuthor.articlesCount, 0);
      const combined = listArticles(tx, { ...page, author: "author", tag: "zeta", favorited: "fan" }, 3);
      assert.equal(combined.articlesCount, 1);
      assert.deepEqual(combined.articles.map((article) => article.slug), ["tagged"]);
    });
  });

  test("keeps tag order per article without multiplying rows", () => {
    withTx((tx) => {
      seed(tx);
      const listed = listArticles(tx, { ...page, tag: "zeta" }, null);
      assert.equal(listed.articlesCount, 1);
      assert.equal(listed.articles.length, 1);
      assert.deepEqual(listed.articles[0]?.tagList, ["zeta", "alpha", "shared"]);
      const detail = getArticle(tx, "tagged", null);
      assert.deepEqual(detail.tagList, ["zeta", "alpha", "shared"]);
      const plain = listArticles(tx, { ...page, author: "author" }, null).articles.find((article) => article.slug === "plain");
      assert.deepEqual(plain?.tagList, []);
    });
  });

  test("orders equal timestamps by id and hides the viewer's own articles from the feed", () => {
    withTx((tx) => {
      seed(tx);
      const global = listArticles(tx, page, 3);
      assert.deepEqual(global.articles.map((article) => article.slug), ["own", "plain", "tagged"]);
      const feed = listArticles(tx, { ...page, feedUserId: 3 }, 3);
      assert.equal(feed.articlesCount, 2);
      assert.deepEqual(feed.articles.map((article) => article.slug), ["plain", "tagged"]);
    });
  });

  test("lists each tag once, alphabetically", () => {
    withTx((tx) => {
      seed(tx);
      assert.deepEqual(listTagNames(tx), ["alpha", "shared", "zeta"]);
    });
  });
});

describe("article writes", { concurrency: 1 }, () => {
  test("a second favorite does not add a row", () => {
    withTx((tx) => {
      insertUser(tx, 1, "author");
      insertArticle(tx, { id: 10, authorId: 1, slug: "tagged", title: "Tagged", createdAt: "2020-01-02T00:00:00.000Z" });
      favoriteArticle(tx, 1, "tagged");
      favoriteArticle(tx, 1, "tagged");
      const row = tx.select({ total: sql<number>`count(*)` }).from(favorites).get();
      assert.equal(Number(row?.total ?? 0), 1);
    });
  });

  test("retitling onto a taken slug keeps the other article's slug", () => {
    withTx((tx) => {
      insertUser(tx, 1, "author");
      insertArticle(tx, { id: 10, authorId: 1, slug: "tagged", title: "Tagged", createdAt: "2020-01-02T00:00:00.000Z" });
      insertArticle(tx, { id: 11, authorId: 1, slug: "plain", title: "Plain", createdAt: "2020-01-02T00:00:00.000Z" });
      updateArticle(tx, "plain", 1, { title: "Tagged" });
      const rows = tx.select({ id: articles.id, slug: articles.slug }).from(articles).all();
      assert.equal(rows.find((row) => row.id === 10)?.slug, "tagged");
      assert.equal(rows.find((row) => row.id === 11)?.slug, "tagged-2");
    });
  });

  test("deleting an article keeps a tag that another article still uses", () => {
    withTx((tx) => {
      insertUser(tx, 1, "author");
      insertUser(tx, 3, "stranger");
      insertArticle(tx, { id: 10, authorId: 1, slug: "tagged", title: "Tagged", createdAt: "2020-01-02T00:00:00.000Z" });
      insertArticle(tx, { id: 12, authorId: 3, slug: "own", title: "Own", createdAt: "2020-01-03T00:00:00.000Z" });
      insertTag(tx, 10, "shared", 0);
      insertTag(tx, 12, "shared", 0);
      insertTag(tx, 12, "only-own", 1);
      removeArticle(tx, "own", 3);
      const remainingTags = tx.select({ name: tags.name }).from(tags).all().map((row) => row.name);
      const remainingLinks = tx.select({ articleId: articleTags.articleId }).from(articleTags).all();
      assert.deepEqual(remainingTags, ["shared"]);
      assert.deepEqual(remainingLinks.map((row) => row.articleId), [10]);
    });
  });
});
