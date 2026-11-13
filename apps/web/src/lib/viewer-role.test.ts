import { describe, expect, test } from "vitest";
import type { AuthSnapshot } from "./auth.js";
import { followState, viewerRole } from "./viewer-role.js";

const user = {
  email: "jake@jake.jake",
  token: "token",
  username: "jake",
  bio: null,
  image: null,
};

const authenticated: AuthSnapshot = { state: "authenticated", user };
const guest: AuthSnapshot = { state: "unauthenticated", user: null };
const loading: AuthSnapshot = { state: "loading", user: null };

describe("viewerRole", () => {
  test("marks the subject as owner when usernames match", () => {
    expect(viewerRole(authenticated, "jake", true)).toEqual({ kind: "owner" });
  });

  test("keeps following only for other authenticated members", () => {
    expect(viewerRole(authenticated, "celeb", true)).toEqual({ kind: "member", following: true });
    expect(viewerRole(authenticated, "celeb", false)).toEqual({ kind: "member", following: false });
  });

  test("treats loading and unauthenticated viewers as guests", () => {
    expect(viewerRole(guest, "jake", false)).toEqual({ kind: "guest" });
    expect(viewerRole(loading, "jake", true)).toEqual({ kind: "guest" });
  });
});

describe("followState", () => {
  test("reads following from members and defaults others to false", () => {
    expect(followState({ kind: "member", following: true })).toBe(true);
    expect(followState({ kind: "owner" })).toBe(false);
    expect(followState({ kind: "guest" })).toBe(false);
  });
});
