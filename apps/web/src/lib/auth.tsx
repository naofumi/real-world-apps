import type { User } from "@conduit/contracts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, getToken, setToken } from "./api.js";
import { api } from "./client.js";

type AuthState = "authenticated" | "unauthenticated" | "unavailable" | "loading";

type AuthSnapshot =
  | { state: "loading" | "unauthenticated" | "unavailable"; user: null }
  | { state: "authenticated"; user: User };

let snapshot: AuthSnapshot = {
  state: "loading",
  user: null,
};

window.__conduit_debug__ = {
  getToken,
  getAuthState: () => snapshot.state,
  getCurrentUser: () => snapshot.user,
};

declare global {
  interface Window {
    __conduit_debug__?: {
      getToken: () => string | null;
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
    if (query.isPending) snapshot = { state: "loading", user: null };
    else if (query.isError) snapshot = { state: "unavailable", user: null };
    else if (query.data) snapshot = { state: "authenticated", user: query.data };
    else snapshot = { state: "unauthenticated", user: null };
  }, [query.isPending, query.isError, query.data]);

  return query;
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

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    // Leave protected routes before clearing the session. Otherwise
    // RequireAuth sends the user to /login as soon as `me` becomes null.
    navigate("/", { replace: true });
    queueMicrotask(() => {
      setToken(null);
      snapshot = { state: "unauthenticated", user: null };
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
    });
  };
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const me = useCurrentUser();
  if (me.isPending) return <div className="container page">Loading...</div>;
  if (!me.data) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return children;
}
