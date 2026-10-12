import type { ArticleCard } from "@conduit/contracts";
import { Link } from "react-router-dom";
import { ArticleMeta } from "./article-meta.js";
import { FavoriteButton } from "./favorite-button.js";

export function ArticlePreview({ article }: { article: ArticleCard }) {
  return (
    <div className="article-preview">
      <ArticleMeta author={article.author} date={article.createdAt}>
        <FavoriteButton slug={article.slug} favorited={article.favorited} count={article.favoritesCount} variant="preview" />
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

export function ArticleList({
  articles,
  isLoading,
  isError,
}: {
  articles: ArticleCard[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) return <div className="article-preview">Loading articles...</div>;
  if (isError) return <div className="article-preview">Could not load articles.</div>;
  if (!articles || articles.length === 0) {
    return <div className="article-preview empty-feed-message">No articles are here... yet.</div>;
  }
  return articles.map((article) => <ArticlePreview key={article.slug} article={article} />);
}
