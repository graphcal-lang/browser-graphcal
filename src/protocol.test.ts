import { expect, test } from "vite-plus/test";
import { parseRequest } from "./protocol.ts";

test("a well-formed request of each method is accepted as typed", () => {
  expect(parseRequest({ v: 1, method: "hello" })).toEqual({ v: 1, method: "hello" });
  expect(
    parseRequest({ v: 1, method: "repo", owner: "example-org", repo: "example-repo" }),
  ).toEqual({
    v: 1,
    method: "repo",
    owner: "example-org",
    repo: "example-repo",
  });
  expect(
    parseRequest({ v: 1, method: "commit", owner: "o", repo: "r", ref: "feat/x" }),
  ).toMatchObject({
    ref: "feat/x",
  });
  const sha = "0123456789abcdef0123456789abcdef01234567";
  expect(parseRequest({ v: 1, method: "tree", owner: "o", repo: "r", sha })).toMatchObject({ sha });
  expect(
    parseRequest({ v: 1, method: "read", owner: "o", repo: "r", sha, path: "src/power/a.gcl" }),
  ).toMatchObject({ path: "src/power/a.gcl" });
  expect(
    parseRequest({ v: 1, method: "changed", owner: "o", repo: "r", base: "main", head: "v1.0" }),
  ).toMatchObject({ base: "main", head: "v1.0" });
});

test("anything else is refused", () => {
  expect(parseRequest(null)).toBeNull();
  expect(parseRequest({ v: 2, method: "hello" })).toBeNull();
  expect(parseRequest({ v: 1, method: "delete", owner: "o", repo: "r" })).toBeNull();
  expect(parseRequest({ v: 1, method: "repo", owner: "o/x", repo: "r" })).toBeNull();
  expect(parseRequest({ v: 1, method: "repo", owner: "o", repo: ".." })).toBeNull();
  expect(parseRequest({ v: 1, method: "commit", owner: "o", repo: "r", ref: "a..b" })).toBeNull();
  expect(parseRequest({ v: 1, method: "commit", owner: "o", repo: "r", ref: "a b" })).toBeNull();
  expect(parseRequest({ v: 1, method: "tree", owner: "o", repo: "r", sha: "main" })).toBeNull();
  const sha = "0123456789abcdef0123456789abcdef01234567";
  expect(
    parseRequest({ v: 1, method: "read", owner: "o", repo: "r", sha, path: "../x" }),
  ).toBeNull();
  expect(
    parseRequest({ v: 1, method: "read", owner: "o", repo: "r", sha, path: "a//b" }),
  ).toBeNull();
  // Extra fields are dropped, not forwarded.
  expect(parseRequest({ v: 1, method: "repo", owner: "o", repo: "r", extra: 1 })).toEqual({
    v: 1,
    method: "repo",
    owner: "o",
    repo: "r",
  });
});
