import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError, getToken, setToken } from "./api.js";
import { useCurrentUser } from "./auth.js";
import { api } from "./client.js";

vi.mock("./client.js", () => ({
  api: {
    currentUser: vi.fn(),
  },
}));

function renderCurrentUser() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useCurrentUser(), { wrapper });
}

describe("useCurrentUser", () => {
  beforeEach(() => {
    setToken(null);
    vi.mocked(api.currentUser).mockReset();
  });

  test("a 401 clears the token and becomes unauthenticated", async () => {
    setToken("stale");
    vi.mocked(api.currentUser).mockRejectedValue(new ApiError(401, { token: ["is invalid"] }));
    renderCurrentUser();

    await waitFor(() => expect(window.__conduit_debug__?.getAuthState()).toBe("unauthenticated"));
    expect(getToken()).toBeNull();
  });

  test("any other failure keeps the token and becomes unavailable", async () => {
    setToken("still-good");
    vi.mocked(api.currentUser).mockRejectedValue(new ApiError(500, { server: ["internal error"] }));
    renderCurrentUser();

    await waitFor(() => expect(window.__conduit_debug__?.getAuthState()).toBe("unavailable"));
    expect(getToken()).toBe("still-good");
  });
});
