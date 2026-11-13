import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import type { ArticleCard } from "@conduit/contracts";
import { ArticleList } from "./article-list.js";

function renderList(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const sample: ArticleCard = {
  slug: "demo",
  title: "Demo",
  description: "About",
  tagList: [],
  createdAt: "2020-01-01T00:00:00.000Z",
  updatedAt: "2020-01-01T00:00:00.000Z",
  favorited: false,
  favoritesCount: 0,
  author: { username: "demo", bio: null, image: null, following: false },
};

describe("ArticleList", () => {
  test("shows loading copy while loading", () => {
    render(<ArticleList status="loading" />);
    expect(screen.getByText("Loading articles...")).toBeTruthy();
  });

  test("shows error copy on error", () => {
    render(<ArticleList status="error" />);
    expect(screen.getByText("Could not load articles.")).toBeTruthy();
  });

  test("shows empty copy for a successful empty list", () => {
    render(<ArticleList status="success" articles={[]} />);
    expect(screen.getByText("No articles are here... yet.")).toBeTruthy();
  });

  test("renders article titles for a successful list", () => {
    renderList(<ArticleList status="success" articles={[sample]} />);
    expect(screen.getByText("Demo")).toBeTruthy();
  });
});
