import type { User } from "@conduit/contracts";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, getToken, setToken } from "./api.js";
import { api } from "./client.js";
import { loginLocationState } from "./login-state.js";

export type AuthState = "authenticated" | "unauthenticated" | "unavailable" | "loading";

export type AuthSnapshot =
  | { state: "loading" | "unauthenticated" | "unavailable"; user: null }
  | { state: "authenticated"; user: User };

let snapshot: AuthSnapshot = {
  state: "loading",
  user: null,
};

export function authSnapshotFromQuery(query: {
  isPending: boolean;
  isError: boolean;
  data: User | null | undefined;
}): AuthSnapshot {
  if (query.isPending) return { state: "loading", user: null };
  if (query.isError) return { state: "unavailable", user: null };
  if (query.data) return { state: "authenticated", user: query.data };
  return { state: "unauthenticated", user: null };
}

window.__conduit_debug__ = {
  getToken,
  getSnapshot: () => snapshot,
  getAuthState: () => snapshot.state,
  getCurrentUser: () => snapshot.user,
};

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
      getSnapshot: () => AuthSnapshot;
      getAuthState: () => AuthState;
      getCurrentUser: () => User | null;
    };
  }
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["me"],
    retry: false,
    queryFn: async () => {
      if (!getToken()) return null;
      try {
        const { user } = await api.currentUser();
        setToken(user.token);
        return user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setToken(null);
          return null;
        }
        throw error;
      }
    },
  });

  useEffect(() => {
    snapshot = authSnapshotFromQuery(query);
  }, [query.isPending, query.isError, query.data]);

  return query;
}

export function useAuth(): AuthSnapshot {
  return authSnapshotFromQuery(useCurrentUser());
}

export function useRememberUser() {
  const queryClient = useQueryClient();
  return (user: User) => {
    setToken(user.token);
    snapshot = { state: "authenticated", user };
    queryClient.setQueryData(["me"], user);
    void queryClient.invalidateQueries({ queryKey: ["articles"] });
    void queryClient.invalidateQueries({ queryKey: ["article"] });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  };
}

function clearSessionAfterLeavingHome(queryClient: QueryClient) {
  setToken(null);
  snapshot = { state: "unauthenticated", user: null };
  queryClient.setQueryData(["me"], null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    navigate("/", { replace: true });
    queueMicrotask(() => clearSessionAfterLeavingHome(queryClient));
  };
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const auth = useAuth();
  if (auth.state === "loading") return <div className="container page">Loading...</div>;
  if (auth.state !== "authenticated") {
    return <Navigate to="/login" replace state={loginLocationState(location.pathname, location.search)} />;
  }
  return children;
}
