import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { ApiError } from "../../lib/api.js";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { avatar, useDocumentTitle } from "../../lib/format.js";
import { ArticleMeta } from "./article-meta.js";
import { FavoriteButton } from "./favorite-button.js";
import { FollowButton } from "../profiles/follow-button.js";
import { ErrorList } from "../shell/error-list.js";

export function ArticlePage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const articleQuery = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.article(slug),
  });
  const comments = useQuery({
    queryKey: ["comments", slug],
    queryFn: () => api.comments(slug),
    enabled: articleQuery.isSuccess,
  });
  const article = articleQuery.data?.article;
  useDocumentTitle(article?.title ?? "Article");

  const remove = useMutation({
    mutationFn: () => api.deleteArticle(slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/");
    },
  });

  if (articleQuery.isLoading) return <div className="article-page container page">Loading...</div>;
  if (articleQuery.isError) {
    const missing = articleQuery.error instanceof ApiError && articleQuery.error.status === 404;
    return <div className="article-page container page">{missing ? "Article not found." : "Could not load the article."}</div>;
  }
  if (!article) return null;

  const owned = me.data?.username === article.author.username;

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta author={article.author} date={article.createdAt}>
            {owned ? (
              <>
                <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${encodeURIComponent(article.slug)}`}>
                  <i className="ion-edit" /> Edit Article
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (window.confirm("Delete this article?")) remove.mutate();
                  }}
                >
                  <i className="ion-trash-a" /> Delete Article
                </button>
              </>
            ) : (
              <FollowButton username={article.author.username} following={article.author.following} />
            )}
            <FavoriteButton slug={article.slug} favorited={article.favorited} count={article.favoritesCount} variant="detail" />
          </ArticleMeta>
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <Markdown>{article.body}</Markdown>
            <ul className="tag-list">
              {article.tagList.map((tag) => (
                <li key={tag} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <hr />
        <div className="article-actions">
          <ArticleMeta author={article.author} date={article.createdAt}>
            {owned ? (
              <>
                <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${encodeURIComponent(article.slug)}`}>
                  <i className="ion-edit" /> Edit Article
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    if (window.confirm("Delete this article?")) remove.mutate();
                  }}
                >
                  <i className="ion-trash-a" /> Delete Article
                </button>
              </>
            ) : (
              <FollowButton username={article.author.username} following={article.author.following} />
            )}
            <FavoriteButton slug={article.slug} favorited={article.favorited} count={article.favoritesCount} variant="detail" />
          </ArticleMeta>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            {me.data ? (
              <CommentForm slug={slug} image={me.data.image} />
            ) : (
              <p>
                <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add comments on this article.
              </p>
            )}
            <ErrorList error={remove.error} />
            {comments.data?.comments.map((comment) => (
              <div className="card" key={comment.id}>
                <div className="card-block">
                  <p className="card-text">{comment.body}</p>
                </div>
                <div className="card-footer">
                  <Link className="comment-author" to={`/profile/${encodeURIComponent(comment.author.username)}`}>
                    <img className="comment-author-img" src={avatar(comment.author.image)} alt="" />
                  </Link>
                  &nbsp;
                  <Link className="comment-author" to={`/profile/${encodeURIComponent(comment.author.username)}`}>
                    {comment.author.username}
                  </Link>
                  <span className="date-posted">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  {me.data?.username === comment.author.username ? (
                    <DeleteComment slug={slug} id={comment.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentForm({ slug, image }: { slug: string; image: string | null }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.createComment(slug, body),
    onSuccess: async () => {
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["comments", slug] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <>
      <ErrorList error={mutation.error} />
      <form className="card comment-form" onSubmit={onSubmit}>
        <div className="card-block">
          <textarea
            className="form-control"
            placeholder="Write a comment..."
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        <div className="card-footer">
          <img className="comment-author-img" src={avatar(image)} alt="" />
          <button className="btn btn-sm btn-primary" type="submit" disabled={mutation.isPending}>
            Post Comment
          </button>
        </div>
      </form>
    </>
  );
}

function DeleteComment({ slug, id }: { slug: string; id: number }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.deleteComment(slug, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", slug] }),
  });
  return (
    <span className="mod-options">
      <i className="ion-trash-a" role="button" aria-label="Delete comment" onClick={() => mutation.mutate()} />
    </span>
  );
}
