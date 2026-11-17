import type { Article } from "@conduit/contracts";
import { Link } from "react-router-dom";
import { FollowButton } from "../profiles/follow-button.js";
import { ArticleMeta } from "./article-meta.js";
import { FavoriteButton } from "./favorite-button.js";

type ArticleActionsProps = {
  article: Pick<
    Article,
    "slug" | "author" | "createdAt" | "favorited" | "favoritesCount" | "permissions"
  >;
  onDelete: () => void;
};

export function ArticleActions({ article, onDelete }: ArticleActionsProps) {
  return (
    <ArticleMeta author={article.author} date={article.createdAt}>
      {article.permissions.update ? (
        <>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${encodeURIComponent(article.slug)}`}>
            <i className="ion-edit" /> Edit Article
          </Link>
          {article.permissions.delete ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                if (window.confirm("Delete this article?")) onDelete();
              }}
            >
              <i className="ion-trash-a" /> Delete Article
            </button>
          ) : null}
        </>
      ) : (
        <FollowButton
          username={article.author.username}
          following={article.author.following}
          canFollow={article.author.permissions.follow}
        />
      )}
      <FavoriteButton
        slug={article.slug}
        favorited={article.favorited}
        favoritesCount={article.favoritesCount}
        canFavorite={article.permissions.favorite}
        variant="detail"
      />
    </ArticleMeta>
  );
}
