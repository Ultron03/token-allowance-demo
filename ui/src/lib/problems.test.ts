import assert from "node:assert/strict";
import { test } from "node:test";

import { refusalOf, waitText } from "./problems.ts";

test("reads the budget that ran out and when it resets from a 429", () => {
  const body = JSON.stringify({ title: "Token budget exceeded", detail: "user daily budget exceeded" });
  assert.deepEqual(refusalOf(429, body, "3600"), {
    kind: "budget",
    reason: "user daily budget exceeded",
    retryAfterSeconds: 3600,
  });
});

test("treats a 503 as the budget store being down", () => {
  assert.equal(refusalOf(503, "{}", null).kind, "unavailable");
});

test("falls back to the status when the body is not a ProblemDetail", () => {
  assert.equal(refusalOf(500, "<html>", null).reason, "HTTP 500");
});

test("words the wait for the next window", () => {
  assert.equal(waitText(45), "in 45 s");
  assert.equal(waitText(600), "in 10 min");
  assert.equal(waitText(11_100), "in 3 h 5 min");
  assert.equal(waitText(null), null);
});
