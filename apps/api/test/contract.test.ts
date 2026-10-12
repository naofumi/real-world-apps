import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createDb, migrateDb } from "@conduit/db";
import { createApp } from "../src/app.js";

function setup() {
  const db = createDb(":memory:");
  migrateDb(db);
  const app = createApp(db, { jwtSecret: "test-secret" });
  let token: string | null = null;

  async function call(method: string, path: string, body?: unknown, auth: string | false | undefined = undefined) {
    const headers = new Headers();
    if (body !== undefined) headers.set("content-type", "application/json");
    const bearer = auth === undefined ? token : auth;
    if (bearer) headers.set("authorization", `Token ${bearer}`);
    const response = await app.request(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, json: text ? JSON.parse(text) : null };
  }

  return {
    call,
    token: () => token,
    use(value: string | null) {
      token = value;
    },
  };
}

describe("RealWorld API contract", { concurrency: 1 }, () => {
  test("registers, logs in, and updates the current user", async () => {
    const api = setup();
    const created = await api.call("POST", "/api/users", {
      user: { username: "auth_1", email: "auth_1@test.com", password: "password123" },
    }, false);
    assert.equal(created.status, 201);
    assert.equal(created.json.user.username, "auth_1");
    assert.equal(created.json.user.email, "auth_1@test.com");
    assert.equal(created.json.user.bio, null);
    assert.equal(created.json.user.image, null);
    assert.equal(typeof created.json.user.token, "string");
    api.use(created.json.user.token);

    const loggedIn = await api.call("POST", "/api/users/login", {
      user: { email: "auth_1@test.com", password: "password123" },
    }, false);
    assert.equal(loggedIn.status, 200);
    api.use(loggedIn.json.user.token);

    const current = await api.call("GET", "/api/user");
    assert.equal(current.status, 200);
    assert.equal(current.json.user.username, "auth_1");

    const updated = await api.call("PUT", "/api/user", { user: { bio: "" } });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.user.bio, null);

    const image = await api.call("PUT", "/api/user", { user: { image: null, bio: "Updated bio" } });
    assert.equal(image.json.user.image, null);
    assert.equal(image.json.user.bio, "Updated bio");

    const renamed = await api.call("PUT", "/api/user", {
      user: { username: "auth_1_upd", email: "auth_1_upd@test.com" },
    });
    assert.equal(renamed.status, 200);
    api.use(renamed.json.user.token);
    const persisted = await api.call("GET", "/api/user");
    assert.equal(persisted.json.user.username, "auth_1_upd");
    assert.equal(persisted.json.user.email, "auth_1_upd@test.com");
  });

  test("returns the contract's auth errors", async () => {
    const api = setup();
    const blank = await api.call("POST", "/api/users", {
      user: { username: "", email: "blank@test.com", password: "password123" },
    }, false);
    assert.equal(blank.status, 422);
    assert.equal(blank.json.errors.username[0], "can't be blank");

    const created = await api.call("POST", "/api/users", {
      user: { username: "dup", email: "dup@test.com", password: "password123" },
    }, false);
    api.use(created.json.user.token);
    const duplicateName = await api.call("POST", "/api/users", {
      user: { username: "dup", email: "other@test.com", password: "password123" },
    }, false);
    assert.equal(duplicateName.status, 409);
    assert.equal(duplicateName.json.errors.username[0], "has already been taken");

    const duplicateEmail = await api.call("POST", "/api/users", {
      user: { username: "other", email: "dup@test.com", password: "password123" },
    }, false);
    assert.equal(duplicateEmail.status, 409);
    assert.equal(duplicateEmail.json.errors.email[0], "has already been taken");

    const badPassword = await api.call("POST", "/api/users/login", {
      user: { email: "dup@test.com", password: "wrongpassword" },
    }, false);
    assert.equal(badPassword.status, 401);
    assert.equal(badPassword.json.errors.credentials[0], "invalid");

    const missing = await api.call("GET", "/api/user", undefined, false);
    assert.equal(missing.status, 401);
    assert.equal(missing.json.errors.token[0], "is missing");

    const emptyPassword = await api.call("PUT", "/api/user", { user: { password: "" } });
    assert.equal(emptyPassword.status, 422);
    const shortPassword = await api.call("PUT", "/api/user", { user: { password: "short7c" } });
    assert.equal(shortPassword.status, 422);
    const longPassword = await api.call("PUT", "/api/user", {
      user: { password: "a".repeat(64) },
    });
    assert.equal(longPassword.status, 200);
  });

  test("creates, lists, updates, and deletes articles", async () => {
    const api = setup();
    const user = await api.call("POST", "/api/users", {
      user: { username: "art", email: "art@test.com", password: "password123" },
    }, false);
    api.use(user.json.user.token);

    const created = await api.call("POST", "/api/articles", {
      article: {
        title: "Test Article",
        description: "Test description",
        body: "Test body content",
        tagList: ["dragons", "training"],
      },
    });
    assert.equal(created.status, 201);
    assert.deepEqual(created.json.article.tagList, ["dragons", "training"]);
    assert.equal(created.json.article.favorited, false);
    assert.equal(created.json.article.favoritesCount, 0);
    const slug = created.json.article.slug as string;
    const createdAt = created.json.article.createdAt as string;
    const updatedAt = created.json.article.updatedAt as string;

    const list = await api.call("GET", "/api/articles?author=art", undefined, false);
    assert.equal(list.status, 200);
    assert.equal(list.json.articlesCount, 1);
    assert.equal(list.json.articles[0].body, undefined);
    assert.equal(list.json.articles[0].author.username, "art");

    const byTag = await api.call("GET", "/api/articles?tag=dragons", undefined, false);
    assert.ok(byTag.json.articles[0].tagList.includes("dragons"));

    const updated = await api.call("PUT", `/api/articles/${slug}`, {
      article: { body: "Updated body content" },
    });
    assert.equal(updated.json.article.slug, slug);
    assert.equal(updated.json.article.createdAt, createdAt);
    assert.notEqual(updated.json.article.updatedAt, updatedAt);
    assert.equal(updated.json.article.tagList.length, 2);

    const cleared = await api.call("PUT", `/api/articles/${slug}`, { article: { tagList: [] } });
    assert.deepEqual(cleared.json.article.tagList, []);

    const invalidTags = await api.call("PUT", `/api/articles/${slug}`, { article: { tagList: null } });
    assert.equal(invalidTags.status, 422);

    const duplicate = await api.call("POST", "/api/articles", {
      article: { title: "Test Article", description: "second", body: "second" },
    });
    assert.equal(duplicate.status, 201);
    assert.notEqual(duplicate.json.article.slug, slug);

    const removed = await api.call("DELETE", `/api/articles/${slug}`);
    assert.equal(removed.status, 204);
    const missing = await api.call("GET", `/api/articles/${slug}`, undefined, false);
    assert.equal(missing.status, 404);
    assert.equal(missing.json.errors.article[0], "not found");
  });

  test("rejects article writes without ownership", async () => {
    const api = setup();
    const first = await api.call("POST", "/api/users", {
      user: { username: "owner", email: "owner@test.com", password: "password123" },
    }, false);
    const second = await api.call("POST", "/api/users", {
      user: { username: "other", email: "other@test.com", password: "password123" },
    }, false);
    api.use(first.json.user.token);
    const article = await api.call("POST", "/api/articles", {
      article: { title: "Owned", description: "d", body: "b" },
    });
    const slug = article.json.article.slug as string;
    api.use(second.json.user.token);
    const update = await api.call("PUT", `/api/articles/${slug}`, { article: { body: "hijacked" } });
    assert.equal(update.status, 403);
    assert.equal(update.json.errors.article[0], "forbidden");
    const deletion = await api.call("DELETE", `/api/articles/${slug}`);
    assert.equal(deletion.status, 403);

    const unauthenticated = await api.call("POST", "/api/articles", {
      article: { title: "No Auth", description: "d", body: "b" },
    }, false);
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.json.errors.token[0], "is missing");

    const blankTitle = await api.call("POST", "/api/articles", {
      article: { title: "", description: "d", body: "b" },
    });
    assert.equal(blankTitle.status, 422);
    assert.equal(blankTitle.json.errors.title[0], "can't be blank");
  });

  test("paginates newest first and keeps articlesCount as the total", async () => {
    const api = setup();
    const user = await api.call("POST", "/api/users", {
      user: { username: "page", email: "page@test.com", password: "password123" },
    }, false);
    api.use(user.json.user.token);
    const first = await api.call("POST", "/api/articles", {
      article: { title: "Pagination 1", description: "d", body: "b" },
    });
    const second = await api.call("POST", "/api/articles", {
      article: { title: "Pagination 2", description: "d", body: "b" },
    });
    const page = await api.call("GET", "/api/articles?author=page&limit=1", undefined, false);
    assert.equal(page.json.articles.length, 1);
    assert.equal(page.json.articlesCount, 2);
    assert.equal(page.json.articles[0].slug, second.json.article.slug);
    const next = await api.call("GET", "/api/articles?author=page&limit=1&offset=1", undefined, false);
    assert.equal(next.json.articles[0].slug, first.json.article.slug);
  });

  test("follows users and builds a feed from them", async () => {
    const api = setup();
    const main = await api.call("POST", "/api/users", {
      user: { username: "main", email: "main@test.com", password: "password123" },
    }, false);
    const celeb = await api.call("POST", "/api/users", {
      user: { username: "celeb", email: "celeb@test.com", password: "password123" },
    }, false);

    const anonymous = await api.call("GET", "/api/profiles/celeb", undefined, false);
    assert.equal(anonymous.json.profile.following, false);

    api.use(main.json.user.token);
    const empty = await api.call("GET", "/api/articles/feed");
    assert.equal(empty.json.articlesCount, 0);

    const followed = await api.call("POST", "/api/profiles/celeb/follow");
    assert.equal(followed.json.profile.following, true);

    api.use(celeb.json.user.token);
    await api.call("POST", "/api/articles", { article: { title: "Feed 1", description: "d", body: "b" } });
    await api.call("POST", "/api/articles", { article: { title: "Feed 2", description: "d", body: "b" } });

    api.use(main.json.user.token);
    const feed = await api.call("GET", "/api/articles/feed?limit=1");
    assert.equal(feed.json.articles.length, 1);
    assert.equal(feed.json.articlesCount, 2);
    assert.equal(feed.json.articles[0].author.username, "celeb");
    assert.equal(feed.json.articles[0].author.following, true);
    assert.equal(feed.json.articles[0].body, undefined);

    const unfollowed = await api.call("DELETE", "/api/profiles/celeb/follow");
    assert.equal(unfollowed.json.profile.following, false);
    const missing = await api.call("GET", "/api/profiles/nobody", undefined, false);
    assert.equal(missing.status, 404);
    assert.equal(missing.json.errors.profile[0], "not found");
    const feedLocked = await api.call("GET", "/api/articles/feed", undefined, false);
    assert.equal(feedLocked.status, 401);
    assert.equal(feedLocked.json.errors.token[0], "is missing");
  });

  test("favorites articles and filters by who favorited them", async () => {
    const api = setup();
    const user = await api.call("POST", "/api/users", {
      user: { username: "fav", email: "fav@test.com", password: "password123" },
    }, false);
    api.use(user.json.user.token);
    const article = await api.call("POST", "/api/articles", {
      article: { title: "Favorite me", description: "d", body: "b" },
    });
    const slug = article.json.article.slug as string;
    const favorited = await api.call("POST", `/api/articles/${slug}/favorite`);
    assert.equal(favorited.json.article.favorited, true);
    assert.equal(favorited.json.article.favoritesCount, 1);
    assert.equal(typeof favorited.json.article.body, "string");

    const filtered = await api.call("GET", "/api/articles?favorited=fav");
    assert.equal(filtered.json.articlesCount, 1);
    assert.ok(filtered.json.articles[0].favoritesCount >= 1);

    const cleared = await api.call("DELETE", `/api/articles/${slug}/favorite`);
    assert.equal(cleared.json.article.favorited, false);
    assert.equal(cleared.json.article.favoritesCount, 0);

    const missing = await api.call("POST", "/api/articles/missing/favorite");
    assert.equal(missing.status, 404);
    assert.equal(missing.json.errors.article[0], "not found");
  });

  test("creates and deletes comments", async () => {
    const api = setup();
    const author = await api.call("POST", "/api/users", {
      user: { username: "cmt", email: "cmt@test.com", password: "password123" },
    }, false);
    const other = await api.call("POST", "/api/users", {
      user: { username: "cmt2", email: "cmt2@test.com", password: "password123" },
    }, false);
    api.use(author.json.user.token);
    const article = await api.call("POST", "/api/articles", {
      article: { title: "Commented", description: "d", body: "b" },
    });
    const slug = article.json.article.slug as string;
    const first = await api.call("POST", `/api/articles/${slug}/comments`, { comment: { body: "First comment" } });
    assert.equal(first.status, 201);
    assert.equal(typeof first.json.comment.id, "number");
    await api.call("POST", `/api/articles/${slug}/comments`, { comment: { body: "Second comment" } });

    const list = await api.call("GET", `/api/articles/${slug}/comments`, undefined, false);
    assert.equal(list.json.comments.length, 2);

    api.use(other.json.user.token);
    const forbidden = await api.call("DELETE", `/api/articles/${slug}/comments/${first.json.comment.id}`);
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.json.errors.comment[0], "forbidden");

    api.use(author.json.user.token);
    const removed = await api.call("DELETE", `/api/articles/${slug}/comments/${first.json.comment.id}`);
    assert.equal(removed.status, 204);
    const remaining = await api.call("GET", `/api/articles/${slug}/comments`, undefined, false);
    assert.equal(remaining.json.comments.length, 1);
    assert.equal(remaining.json.comments[0].body, "Second comment");

    const blank = await api.call("POST", `/api/articles/${slug}/comments`, { comment: { body: "" } });
    assert.equal(blank.status, 422);
    assert.equal(blank.json.errors.body[0], "can't be blank");
    const orphan = await api.call("POST", "/api/articles/missing/comments", { comment: { body: "orphan" } });
    assert.equal(orphan.status, 404);
    assert.equal(orphan.json.errors.article[0], "not found");
    const missingComment = await api.call("DELETE", `/api/articles/${slug}/comments/99999`);
    assert.equal(missingComment.status, 404);
    assert.equal(missingComment.json.errors.comment[0], "not found");
  });

  test("lists tags that are still in use", async () => {
    const api = setup();
    const user = await api.call("POST", "/api/users", {
      user: { username: "tagger", email: "tagger@test.com", password: "password123" },
    }, false);
    api.use(user.json.user.token);
    const article = await api.call("POST", "/api/articles", {
      article: { title: "Tagged", description: "d", body: "b", tagList: ["alpha", "beta"] },
    });
    const tags = await api.call("GET", "/api/tags", undefined, false);
    assert.ok(tags.json.tags.includes("alpha"));
    assert.ok(tags.json.tags.includes("beta"));
    await api.call("DELETE", `/api/articles/${article.json.article.slug}`);
    const after = await api.call("GET", "/api/tags", undefined, false);
    assert.equal(after.json.tags.includes("alpha"), false);
  });
});
