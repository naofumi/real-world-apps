import { createHmac, timingSafeEqual } from "node:crypto";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export function signToken(userId: number, secret: string, now = Date.now()): string {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({
      sub: String(userId),
      exp: Math.floor(now / 1000) + THIRTY_DAYS_SECONDS,
    }),
  );
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function readUserId(token: string, secret: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: unknown;
      exp?: unknown;
    };
    if (typeof body.sub !== "string" || typeof body.exp !== "number") return null;
    if (body.exp <= Math.floor(Date.now() / 1000)) return null;
    const userId = Number(body.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return userId;
  } catch {
    return null;
  }
}
