import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../lib/api.js";
import { useCurrentUser } from "../../lib/auth.js";
import { api } from "../../lib/client.js";
import { useDocumentTitle } from "../../lib/format.js";
import { ErrorList } from "../shell/error-list.js";

type Draft = {
  title: string;
  description: string;
  body: string;
  tagList: string[];
};

export function EditorPage() {
  const { slug } = useParams();
  const me = useCurrentUser();
  const article = useQuery({
    queryKey: ["article", slug],
    queryFn: () => api.article(slug!),
    enabled: Boolean(slug),
  });
  useDocumentTitle(slug ? "Edit Article" : "New Article");

  if (slug && article.isLoading) return <div className="editor-page container page">Loading...</div>;
  if (slug && article.isError) {
    const missing = article.error instanceof ApiError && article.error.status === 404;
    return <div className="editor-page container page">{missing ? "Article not found." : "Could not load the article."}</div>;
  }

  if (slug && article.data && me.data && article.data.article.author.username !== me.data.username) {
    return <div className="editor-page container page">You can only edit your own articles.</div>;
  }

  const initial: Draft = article.data
    ? {
        title: article.data.article.title,
        description: article.data.article.description,
        body: article.data.article.body,
        tagList: article.data.article.tagList,
      }
    : { title: "", description: "", body: "", tagList: [] };

  return <EditorForm key={slug ?? "new"} slug={slug} initial={initial} />;
}

function EditorForm({ slug, initial }: { slug?: string; initial: Draft }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [body, setBody] = useState(initial.body);
  const [tagList, setTagList] = useState(initial.tagList);
  const [draftTag, setDraftTag] = useState("");
  const mutation = useMutation({
    mutationFn: () => {
      const input = { title, description, body, tagList };
      return slug ? api.updateArticle(slug, input) : api.createArticle(input);
    },
    onSuccess: ({ article }) => navigate(`/article/${encodeURIComponent(article.slug)}`),
  });

  function addTag() {
    const name = draftTag.trim();
    if (!name || tagList.includes(name)) {
      setDraftTag("");
      return;
    }
    setTagList([...tagList, name]);
    setDraftTag("");
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addTag();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="editor-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-xs-12">
            <ErrorList error={mutation.error} />
            <form onSubmit={onSubmit}>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="title"
                    placeholder="Article Title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    name="description"
                    placeholder="What's this article about?"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control"
                    name="body"
                    rows={8}
                    placeholder="Write your article (in markdown)"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter tags"
                    value={draftTag}
                    onChange={(event) => setDraftTag(event.target.value)}
                    onKeyDown={onTagKeyDown}
                  />
                  <div className="tag-list">
                    {tagList.map((tag) => (
                      <span className="tag-default tag-pill" key={tag}>
                        <i
                          className="ion-close-round"
                          role="button"
                          aria-label={`Remove ${tag}`}
                          onClick={() => setTagList(tagList.filter((item) => item !== tag))}
                        />
                        {tag}
                      </span>
                    ))}
                  </div>
                </fieldset>
                <button className="btn btn-lg pull-xs-right btn-primary" type="submit" disabled={mutation.isPending}>
                  Publish Article
                </button>
              </fieldset>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
