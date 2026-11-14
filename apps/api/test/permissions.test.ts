import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  articlePermissions,
  commentPermissions,
  profilePermissions,
} from "../src/shared/permissions.js";

describe("profilePermissions", () => {
  test("guests cannot follow or update", () => {
    assert.deepEqual(profilePermissions(null, 1), { follow: false, update: false });
  });

  test("members can follow others but not update them", () => {
    assert.deepEqual(profilePermissions(2, 1), { follow: true, update: false });
  });

  test("self can update but not follow", () => {
    assert.deepEqual(profilePermissions(1, 1), { follow: false, update: true });
  });
});

describe("articlePermissions", () => {
  test("guests cannot mutate or favorite", () => {
    assert.deepEqual(articlePermissions(null, 1), { update: false, delete: false, favorite: false });
  });

  test("members can favorite but not edit others", () => {
    assert.deepEqual(articlePermissions(2, 1), { update: false, delete: false, favorite: true });
  });

  test("owners can update, delete, and favorite", () => {
    assert.deepEqual(articlePermissions(1, 1), { update: true, delete: true, favorite: true });
  });
});

describe("commentPermissions", () => {
  test("only the author may delete", () => {
    assert.deepEqual(commentPermissions(null, 1), { delete: false });
    assert.deepEqual(commentPermissions(2, 1), { delete: false });
    assert.deepEqual(commentPermissions(1, 1), { delete: true });
  });
});
