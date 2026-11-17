import { z } from "zod";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blankObject = {
  error: (iss: { input: unknown }) =>
    iss.input === undefined ||
    iss.input === null ||
    typeof iss.input !== "object" ||
    Array.isArray(iss.input)
      ? "can't be blank"
      : undefined,
} as const;

export const requiredText = z
  .string({
    error: (iss) => (iss.input === undefined || iss.input === null ? "can't be blank" : "is invalid"),
  })
  .trim()
  .min(1, { error: "can't be blank" });

export const requiredEmail = requiredText.regex(EMAIL, { error: "is invalid" });

export const requiredPassword = z
  .string({
    error: (iss) =>
      iss.input === undefined || iss.input === null ? "can't be blank" : "is invalid",
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

export function nullableText(max: number) {
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

export const tagList = z
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

export const registerJson = z
  .object({
    user: z.object(
      {
        username: requiredText,
        email: requiredEmail,
        password: requiredPassword,
      },
      blankObject,
    ),
  })
  .transform((data) => data.user);

export const loginJson = z
  .object({
    user: z.object(
      {
        email: requiredEmail,
        password: requiredPassword,
      },
      blankObject,
    ),
  })
  .transform((data) => data.user);

export const updateUserJson = z
  .object({
    user: z
      .object(
        {
          email: requiredEmail.optional(),
          username: requiredText.optional(),
          password: requiredPassword.optional(),
          bio: nullableText(500),
          image: nullableText(2048),
        },
        blankObject,
      )
      .refine((data) => Object.values(data).some((value) => value !== undefined), {
        error: "at least one field is required",
      }),
  })
  .transform((data) => data.user);

export const newArticleJson = z
  .object({
    article: z.object(
      {
        title: requiredText,
        description: requiredText,
        body: requiredText,
        tagList: tagList.optional().transform((value) => value ?? []),
      },
      blankObject,
    ),
  })
  .transform((data) => data.article);

export const updateArticleJson = z
  .object({
    article: z
      .object(
        {
          title: requiredText.optional(),
          description: requiredText.optional(),
          body: requiredText.optional(),
          tagList: tagList.optional(),
        },
        blankObject,
      )
      .refine((data) => Object.values(data).some((value) => value !== undefined), {
        error: "at least one field is required",
      }),
  })
  .transform((data) => data.article);

export const newCommentJson = z
  .object({
    comment: z.object(
      {
        body: requiredText,
      },
      blankObject,
    ),
  })
  .transform((data) => data.comment);

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

export const listQuery = z.object({
  tag: z.string().optional().transform((value) => value || undefined),
  author: z.string().optional().transform((value) => value || undefined),
  favorited: z.string().optional().transform((value) => value || undefined),
  limit: integerQuery(20, 1),
  offset: integerQuery(0, 0),
});

export type RegisterInput = z.infer<typeof registerJson>;
export type LoginInput = z.infer<typeof loginJson>;
export type UpdateUserInput = z.infer<typeof updateUserJson>;
export type NewArticleInput = z.infer<typeof newArticleJson>;
export type UpdateArticleInput = z.infer<typeof updateArticleJson>;
export type NewCommentInput = z.infer<typeof newCommentJson>;
export type ListQuery = z.infer<typeof listQuery>;
