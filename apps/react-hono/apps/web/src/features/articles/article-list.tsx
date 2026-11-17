import type { ArticleCard } from "@conduit/contracts";
import { Link } from "react-router-dom";
import { ArticleMeta } from "./article-meta.js";
import { FavoriteButton } from "./favorite-button.js";

export type ArticleListProps =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; articles: ArticleCard[] };

export function articleListProps(query: {
  isLoading: boolean;
  isError: boolean;
  data?: { articles: ArticleCard[] };
}): ArticleListProps {
  if (query.isLoading) return { status: "loading" };
  if (query.isError) return { status: "error" };
  return { status: "success", articles: query.data?.articles ?? [] };
}

export function ArticlePreview({ article }: { article: ArticleCard }) {
  return (
    <div className="article-preview">
      <ArticleMeta author={article.author} date={article.createdAt}>
        <FavoriteButton
          slug={article.slug}
          favorited={article.favorited}
          favoritesCount={article.favoritesCount}
          canFavorite={article.permissions.favorite}
          variant="preview"
        />
      </ArticleMeta>
      <Link className="preview-link" to={`/article/${encodeURIComponent(article.slug)}`}>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map((tag) => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}

export function ArticleList(props: ArticleListProps) {
  switch (props.status) {
    case "loading":
      return <div className="article-preview">Loading articles...</div>;
    case "error":
      return <div className="article-preview">Could not load articles.</div>;
    case "success":
      if (props.articles.length === 0) {
        return <div className="article-preview empty-feed-message">No articles are here... yet.</div>;
      }
      return props.articles.map((article) => <ArticlePreview key={article.slug} article={article} />);
  }
}
