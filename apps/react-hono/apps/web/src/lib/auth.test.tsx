import type { User } from "@conduit/contracts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError, getToken, setToken } from "./api.js";
import { authSnapshotFromQuery, useAuth, useCurrentUser } from "./auth.js";
import { api } from "./client.js";

vi.mock("./client.js", () => ({
  api: {
    currentUser: vi.fn(),
  },
}));

const demo: User = {
  email: "demo@realworld.local",
  token: "token",
  username: "demo",
  bio: null,
  image: null,
};

function renderCurrentUser() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCurrentUser(), { wrapper });
}

function renderAuth() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAuth(), { wrapper });
}

describe("authSnapshotFromQuery", () => {
  test("couples authenticated with a user and other states with null", () => {
    expect(authSnapshotFromQuery({ isPending: true, isError: false, data: undefined })).toEqual({
      state: "loading",
      user: null,
    });
    expect(authSnapshotFromQuery({ isPending: false, isError: true, data: undefined })).toEqual({
      state: "unavailable",
      user: null,
    });
    expect(authSnapshotFromQuery({ isPending: false, isError: false, data: null })).toEqual({
      state: "unauthenticated",
      user: null,
    });
    expect(authSnapshotFromQuery({ isPending: false, isError: false, data: demo })).toEqual({
      state: "authenticated",
      user: demo,
    });
  });
});

describe("useCurrentUser", () => {
  beforeEach(() => {
    setToken(null);
    vi.mocked(api.currentUser).mockReset();
  });

  test("a 401 clears the token and becomes unauthenticated", async () => {
    setToken("stale");
    vi.mocked(api.currentUser).mockRejectedValue(new ApiError(401, { token: ["is invalid"] }));
    renderCurrentUser();

    await waitFor(() => expect(window.__conduit_debug__?.getSnapshot().state).toBe("unauthenticated"));
    expect(window.__conduit_debug__?.getSnapshot().user).toBeNull();
    expect(getToken()).toBeNull();
  });

  test("any other failure keeps the token and becomes unavailable", async () => {
    setToken("still-good");
    vi.mocked(api.currentUser).mockRejectedValue(new ApiError(500, { server: ["internal error"] }));
    renderCurrentUser();

    await waitFor(() => expect(window.__conduit_debug__?.getSnapshot().state).toBe("unavailable"));
    expect(window.__conduit_debug__?.getSnapshot().user).toBeNull();
    expect(getToken()).toBe("still-good");
  });
});

describe("useAuth", () => {
  beforeEach(() => {
    setToken(null);
    vi.mocked(api.currentUser).mockReset();
  });

  test("exposes the coupled snapshot instead of independent query flags", async () => {
    setToken("token");
    vi.mocked(api.currentUser).mockResolvedValue({ user: demo });
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.state).toBe("authenticated"));
    expect(result.current).toEqual({ state: "authenticated", user: demo });
  });
});
