import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ApiError } from "../../lib/api.js";
import { ErrorList } from "./error-list.js";

describe("ErrorList", () => {
  test("prints each field message from an API error", () => {
    render(<ErrorList error={new ApiError(422, { username: ["can't be blank"] })} />);
    expect(screen.getByText("username can't be blank")).toBeTruthy();
  });

  test("uses a generic line for anything else", () => {
    render(<ErrorList error={new Error("socket hang up")} />);
    expect(screen.getByText("Something went wrong. Try again.")).toBeTruthy();
  });
});
