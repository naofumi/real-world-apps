import type { FieldErrors } from "@conduit/contracts";
import type { Context } from "hono";
import { z } from "zod";
import { AppError } from "../shared/errors.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.length === 0 ? "body" : String(issue.path[issue.path.length - 1]);
    if (errors[field]) continue;
    errors[field] = [issue.message];
  }
  return errors;
}

function parseWith<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError("validation", fieldErrorsFromZod(result.error));
  return result.data;
}

export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new AppError("validation", { body: ["is invalid"] });
  }
}

const requiredText = z
  .string({
    error: (iss) => (iss.input === undefined || iss.input === null ? "can't be blank" : "is invalid"),
  })
  .trim()
  .min(1, { error: "can't be blank" });

const requiredEmail = requiredText.regex(EMAIL, { error: "is invalid" });

const requiredPassword = z
  .string({
    error: (iss) =>
      iss.input === undefined || iss.input === null || iss.input === "" ? "can't be blank" : "is invalid",
  })
  .superRefine((value, ctx) => {
    if (value === "") {
      ctx.addIssue({ code: "custom", message: "can't be blank" });
      return;
    }
    if (value.length < 8) {
      ctx.addIssue({ code: "custom", message: "is too short (minimum is 8 characters)" });
      return;
    }
    if (value.length > 128) {
      ctx.addIssue({ code: "custom", message: "is too long (maximum is 128 characters)" });
    }
  });

function nullableText(max: number) {
  return z
    .unknown()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (typeof value !== "string") {
        ctx.issues.push({ code: "custom", message: "is invalid", input: value, path: [] });
        return z.NEVER;
      }
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (trimmed.length > max) {
        ctx.issues.push({ code: "custom", message: "is too long", input: value, path: [] });
        return z.NEVER;
      }
      return trimmed;
    });
}

const tagList = z
  .array(z.unknown(), { error: "is invalid" })
  .superRefine((items, ctx) => {
    for (const item of items) {
      if (typeof item !== "string" || item.trim() === "") {
        ctx.addIssue({ code: "custom", message: "can't be blank" });
        return;
      }
      if (item.trim().length > 40) {
        ctx.addIssue({ code: "custom", message: "is too long" });
        return;
      }
    }
  })
  .transform((items) => {
    const tags: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const name = String(item).trim();
      if (seen.has(name)) continue;
      seen.add(name);
      tags.push(name);
    }
    return tags;
  });

function wrappedObject<T extends z.ZodRawShape>(key: string, shape: T) {
  return z.object({
    [key]: z.object(shape, {
      error: (iss) =>
        iss.input === undefined ||
        iss.input === null ||
        typeof iss.input !== "object" ||
        Array.isArray(iss.input)
          ? "can't be blank"
          : undefined,
    }),
  });
}

const registerSchema = wrappedObject("user", {
  username: requiredText,
  email: requiredEmail,
  password: requiredPassword,
}).transform((data) => data.user);

const loginSchema = wrappedObject("user", {
  email: requiredEmail,
  password: requiredPassword,
}).transform((data) => data.user);

const nestedRecord = (key: string) =>
  z.object({
    [key]: z.record(z.string(), z.unknown(), {
      error: (iss) =>
        iss.input === undefined ||
        iss.input === null ||
        typeof iss.input !== "object" ||
        Array.isArray(iss.input)
          ? "can't be blank"
          : undefined,
    }),
  });

const updateUserFields = z
  .object({
    email: requiredEmail.optional(),
    username: requiredText.optional(),
    password: requiredPassword.optional(),
    bio: nullableText(500),
    image: nullableText(2048),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "at least one field is required",
    path: ["user"],
  });

const newArticleSchema = wrappedObject("article", {
  title: requiredText,
  description: requiredText,
  body: requiredText,
  tagList: tagList.optional().transform((value) => value ?? []),
}).transform((data) => data.article);

const updateArticleFields = z
  .object({
    title: requiredText.optional(),
    description: requiredText.optional(),
    body: requiredText.optional(),
    tagList: tagList.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "at least one field is required",
    path: ["article"],
  });

const newCommentSchema = wrappedObject("comment", {
  body: requiredText,
}).transform((data) => data.comment);

function integerQuery(fallback: number, minimum: number) {
  return z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (raw === undefined || raw === "") return fallback;
      if (!/^\d+$/.test(raw)) {
        ctx.issues.push({ code: "custom", message: "is invalid", input: raw, path: [] });
        return z.NEVER;
      }
      const value = Number(raw);
      if (value < minimum) {
        ctx.issues.push({ code: "custom", message: "is invalid", input: raw, path: [] });
        return z.NEVER;
      }
      return value;
    });
}

const listQuerySchema = z.object({
  tag: z.string().optional().transform((value) => value || undefined),
  author: z.string().optional().transform((value) => value || undefined),
  favorited: z.string().optional().transform((value) => value || undefined),
  limit: integerQuery(20, 1),
  offset: integerQuery(0, 0),
});

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError("validation", { body: ["is invalid"] });
  }
  return parseWith(schema, body);
}

export async function parseRegister(c: Context) {
  return parseBody(registerSchema, await readJson(c));
}

export async function parseLogin(c: Context) {
  return parseBody(loginSchema, await readJson(c));
}

export async function parseUpdateUser(c: Context) {
  const body = parseBody(nestedRecord("user"), await readJson(c));
  const raw = body.user;
  const picked: Record<string, unknown> = {};
  for (const key of ["email", "username", "password", "bio", "image"] as const) {
    if (Object.hasOwn(raw, key)) picked[key] = raw[key];
  }
  return parseWith(updateUserFields, picked);
}

export async function parseNewArticle(c: Context) {
  return parseBody(newArticleSchema, await readJson(c));
}

export async function parseUpdateArticle(c: Context) {
  const body = parseBody(nestedRecord("article"), await readJson(c));
  const raw = body.article;
  const picked: Record<string, unknown> = {};
  for (const key of ["title", "description", "body", "tagList"] as const) {
    if (Object.hasOwn(raw, key)) picked[key] = raw[key];
  }
  return parseWith(updateArticleFields, picked);
}

export async function parseNewComment(c: Context) {
  return parseBody(newCommentSchema, await readJson(c));
}

export function parseListQuery(c: Context) {
  return parseWith(listQuerySchema, {
    tag: c.req.query("tag"),
    author: c.req.query("author"),
    favorited: c.req.query("favorited"),
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
  });
}
