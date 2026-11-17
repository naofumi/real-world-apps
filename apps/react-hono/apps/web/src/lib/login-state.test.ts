import { describe, expect, test } from "vitest";
import { loginLocationState, loginRedirectPath } from "./login-state.js";

describe("loginLocationState", () => {
  test("joins pathname and search into from", () => {
    expect(loginLocationState("/article/demo", "?foo=1")).toEqual({ from: "/article/demo?foo=1" });
  });

  test("omits search when absent", () => {
    expect(loginLocationState("/editor")).toEqual({ from: "/editor" });
  });
});

describe("loginRedirectPath", () => {
  test("reads a valid from string", () => {
    expect(loginRedirectPath({ from: "/settings" })).toBe("/settings");
  });

  test("defaults when state is missing or malformed", () => {
    expect(loginRedirectPath(null)).toBe("/");
    expect(loginRedirectPath(undefined)).toBe("/");
    expect(loginRedirectPath({})).toBe("/");
    expect(loginRedirectPath({ from: "" })).toBe("/");
    expect(loginRedirectPath({ from: 1 })).toBe("/");
  });
});
