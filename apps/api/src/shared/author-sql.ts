import { follows, users } from "@conduit/db";
import { sql } from "drizzle-orm";

export function followingSql(viewerId: number | null) {
  if (viewerId == null) return sql<number>`0`;
  return sql<number>`exists (select 1 from ${follows} where ${follows.followerId} = ${viewerId} and ${follows.followedId} = ${users.id})`;
}
