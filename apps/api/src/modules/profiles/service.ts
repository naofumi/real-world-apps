import type { Profile } from "@conduit/contracts";
import { follows, users, type Db } from "@conduit/db";
import { and, eq } from "drizzle-orm";
import { AppError } from "../../shared/errors.js";
import { nowIso } from "../../shared/clock.js";

function loadUser(db: Db, username: string) {
  return db.select().from(users).where(eq(users.username, username)).get();
}

function isFollowing(db: Db, followerId: number | null, followedId: number): boolean {
  if (followerId == null) return false;
  return Boolean(
    db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followedId, followedId)))
      .get(),
  );
}

function toProfile(row: { username: string; bio: string | null; image: string | null }, following: boolean): Profile {
  return {
    username: row.username,
    bio: row.bio,
    image: row.image,
    following,
  };
}

export function getProfile(db: Db, username: string, viewerId: number | null): Profile {
  const row = loadUser(db, username);
  if (!row) throw new AppError("not_found", { profile: ["not found"] });
  return toProfile(row, isFollowing(db, viewerId, row.id));
}

export function followUser(db: Db, followerId: number, username: string): Profile {
  const row = loadUser(db, username);
  if (!row) throw new AppError("not_found", { profile: ["not found"] });
  if (row.id === followerId) throw new AppError("validation", { profile: ["cannot follow yourself"] });
  db.insert(follows)
    .values({ followerId, followedId: row.id, createdAt: nowIso() })
    .onConflictDoNothing()
    .run();
  return toProfile(row, true);
}

export function unfollowUser(db: Db, followerId: number, username: string): Profile {
  const row = loadUser(db, username);
  if (!row) throw new AppError("not_found", { profile: ["not found"] });
  db.delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followedId, row.id)))
    .run();
  return toProfile(row, false);
}
