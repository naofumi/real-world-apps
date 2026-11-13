import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { useDocumentTitle } from "../../lib/format.js";
import { ArticleList } from "../articles/article-list.js";
import { Pagination } from "../shell/pagination.js";

const PAGE_SIZE = 10;

type FeedMode =
  | { kind: "global" }
  | { kind: "following" }
  | { kind: "tag"; tag: string };

function pageNumber(value: string | null): number {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function feedMode(tag: string | undefined, searchParams: URLSearchParams): FeedMode {
  if (tag) {
    return { kind: "tag", tag };
  } else if (searchParams.get("feed") === "following") {
    return { kind: "following" };
  } else {
    return { kind: "global" };
  }
}

export function HomePage() {
  const { tag } = useParams();
  const [searchParams] = useSearchParams();
  const me = useCurrentUser();
  const mode = feedMode(tag, searchParams);
  const page = pageNumber(searchParams.get("page"));
  useDocumentTitle(mode.kind === "tag" ? `#${mode.tag}` : "Home");

  const articles = useQuery({
    queryKey: ["articles", { mode, page }],
    enabled: mode.kind !== "following" || Boolean(me.data),
    queryFn: () => {
      const paging = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
      switch (mode.kind) {
        case "following":
          return api.feed(paging);
        case "tag":
          return api.listArticles({ tag: mode.tag, ...paging });
        case "global":
          return api.listArticles(paging);
      }
    },
  });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => api.tags() });

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    const path = mode.kind === "tag" ? `/tag/${encodeURIComponent(mode.tag)}` : "/";
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
                    <Link className={`nav-link${mode.kind === "following" ? " active" : ""}`} to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                ) : null}
                <li className="nav-item">
                  <Link className={`nav-link${mode.kind === "global" ? " active" : ""}`} to="/">
                    Global Feed
                  </Link>
                </li>
                {mode.kind === "tag" ? (
                  <li className="nav-item">
                    <Link className="nav-link active" to={`/tag/${encodeURIComponent(mode.tag)}`}>
                      #{mode.tag}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
            {mode.kind === "following" && !me.isPending && !me.data ? (
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
