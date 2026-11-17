import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError, requestJson, requestNoContent, setToken } from "./api.js";

describe("requestJson and requestNoContent", () => {
  beforeEach(() => {
    setToken(null);
    vi.stubGlobal(
      "fetch",
      vi.fn(),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("requestJson returns parsed json on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ tags: ["react"] }), { status: 200, headers: { "content-type": "application/json" } }),
    );

    await expect(requestJson<{ tags: string[] }>("/api/tags")).resolves.toEqual({ tags: ["react"] });
  });

  test("requestJson rejects a 204 with no body cast", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(requestJson<{ tags: string[] }>("/api/tags")).rejects.toBeInstanceOf(ApiError);
  });

  test("requestNoContent resolves on 204", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(requestNoContent("/api/articles/demo", { method: "DELETE" })).resolves.toBeUndefined();
  });

  test("requestNoContent throws ApiError on failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ errors: { article: ["not found"] } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(requestNoContent("/api/articles/missing", { method: "DELETE" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
