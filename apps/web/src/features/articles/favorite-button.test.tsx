import type { Article, ArticleCard } from "@conduit/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ArticleList } from "../../lib/client.js";
import { api } from "../../lib/client.js";
import { FavoriteButton } from "./favorite-button.js";

vi.mock("../../lib/client.js", () => ({
  api: {
    favorite: vi.fn(),
    unfavorite: vi.fn(),
  },
}));

const author = {
  username: "demo",
  bio: null,
  image: null,
  following: false,
  permissions: { follow: false, update: true },
};

const returned: Article = {
  slug: "one",
  title: "One",
  description: "d",
  body: "b",
  tagList: [],
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
  favorited: true,
  favoritesCount: 1,
  author,
  permissions: { update: true, delete: true, favorite: true },
};

const card: ArticleCard = {
  slug: returned.slug,
  title: returned.title,
  description: returned.description,
  tagList: [],
  createdAt: returned.createdAt,
  updatedAt: returned.updatedAt,
  favorited: false,
  favoritesCount: 0,
  author,
  permissions: { update: true, delete: true, favorite: true },
};

describe("FavoriteButton", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(api.favorite).mockResolvedValue({ article: returned });
  });

  test("stores the article response under the article query key", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const listKey = ["articles", { tag: null, feed: false, page: 1 }] as const;
    queryClient.setQueryData<ArticleList>(listKey, { articles: [card], articlesCount: 1 });
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FavoriteButton slug="one" favorited={false} favoritesCount={0} canFavorite variant="detail" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Favorite Article/ }));

    await waitFor(() =>
      expect(queryClient.getQueryData<{ article: Article }>(["article", "one"])).toEqual({ article: returned }),
    );
    expect(queryClient.getQueryData<ArticleList>(listKey)?.articles[0]).toMatchObject({ favorited: true, favoritesCount: 1 });
  });

  test("sends guests to login when favorite is not allowed", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/article/one"]}>
          <FavoriteButton slug="one" favorited={false} favoritesCount={0} canFavorite={false} variant="detail" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Favorite Article/ }));
    expect(api.favorite).not.toHaveBeenCalled();
  });
});
