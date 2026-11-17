import type { FieldErrors } from "@conduit/contracts";
import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { AppError } from "../shared/errors.js";

export function fieldErrorsFromZod(error: { issues: { path: PropertyKey[]; message: string }[] }): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.length === 0 ? "body" : String(issue.path[issue.path.length - 1]);
    if (errors[field]) continue;
    errors[field] = [issue.message];
  }
  return errors;
}

function conduitValidator<T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError("validation", fieldErrorsFromZod(result.error));
    }
  });
}

export function zJson<T extends ZodType>(schema: T) {
  return conduitValidator("json", schema);
}

export function zQuery<T extends ZodType>(schema: T) {
  return conduitValidator("query", schema);
}
