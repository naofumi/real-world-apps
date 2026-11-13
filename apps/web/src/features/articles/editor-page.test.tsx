import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { setToken } from "../../lib/api.js";
import { api } from "../../lib/client.js";
import { EditorPage } from "./editor-page.js";

vi.mock("../../lib/client.js", () => ({
  api: {
    currentUser: vi.fn(),
    article: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
  },
}));

const demoUser = {
  email: "demo@realworld.local",
  token: "token",
  username: "demo",
  bio: null,
  image: null,
};

const ownedArticle = {
  article: {
    slug: "demo-post",
    title: "Demo Post",
    description: "About demo",
    body: "Body text",
    tagList: ["react"],
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    favorited: false,
    favoritesCount: 0,
    author: { username: "demo", bio: null, image: null, following: false },
  },
};

const otherArticle = {
  article: {
    ...ownedArticle.article,
    slug: "other-post",
    title: "Other Post",
    author: { username: "other", bio: null, image: null, following: false },
  },
};

function renderEditor(entry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/editor" element={children} />
          <Route path="/editor/:slug" element={children} />
          <Route path="/article/:slug" element={<div>article</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  render(<EditorPage />, { wrapper });
  return queryClient;
}

describe("EditorPage create vs edit", () => {
  beforeEach(() => {
    setToken("token");
    vi.mocked(api.currentUser).mockResolvedValue({ user: demoUser });
    vi.mocked(api.article).mockReset();
    vi.mocked(api.createArticle).mockReset();
    vi.mocked(api.updateArticle).mockReset();
    vi.mocked(api.createArticle).mockResolvedValue(ownedArticle);
    vi.mocked(api.updateArticle).mockResolvedValue(ownedArticle);
  });

  test("new editor publishes with createArticle and never loads an article", async () => {
    const user = userEvent.setup();
    renderEditor("/editor");

    await waitFor(() => expect(screen.getByPlaceholderText("Article Title")).toBeTruthy());
    expect(api.article).not.toHaveBeenCalled();

    await user.type(screen.getByPlaceholderText("Article Title"), "Demo Post");
    await user.type(screen.getByPlaceholderText("What's this article about?"), "About demo");
    await user.type(screen.getByPlaceholderText("Write your article (in markdown)"), "Body text");
    await user.click(screen.getByRole("button", { name: "Publish Article" }));

    await waitFor(() => expect(api.createArticle).toHaveBeenCalledTimes(1));
    expect(api.updateArticle).not.toHaveBeenCalled();
    expect(api.createArticle).toHaveBeenCalledWith({
      title: "Demo Post",
      description: "About demo",
      body: "Body text",
      tagList: [],
    });
  });

  test("edit editor loads the article and publishes with updateArticle", async () => {
    vi.mocked(api.article).mockResolvedValue(ownedArticle);
    const user = userEvent.setup();
    renderEditor("/editor/demo-post");

    await waitFor(() => expect(screen.getByDisplayValue("Demo Post")).toBeTruthy());
    expect(api.article).toHaveBeenCalledWith("demo-post");

    await user.clear(screen.getByDisplayValue("Demo Post"));
    await user.type(screen.getByPlaceholderText("Article Title"), "Demo Post Edited");
    await user.click(screen.getByRole("button", { name: "Publish Article" }));

    await waitFor(() => expect(api.updateArticle).toHaveBeenCalledTimes(1));
    expect(api.createArticle).not.toHaveBeenCalled();
    expect(api.updateArticle).toHaveBeenCalledWith(
      "demo-post",
      expect.objectContaining({ title: "Demo Post Edited" }),
    );
  });

  test("edit editor refuses another author's article", async () => {
    vi.mocked(api.article).mockResolvedValue(otherArticle);
    renderEditor("/editor/other-post");

    await waitFor(() => expect(screen.getByText("You can only edit your own articles.")).toBeTruthy());
    expect(screen.queryByPlaceholderText("Article Title")).toBeNull();
    expect(api.createArticle).not.toHaveBeenCalled();
    expect(api.updateArticle).not.toHaveBeenCalled();
  });
});
