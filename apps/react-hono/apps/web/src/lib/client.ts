import type {
  Article,
  ArticleCard,
  Comment,
  Profile,
  User,
} from "@conduit/contracts";
import { requestJson, requestNoContent } from "./api.js";

export type ArticleList = {
  articles: ArticleCard[];
  articlesCount: number;
};

export type ListParams = {
  tag?: string;
  author?: string;
  favorited?: string;
  limit: number;
  offset: number;
};

function queryString(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.tag) search.set("tag", params.tag);
  if (params.author) search.set("author", params.author);
  if (params.favorited) search.set("favorited", params.favorited);
  search.set("limit", String(params.limit));
  search.set("offset", String(params.offset));
  return search.toString();
}

export const api = {
  register(input: { username: string; email: string; password: string }) {
    return requestJson<{ user: User }>("/api/users", { method: "POST", body: JSON.stringify({ user: input }) });
  },
  login(input: { email: string; password: string }) {
    return requestJson<{ user: User }>("/api/users/login", { method: "POST", body: JSON.stringify({ user: input }) });
  },
  currentUser() {
    return requestJson<{ user: User }>("/api/user");
  },
  updateUser(input: { email?: string; username?: string; password?: string; bio?: string; image?: string }) {
    return requestJson<{ user: User }>("/api/user", { method: "PUT", body: JSON.stringify({ user: input }) });
  },
  profile(username: string) {
    return requestJson<{ profile: Profile }>(`/api/profiles/${encodeURIComponent(username)}`);
  },
  follow(username: string) {
    return requestJson<{ profile: Profile }>(`/api/profiles/${encodeURIComponent(username)}/follow`, { method: "POST" });
  },
  unfollow(username: string) {
    return requestJson<{ profile: Profile }>(`/api/profiles/${encodeURIComponent(username)}/follow`, { method: "DELETE" });
  },
  listArticles(params: ListParams) {
    return requestJson<ArticleList>(`/api/articles?${queryString(params)}`);
  },
  feed(params: Pick<ListParams, "limit" | "offset">) {
    return requestJson<ArticleList>(`/api/articles/feed?limit=${params.limit}&offset=${params.offset}`);
  },
  article(slug: string) {
    return requestJson<{ article: Article }>(`/api/articles/${encodeURIComponent(slug)}`);
  },
  createArticle(input: { title: string; description: string; body: string; tagList: string[] }) {
    return requestJson<{ article: Article }>("/api/articles", { method: "POST", body: JSON.stringify({ article: input }) });
  },
  updateArticle(slug: string, input: { title: string; description: string; body: string; tagList: string[] }) {
    return requestJson<{ article: Article }>(`/api/articles/${encodeURIComponent(slug)}`, {
      method: "PUT",
      body: JSON.stringify({ article: input }),
    });
  },
  deleteArticle(slug: string) {
    return requestNoContent(`/api/articles/${encodeURIComponent(slug)}`, { method: "DELETE" });
  },
  favorite(slug: string) {
    return requestJson<{ article: Article }>(`/api/articles/${encodeURIComponent(slug)}/favorite`, { method: "POST" });
  },
  unfavorite(slug: string) {
    return requestJson<{ article: Article }>(`/api/articles/${encodeURIComponent(slug)}/favorite`, { method: "DELETE" });
  },
  comments(slug: string) {
    return requestJson<{ comments: Comment[] }>(`/api/articles/${encodeURIComponent(slug)}/comments`);
  },
  createComment(slug: string, body: string) {
    return requestJson<{ comment: Comment }>(`/api/articles/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment: { body } }),
    });
  },
  deleteComment(slug: string, id: number) {
    return requestNoContent(`/api/articles/${encodeURIComponent(slug)}/comments/${id}`, { method: "DELETE" });
  },
  tags() {
    return requestJson<{ tags: string[] }>("/api/tags");
  },
};
