import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { useDocumentTitle } from "../../lib/format.js";
import { ArticleList } from "../articles/article-list.js";
import { Pagination } from "../shell/pagination.js";

const PAGE_SIZE = 10;

function pageNumber(value: string | null): number {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function HomePage() {
  const { tag } = useParams();
  const [searchParams] = useSearchParams();
  const me = useCurrentUser();
  const feed = !tag && searchParams.get("feed") === "following";
  const page = pageNumber(searchParams.get("page"));
  useDocumentTitle(tag ? `#${tag}` : "Home");

  const articles = useQuery({
    queryKey: ["articles", { tag: tag ?? null, feed, page }],
    enabled: !feed || Boolean(me.data),
    queryFn: () =>
      feed
        ? api.feed({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
        : api.listArticles({
            tag,
            limit: PAGE_SIZE,
            offset: (page - 1) * PAGE_SIZE,
          }),
  });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api.tags() });

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    const path = tag ? `/tag/${encodeURIComponent(tag)}` : "/";
    return query ? `${path}?${query}` : path;
  }

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>
      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {me.data ? (
                  <li className="nav-item">
                    <Link className={`nav-link${feed ? " active" : ""}`} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                ) : null}
                <li className="nav-item">
                  <Link className={`nav-link${!feed && !tag ? " active" : ""}`} to="/">
                    Global Feed
                  </Link>
                </li>
                {tag ? (
                  <li className="nav-item">
                    <Link className="nav-link active" to={`/tag/${encodeURIComponent(tag)}`}>
                      #{tag}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
            {feed && !me.isPending && !me.data ? (
              <div className="article-preview">
                <Link to="/login">Sign in</Link> to see your feed.
              </div>
            ) : (
              <ArticleList articles={articles.data?.articles} isLoading={articles.isLoading} isError={articles.isError} />
            )}
            <Pagination page={page} total={articles.data?.articlesCount ?? 0} limit={PAGE_SIZE} hrefFor={hrefFor} />
          </div>
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              <div className="tag-list">
                {tags.isLoading ? <span>Loading tags...</span> : null}
                {tags.data?.tags.map((name) => (
                  <Link key={name} className="tag-pill tag-default" to={`/tag/${encodeURIComponent(name)}`}>
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
