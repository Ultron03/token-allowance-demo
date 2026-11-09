import assert from "node:assert/strict";
import { test } from "node:test";

import { type Budget, formatAmount, metersOf } from "./budgets.ts";

const budget: Budget = {
  scope: "user",
  window: "daily",
  maxTokens: 2000,
  usedTokens: 2100,
  tokensLeft: 0,
  maxCost: 0.0006,
  usedCost: 0.00013,
  costLeft: 0.00047,
  resetsAt: "2026-11-10T00:00:00Z",
};

test("gives one meter per cap the budget sets", () => {
  assert.deepEqual(metersOf(budget).map((meter) => meter.unit), ["tokens", "dollars"]);
});

test("caps the fill at full when a budget went over its cap", () => {
  const tokens = metersOf(budget)[0];
  assert.equal(tokens.share, 1);
  assert.equal(tokens.left, 0);
});

test("has no meter for a cap the budget does not set", () => {
  assert.deepEqual(metersOf({ ...budget, maxCost: null }).map((meter) => meter.unit), ["tokens"]);
});

test("shows tiny dollar amounts to the micro-dollar", () => {
  assert.equal(formatAmount("dollars", 0.00047), "$0.000470");
  assert.equal(formatAmount("dollars", 10), "$10.00");
});

test("shows zero dollars without implying a precision", () => {
  assert.equal(formatAmount("dollars", 0), "$0");
});

test("never rounds a dollar amount under $1 up to the cent", () => {
  assert.equal(formatAmount("dollars", 0.049578), "$0.049578");
});
