import type { Context } from "hono";
import type { FieldErrors } from "@conduit/contracts";
import { AppError } from "../shared/errors.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErrorBag = FieldErrors;

function add(errors: ErrorBag, field: string, message: string) {
  errors[field] = [message];
}

export async function readJson(c: Context): Promise<Record<string, unknown>> {
  try {
    const value = await c.req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new AppError("validation", { body: ["is invalid"] });
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("validation", { body: ["is invalid"] });
  }
}

function objectField(body: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = body[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("validation", { [key]: ["can't be blank"] });
  }
  return value as Record<string, unknown>;
}

function requiredText(errors: ErrorBag, field: string, value: unknown): string | undefined {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    add(errors, field, "can't be blank");
    return undefined;
  }
  if (typeof value !== "string") {
    add(errors, field, "is invalid");
    return undefined;
  }
  return value.trim();
}

function requiredEmail(errors: ErrorBag, value: unknown): string | undefined {
  const email = requiredText(errors, "email", value);
  if (!email || errors.email) return undefined;
  if (!EMAIL.test(email)) {
    add(errors, "email", "is invalid");
    return undefined;
  }
  return email;
}

function requiredPassword(errors: ErrorBag, value: unknown): string | undefined {
  if (value == null || value === "") {
    add(errors, "password", "can't be blank");
    return undefined;
  }
  if (typeof value !== "string") {
    add(errors, "password", "is invalid");
    return undefined;
  }
  if (value.length < 8) {
    add(errors, "password", "is too short (minimum is 8 characters)");
    return undefined;
  }
  if (value.length > 128) {
    add(errors, "password", "is too long (maximum is 128 characters)");
    return undefined;
  }
  return value;
}

function optionalPassword(errors: ErrorBag, value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return requiredPassword(errors, value);
}

function nullableText(errors: ErrorBag, field: string, value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    add(errors, field, "is invalid");
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    add(errors, field, "is too long");
    return undefined;
  }
  return trimmed;
}

function throwIfNeeded(errors: ErrorBag) {
  if (Object.keys(errors).length > 0) throw new AppError("validation", errors);
}

function assertPresent<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("missing value after validation");
  return value;
}

export async function parseRegister(c: Context) {
  const user = objectField(await readJson(c), "user");
  const errors: ErrorBag = {};
  const username = requiredText(errors, "username", user.username);
  const email = requiredEmail(errors, user.email);
  const password = requiredPassword(errors, user.password);
  throwIfNeeded(errors);
  return {
    username: assertPresent(username),
    email: assertPresent(email),
    password: assertPresent(password),
  };
}

export async function parseLogin(c: Context) {
  const user = objectField(await readJson(c), "user");
  const errors: ErrorBag = {};
  const email = requiredEmail(errors, user.email);
  const password = requiredPassword(errors, user.password);
  throwIfNeeded(errors);
  return {
    email: assertPresent(email),
    password: assertPresent(password),
  };
}

export async function parseUpdateUser(c: Context) {
  const user = objectField(await readJson(c), "user");
  const errors: ErrorBag = {};
  const present = ["email", "username", "password", "bio", "image"].filter((key) => key in user);
  if (present.length === 0) throw new AppError("validation", { user: ["at least one field is required"] });

  const input: {
    email?: string;
    username?: string;
    password?: string;
    bio?: string | null;
    image?: string | null;
  } = {};

  if ("email" in user) {
    const email = requiredEmail(errors, user.email);
    if (email) input.email = email;
  }
  if ("username" in user) {
    const username = requiredText(errors, "username", user.username);
    if (username) input.username = username;
  }
  if ("password" in user) {
    const password = optionalPassword(errors, user.password);
    if (password) input.password = password;
  }
  if ("bio" in user) input.bio = nullableText(errors, "bio", user.bio, 500);
  if ("image" in user) input.image = nullableText(errors, "image", user.image, 2048);
  throwIfNeeded(errors);
  return input;
}

function parseTagList(errors: ErrorBag, value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    add(errors, "tagList", "is invalid");
    return undefined;
  }
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      add(errors, "tagList", "can't be blank");
      return undefined;
    }
    const name = item.trim();
    if (name.length > 40) {
      add(errors, "tagList", "is too long");
      return undefined;
    }
    if (seen.has(name)) continue;
    seen.add(name);
    tags.push(name);
  }
  return tags;
}

export async function parseNewArticle(c: Context) {
  const article = objectField(await readJson(c), "article");
  const errors: ErrorBag = {};
  const title = requiredText(errors, "title", article.title);
  const description = requiredText(errors, "description", article.description);
  const body = requiredText(errors, "body", article.body);
  const tagList = parseTagList(errors, article.tagList);
  throwIfNeeded(errors);
  return {
    title: assertPresent(title),
    description: assertPresent(description),
    body: assertPresent(body),
    tagList: tagList ?? [],
  };
}

export async function parseUpdateArticle(c: Context) {
  const article = objectField(await readJson(c), "article");
  const errors: ErrorBag = {};
  const input: { title?: string; description?: string; body?: string; tagList?: string[] } = {};
  if ("title" in article) {
    const title = requiredText(errors, "title", article.title);
    if (title) input.title = title;
  }
  if ("description" in article) {
    const description = requiredText(errors, "description", article.description);
    if (description) input.description = description;
  }
  if ("body" in article) {
    const body = requiredText(errors, "body", article.body);
    if (body) input.body = body;
  }
  if ("tagList" in article) {
    const tagList = parseTagList(errors, article.tagList);
    if (tagList) input.tagList = tagList;
    if (Array.isArray(article.tagList) && article.tagList.length === 0) input.tagList = [];
  }
  throwIfNeeded(errors);
  if (Object.keys(input).length === 0) throw new AppError("validation", { article: ["at least one field is required"] });
  return input;
}

export async function parseNewComment(c: Context) {
  const comment = objectField(await readJson(c), "comment");
  const errors: ErrorBag = {};
  const body = requiredText(errors, "body", comment.body);
  throwIfNeeded(errors);
  return { body: assertPresent(body) };
}

function integerParam(raw: string | undefined, field: string, fallback: number, minimum: number): number {
  if (raw === undefined || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) throw new AppError("validation", { [field]: ["is invalid"] });
  const value = Number(raw);
  if (value < minimum) throw new AppError("validation", { [field]: ["is invalid"] });
  return value;
}

export function parseListQuery(c: Context) {
  const tag = c.req.query("tag");
  const author = c.req.query("author");
  const favorited = c.req.query("favorited");
  return {
    tag: tag || undefined,
    author: author || undefined,
    favorited: favorited || undefined,
    limit: integerParam(c.req.query("limit"), "limit", 20, 1),
    offset: integerParam(c.req.query("offset"), "offset", 0, 0),
  };
}
