export type ProfilePermissions = {
  follow: boolean;
  update: boolean;
};

export type ArticlePermissions = {
  update: boolean;
  delete: boolean;
  favorite: boolean;
};

export type CommentPermissions = {
  delete: boolean;
};

export type Profile = {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
  permissions: ProfilePermissions;
};

export type User = {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
  permissions: ArticlePermissions;
};

export type ArticleCard = Omit<Article, "body">;

export type Comment = {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Profile;
  permissions: CommentPermissions;
};

export type FieldErrors = Record<string, string[]>;
