import type { FieldErrors } from "@conduit/contracts";

const STATUS = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation: 422,
} as const;

export type ErrorCode = keyof typeof STATUS;
export type ErrorStatus = (typeof STATUS)[ErrorCode];

export class AppError extends Error {
  readonly status: ErrorStatus;

  constructor(
    public readonly code: ErrorCode,
    public readonly errors: FieldErrors,
  ) {
    super(Object.entries(errors).flatMap(([field, messages]) => messages.map((message) => `${field} ${message}`)).join("; "));
    this.status = STATUS[code];
  }
}

export function isUniqueConstraint(error: unknown, column: string): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed") && error.message.includes(column);
}
