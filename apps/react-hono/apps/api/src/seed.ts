import { createDb, migrateDb, users } from "@conduit/db";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { register, updateAccount } from "./modules/identity/service.js";
import { followUser } from "./modules/profiles/service.js";
import { createArticle, favoriteArticle } from "./modules/articles/service.js";
import { createComment } from "./modules/comments/service.js";

const databasePath = process.env.DATABASE_PATH ?? fileURLToPath(new URL("../../../data/conduit.sqlite", import.meta.url));

const password = "password123";

const people = [
  {
    email: "demo@realworld.local",
    username: "demo",
    bio: "I write about the shape of ordinary applications.",
  },
  {
    email: "jane@realworld.local",
    username: "jane",
    bio: "Notes on databases that fit on one machine.",
  },
  {
    email: "anika@realworld.local",
    username: "anika",
    bio: "Product engineer. Interested in feeds and small social graphs.",
  },
] as const;

async function main() {
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
  const db = createDb(databasePath);
  migrateDb(db);
  if (db.select({ id: users.id }).from(users).get()) {
    console.log("Database already has users; leaving it unchanged.");
    return;
  }

  const demo = await register(db, { email: people[0].email, username: people[0].username, password });
  const jane = await register(db, { email: people[1].email, username: people[1].username, password });
  const anika = await register(db, { email: people[2].email, username: people[2].username, password });
  await updateAccount(db, demo.id, { bio: people[0].bio });
  await updateAccount(db, jane.id, { bio: people[1].bio });
  await updateAccount(db, anika.id, { bio: people[2].bio });

  const sqlite = createArticle(db, jane.id, {
    title: "SQLite is a serious application database",
    description: "One file, transactions, and enough SQL for a product that is still finding its shape.",
    body: [
      "Most applications do not need a separate database server on day one.",
      "",
      "SQLite gives you transactions, indexes, and a single file you can copy. That is enough for Conduit, and it is enough for a surprising number of internal tools.",
      "",
      "## What you give up",
      "",
      "- Many writers at once",
      "- A network hop you can scale independently",
      "",
      "What you keep is a schema you can reason about, and backups that are just the file.",
    ].join("\n"),
    tagList: ["sqlite", "backend"],
  });

  createArticle(db, jane.id, {
    title: "What a modular monolith is for",
    description: "Module boundaries you can enforce in review, without a network call between them.",
    body: [
      "A modular monolith is one process and one database, split by who is allowed to write each table.",
      "",
      "Identity owns accounts. Profiles own the follow graph. Articles own posts, tags, and favorites. The HTTP layer is an adapter: it speaks the RealWorld contract and calls those modules.",
      "",
      "Cross-module reads are allowed in query files. Cross-module writes are not.",
    ].join("\n"),
    tagList: ["architecture", "backend"],
  });

  const feedArticle = createArticle(db, demo.id, {
    title: "A feed you can finish reading",
    description: "Pagination, an author card, and a favorite button. The whole social surface is smaller than it looks.",
    body: [
      "Conduit's home page is a list of articles, a tag sidebar, and two feeds.",
      "",
      "Your feed is every article written by someone you follow, newest first. The global feed is everyone. Both use the same card.",
      "",
      "The interesting part is not the layout. It is that `favorited` and `following` depend on who is asking, so the query has to know the viewer.",
    ].join("\n"),
    tagList: ["react", "frontend"],
  });

  createArticle(db, anika.id, {
    title: "Comments are a second list",
    description: "Same author card, a smaller write model, and a delete button that only the author sees.",
    body: [
      "A comment belongs to an article and a user. It is not editable in this app. The author can delete it, and nobody else can.",
      "",
      "That rule lives in the comments module. The route only checks that a token is present, then asks the module to do the work.",
    ].join("\n"),
    tagList: ["modeling"],
  });

  followUser(db, demo.id, jane.username);
  favoriteArticle(db, demo.id, sqlite.slug);
  createComment(db, feedArticle.slug, anika.id, "The viewer-aware part is the whole product.");
  createComment(db, sqlite.slug, demo.id, "WAL mode and a single connection is a good default here.");

  console.log("Seeded demo accounts. Password for each is password123.");
  console.log("  demo@realworld.local");
  console.log("  jane@realworld.local");
  console.log("  anika@realworld.local");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
