import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { setToken } from "../../lib/api.js";
import { api } from "../../lib/client.js";
import { ProfilePage } from "./profile-page.js";

vi.mock("../../lib/client.js", () => ({
  api: {
    currentUser: vi.fn(),
    profile: vi.fn(),
    listArticles: vi.fn(),
  },
}));

function renderProfile(entry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/profile/:username" element={children} />
          <Route path="/profile/:username/favorites" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  render(<ProfilePage />, { wrapper });
  return queryClient;
}

describe("ProfilePage articles query key", () => {
  beforeEach(() => {
    setToken(null);
    vi.mocked(api.currentUser).mockResolvedValue({
      user: { email: "demo@realworld.local", token: "token", username: "demo", bio: null, image: null },
    });
    vi.mocked(api.profile).mockResolvedValue({
      profile: {
        username: "demo",
        bio: null,
        image: null,
        following: false,
        permissions: { follow: false, update: true },
      },
    });
    vi.mocked(api.listArticles).mockResolvedValue({ articles: [], articlesCount: 0 });
  });

  test("authored articles do not share the favorited cache entry", async () => {
    const queryClient = renderProfile("/profile/demo?page=2");

    await waitFor(() => expect(api.listArticles).toHaveBeenCalled());
    expect(api.listArticles).toHaveBeenCalledWith({
      author: "demo",
      limit: 10,
      offset: 10,
    });
    expect(
      queryClient.getQueryCache().find({
        exact: true,
        queryKey: ["articles", { tab: "authored", username: "demo", page: 2 }],
      }),
    ).toBeTruthy();
    expect(
      queryClient.getQueryCache().find({
        exact: true,
        queryKey: ["articles", { tab: "favorited", username: "demo", page: 1 }],
      }),
    ).toBeUndefined();
  });

  test("favorited articles have their own cache entry", async () => {
    const queryClient = renderProfile("/profile/demo/favorites");

    await waitFor(() => expect(api.listArticles).toHaveBeenCalled());
    expect(api.listArticles).toHaveBeenCalledWith({
      favorited: "demo",
      limit: 10,
      offset: 0,
    });
    expect(
      queryClient.getQueryCache().find({
        exact: true,
        queryKey: ["articles", { tab: "favorited", username: "demo", page: 1 }],
      }),
    ).toBeTruthy();
  });
});
