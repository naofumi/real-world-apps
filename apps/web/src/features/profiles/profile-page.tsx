import { useQuery } from "@tanstack/react-query";
import { Link, useMatch, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "../../lib/api.js";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { avatar, useDocumentTitle } from "../../lib/format.js";
import { ArticleList } from "../articles/article-list.js";
import { Pagination } from "../shell/pagination.js";
import { FollowButton } from "./follow-button.js";

const PAGE_SIZE = 10;

export function ProfilePage() {
  const { username = "" } = useParams();
  const favorited = Boolean(useMatch("/profile/:username/favorites"));
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const me = useCurrentUser();
  const profile = useQuery({
    queryKey: ["profile", username],
    queryFn: () => api.profile(username),
  });
  const articles = useQuery({
    queryKey: ["articles", { profile: username, favorited, page }],
    queryFn: () =>
      api.listArticles({
        author: favorited ? undefined : username,
        favorited: favorited ? username : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
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
  const owned = me.data?.username === person.username;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    const path = favorited ? `/profile/${encodeURIComponent(username)}/favorites` : `/profile/${encodeURIComponent(username)}`;
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
              {owned ? (
                <Link className="btn btn-sm btn-outline-secondary action-btn" to="/settings">
                  <i className="ion-gear-a" /> Edit Profile Settings
                </Link>
              ) : (
                <FollowButton username={person.username} following={person.following} />
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
                  <Link className={`nav-link${favorited ? "" : " active"}`} to={`/profile/${encodeURIComponent(username)}`}>
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link${favorited ? " active" : ""}`}
                    to={`/profile/${encodeURIComponent(username)}/favorites`}
                  >
                    Favorited Articles
                  </Link>
                </li>
              </ul>
            </div>
            <ArticleList articles={articles.data?.articles} isLoading={articles.isLoading} isError={articles.isError} />
            <Pagination page={page} total={articles.data?.articlesCount ?? 0} limit={PAGE_SIZE} hrefFor={hrefFor} />
          </div>
        </div>
      </div>
    </div>
  );
}
