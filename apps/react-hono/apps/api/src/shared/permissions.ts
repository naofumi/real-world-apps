import type { ArticlePermissions, CommentPermissions, ProfilePermissions } from "@conduit/contracts";
import { AppError } from "./errors.js";

export function profilePermissions(viewerId: number | null, profileUserId: number): ProfilePermissions {
  const signedIn = viewerId != null;
  const self = signedIn && viewerId === profileUserId;
  return {
    follow: signedIn && !self,
    update: self,
  };
}

export function articlePermissions(viewerId: number | null, authorId: number): ArticlePermissions {
  const signedIn = viewerId != null;
  const owner = signedIn && viewerId === authorId;
  return {
    update: owner,
    delete: owner,
    favorite: signedIn,
  };
}

export function commentPermissions(viewerId: number | null, authorId: number): CommentPermissions {
  return {
    delete: viewerId != null && viewerId === authorId,
  };
}

export function assertArticleUpdate(viewerId: number, authorId: number) {
  if (!articlePermissions(viewerId, authorId).update) {
    throw new AppError("forbidden", { article: ["forbidden"] });
  }
}

export function assertArticleDelete(viewerId: number, authorId: number) {
  if (!articlePermissions(viewerId, authorId).delete) {
    throw new AppError("forbidden", { article: ["forbidden"] });
  }
}

export function assertCommentDelete(viewerId: number, authorId: number) {
  if (!commentPermissions(viewerId, authorId).delete) {
    throw new AppError("forbidden", { comment: ["forbidden"] });
  }
}
