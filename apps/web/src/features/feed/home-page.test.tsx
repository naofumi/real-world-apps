import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { setToken } from "../../lib/api.js";
import { api } from "../../lib/client.js";
import { HomePage } from "./home-page.js";

vi.mock("../../lib/client.js", () => ({
  api: {
    currentUser: vi.fn(),
    listArticles: vi.fn(),
    feed: vi.fn(),
    tags: vi.fn(),
  },
}));

function renderHome(entry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={children} />
          <Route path="/tag/:tag" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  render(<HomePage />, { wrapper });
  return queryClient;
}

describe("HomePage query key", () => {
  beforeEach(() => {
    setToken(null);
    vi.mocked(api.tags).mockResolvedValue({ tags: [] });
    vi.mocked(api.listArticles).mockResolvedValue({ articles: [], articlesCount: 0 });
    vi.mocked(api.feed).mockResolvedValue({ articles: [], articlesCount: 0 });
    vi.mocked(api.currentUser).mockResolvedValue({
      user: { email: "demo@realworld.local", token: "token", username: "demo", bio: null, image: null },
    });
  });

  test("a tag page does not share the global feed's cache entry", async () => {
    const queryClient = renderHome("/tag/react?page=2");

    await waitFor(() => expect(api.listArticles).toHaveBeenCalled());
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["articles", { tag: "react", feed: false, page: 2 }] })).toBeTruthy();
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["articles", { tag: null, feed: false, page: 1 }] })).toBeUndefined();
  });

  test("your feed has its own cache entry", async () => {
    setToken("token");
    const queryClient = renderHome("/?feed=following");

    await waitFor(() => expect(api.feed).toHaveBeenCalled());
    expect(queryClient.getQueryCache().find({ exact: true, queryKey: ["articles", { tag: null, feed: true, page: 1 }] })).toBeTruthy();
  });
});
