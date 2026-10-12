import type { Comment } from "@conduit/contracts";
import { comments, users, type Db } from "@conduit/db";
import { and, asc, eq } from "drizzle-orm";
import { AppError } from "../../shared/errors.js";
import { nowIso } from "../../shared/clock.js";
import { followingSql } from "../../shared/author-sql.js";
import { findArticleRef } from "../articles/queries.js";

type CommentRow = {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorUsername: string;
  authorBio: string | null;
  authorImage: string | null;
  following: number;
};

function present(row: CommentRow): Comment {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      username: row.authorUsername,
      bio: row.authorBio,
      image: row.authorImage,
      following: Number(row.following) === 1,
    },
  };
}

function commentQuery(db: Db, viewerId: number | null) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorUsername: users.username,
      authorBio: users.bio,
      authorImage: users.image,
      following: followingSql(viewerId),
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId));
}

export function listComments(db: Db, slug: string, viewerId: number | null): Comment[] {
  const article = findArticleRef(db, slug);
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  return commentQuery(db, viewerId)
    .where(eq(comments.articleId, article.id))
    .orderBy(asc(comments.createdAt), asc(comments.id))
    .all()
    .map(present);
}

export function createComment(db: Db, slug: string, authorId: number, body: string): Comment {
  const article = findArticleRef(db, slug);
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  const timestamp = nowIso();
  const row = db
    .insert(comments)
    .values({
      articleId: article.id,
      authorId,
      body,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning({ id: comments.id })
    .get();
  if (!row) throw new Error("Failed to insert comment");
  const created = commentQuery(db, authorId).where(eq(comments.id, row.id)).get();
  if (!created) throw new Error("Failed to load comment");
  return present(created);
}

export function deleteComment(db: Db, slug: string, commentId: number, userId: number) {
  const article = findArticleRef(db, slug);
  if (!article) throw new AppError("not_found", { article: ["not found"] });
  const comment = db
    .select()
    .from(comments)
    .where(and(eq(comments.id, commentId), eq(comments.articleId, article.id)))
    .get();
  if (!comment) throw new AppError("not_found", { comment: ["not found"] });
  if (comment.authorId !== userId) throw new AppError("forbidden", { comment: ["forbidden"] });
  db.delete(comments).where(eq(comments.id, comment.id)).run();
}
