import type { Article } from "@conduit/contracts";
import { Link } from "react-router-dom";
import { followState, type ViewerRole } from "../../lib/viewer-role.js";
import { FollowButton } from "../profiles/follow-button.js";
import { ArticleMeta } from "./article-meta.js";
import { FavoriteButton } from "./favorite-button.js";

type ArticleActionsProps = {
  role: ViewerRole;
  article: Pick<Article, "slug" | "author" | "createdAt" | "favorited" | "favoritesCount">;
  onDelete: () => void;
};

export function ArticleActions({ role, article, onDelete }: ArticleActionsProps) {
  return (
    <ArticleMeta author={article.author} date={article.createdAt}>
      {role.kind === "owner" ? (
        <>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${encodeURIComponent(article.slug)}`}>
            <i className="ion-edit" /> Edit Article
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              if (window.confirm("Delete this article?")) onDelete();
            }}
          >
            <i className="ion-trash-a" /> Delete Article
          </button>
        </>
      ) : (
        <FollowButton username={article.author.username} following={followState(role)} />
      )}
      <FavoriteButton
        slug={article.slug}
        favorited={article.favorited}
        favoritesCount={article.favoritesCount}
        variant="detail"
      />
    </ArticleMeta>
  );
}
