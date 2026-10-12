import { users, type Db } from "@conduit/db";
import { eq } from "drizzle-orm";
import { AppError, isUniqueConstraint } from "../../shared/errors.js";
import { nowIso } from "../../shared/clock.js";
import { hashPassword, verifyPassword } from "./password.js";

export type Account = {
  id: number;
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
};

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type UpdateAccountInput = {
  email?: string;
  username?: string;
  password?: string;
  bio?: string | null;
  image?: string | null;
};

type UserRow = typeof users.$inferSelect;

function toAccount(row: UserRow): Account {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    bio: row.bio,
    image: row.image,
  };
}

export function getAccount(db: Db, id: number): Account | null {
  const row = db.select().from(users).where(eq(users.id, id)).get();
  return row ? toAccount(row) : null;
}

export async function register(db: Db, input: RegisterInput): Promise<Account> {
  const email = input.email.toLowerCase();
  const taken: Record<string, string[]> = {};
  if (db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) {
    taken.email = ["has already been taken"];
  }
  if (db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).get()) {
    taken.username = ["has already been taken"];
  }
  if (Object.keys(taken).length > 0) throw new AppError("conflict", taken);

  const passwordHash = await hashPassword(input.password);
  const timestamp = nowIso();
  try {
    const row = db
      .insert(users)
      .values({
        email,
        username: input.username,
        passwordHash,
        bio: null,
        image: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()
      .get();
    if (!row) throw new Error("Failed to insert user");
    return toAccount(row);
  } catch (error) {
    if (isUniqueConstraint(error, "email")) throw new AppError("conflict", { email: ["has already been taken"] });
    if (isUniqueConstraint(error, "username")) throw new AppError("conflict", { username: ["has already been taken"] });
    throw error;
  }
}

const dummyHash = hashPassword("not-a-real-password");

export async function authenticate(db: Db, email: string, password: string): Promise<Account> {
  const row = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  const matches = await verifyPassword(password, row?.passwordHash ?? (await dummyHash));
  if (!row || !matches) throw new AppError("unauthorized", { credentials: ["invalid"] });
  return toAccount(row);
}

export async function updateAccount(db: Db, accountId: number, input: UpdateAccountInput): Promise<Account> {
  const current = db.select().from(users).where(eq(users.id, accountId)).get();
  if (!current) throw new AppError("unauthorized", { token: ["is invalid"] });

  const email = input.email?.toLowerCase();
  if (email && email !== current.email) {
    const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (existing) throw new AppError("validation", { email: ["has already been taken"] });
  }
  if (input.username && input.username !== current.username) {
    const existing = db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).get();
    if (existing) throw new AppError("validation", { username: ["has already been taken"] });
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;
  try {
    const row = db
      .update(users)
      .set({
        email: email ?? current.email,
        username: input.username ?? current.username,
        passwordHash: passwordHash ?? current.passwordHash,
        bio: input.bio === undefined ? current.bio : input.bio,
        image: input.image === undefined ? current.image : input.image,
        updatedAt: nowIso(),
      })
      .where(eq(users.id, accountId))
      .returning()
      .get();
    if (!row) throw new Error("Failed to update user");
    return toAccount(row);
  } catch (error) {
    if (isUniqueConstraint(error, "email")) throw new AppError("validation", { email: ["has already been taken"] });
    if (isUniqueConstraint(error, "username")) throw new AppError("validation", { username: ["has already been taken"] });
    throw error;
  }
}
