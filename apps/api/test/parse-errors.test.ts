import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Hono } from "hono";
import { parseListQuery, parseLogin, parseNewComment, parseRegister } from "../src/http/parse.js";
import { AppError } from "../src/shared/errors.js";

describe("AppError status", () => {
  test("maps each code to a fixed HTTP status", () => {
    assert.equal(new AppError("unauthorized", { token: ["is invalid"] }).status, 401);
    assert.equal(new AppError("forbidden", { article: ["forbidden"] }).status, 403);
    assert.equal(new AppError("not_found", { article: ["not found"] }).status, 404);
    assert.equal(new AppError("conflict", { email: ["has already been taken"] }).status, 409);
    assert.equal(new AppError("validation", { username: ["can't be blank"] }).status, 422);
  });
});

describe("parse boundary returns", () => {
  test("parseListQuery returns filters and pagination without a feed flag", async () => {
    const app = new Hono();
    app.get("/q", (c) => {
      const query = parseListQuery(c);
      return c.json({
        query,
        keys: Object.keys(query).sort(),
      });
    });

    const response = await app.request("/q?tag=dragons&author=jake&favorited=jane&limit=5&offset=10");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.keys, ["author", "favorited", "limit", "offset", "tag"]);
    assert.deepEqual(body.query, {
      tag: "dragons",
      author: "jake",
      favorited: "jane",
      limit: 5,
      offset: 10,
    });
  });

  test("required-field parsers return concrete strings after validation", async () => {
    const app = new Hono();
    app.post("/register", async (c) => c.json(await parseRegister(c)));
    app.post("/login", async (c) => c.json(await parseLogin(c)));
    app.post("/comment", async (c) => c.json(await parseNewComment(c)));

    const registered = await app.request("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user: { username: "jake", email: "jake@jake.jake", password: "password123" },
      }),
    });
    assert.equal(registered.status, 200);
    assert.deepEqual(await registered.json(), {
      username: "jake",
      email: "jake@jake.jake",
      password: "password123",
    });

    const loggedIn = await app.request("/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user: { email: "jake@jake.jake", password: "password123" },
      }),
    });
    assert.equal(loggedIn.status, 200);
    assert.deepEqual(await loggedIn.json(), {
      email: "jake@jake.jake",
      password: "password123",
    });

    const comment = await app.request("/comment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ comment: { body: "Nice post!" } }),
    });
    assert.equal(comment.status, 200);
    assert.deepEqual(await comment.json(), { body: "Nice post!" });
  });

  test("required-field parsers reject blanks with validation AppError", async () => {
    const app = new Hono();
    app.onError((error, c) => {
      if (error instanceof AppError) return c.json({ errors: error.errors, status: error.status }, 200);
      throw error;
    });
    app.post("/register", async (c) => c.json(await parseRegister(c)));

    const blank = await app.request("/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: { username: "", email: "x@y.z", password: "password123" } }),
    });
    assert.equal(blank.status, 200);
    assert.deepEqual(await blank.json(), {
      errors: { username: ["can't be blank"] },
      status: 422,
    });
  });
});
