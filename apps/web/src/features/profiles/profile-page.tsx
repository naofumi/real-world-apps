import { useQuery } from "@tanstack/react-query";
import { Link, useMatch, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../../lib/api.js";
import { api, type ListParams } from "../../lib/client.js";
import { avatar, useDocumentTitle } from "../../lib/format.js";
import { ArticleList, articleListProps } from "../articles/article-list.js";
import { Pagination } from "../shell/pagination.js";
import { FollowButton } from "./follow-button.js";

const PAGE_SIZE = 10;

type ProfileArticlesTab =
  | { tab: "authored"; username: string }
  | { tab: "favorited"; username: string };

function profileArticlesTab(username: string, favoritedRoute: boolean): ProfileArticlesTab {
  if (favoritedRoute) {
    return { tab: "favorited", username };
  }
  return { tab: "authored", username };
}

function listParamsFor(tab: ProfileArticlesTab, page: number): ListParams {
  const paging = { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE };
  switch (tab.tab) {
    case "authored":
      return { author: tab.username, ...paging };
    case "favorited":
      return { favorited: tab.username, ...paging };
  }
}

function profileArticlesPath(tab: ProfileArticlesTab): string {
  const base = `/profile/${encodeURIComponent(tab.username)}`;
  return tab.tab === "favorited" ? `${base}/favorites` : base;
}

export function ProfilePage() {
  const { username = "" } = useParams();
  const favoritedRoute = Boolean(useMatch("/profile/:username/favorites"));
  const tab = profileArticlesTab(username, favoritedRoute);
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.profile(username),
  });
  const articles = useQuery({
    queryKey: ["articles", { ...tab, page }],
    queryFn: () => api.listArticles(listParamsFor(tab, page)),
    enabled: profile.isSuccess,
  });
  useDocumentTitle(profile.data?.profile.username ?? "Profile");

  if (profile.isLoading) return <div className="profile-page container page">Loading...</div>;
  if (profile.isError) {
    const missing = profile.error instanceof ApiError && profile.error.status === 404;
    return <div className="profile-page container page">{missing ? "Profile not found." : "Could not load this profile."}</div>;
  }
  const person = profile.data?.profile;
  if (!person) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    const path = profileArticlesPath(tab);
    return query ? `${path}?${query}` : path;
  }

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img className="user-img" src={avatar(person.image)} alt="" />
              <h4>{person.username}</h4>
              <p>{person.bio}</p>
              {person.permissions.update ? (
                <Link className="btn btn-sm btn-outline-secondary action-btn" to="/settings">
                  <i className="ion-gear-a" /> Edit Profile Settings
                </Link>
              ) : (
                <FollowButton
                  username={person.username}
                  following={person.following}
                  canFollow={person.permissions.follow}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <Link
                    className={`nav-link${tab.tab === "authored" ? " active" : ""}`}
                    to={`/profile/${encodeURIComponent(username)}`}
                  >
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link${tab.tab === "favorited" ? " active" : ""}`}
                    to={`/profile/${encodeURIComponent(username)}/favorites`}
                  >
                    Favorited Articles
                  </Link>
                </li>
              </ul>
            </div>
            <ArticleList {...articleListProps(articles)} />
            <Pagination page={page} total={articles.data?.articlesCount ?? 0} limit={PAGE_SIZE} hrefFor={hrefFor} />
          </div>
        </div>
      </div>
    </div>
  );
}
