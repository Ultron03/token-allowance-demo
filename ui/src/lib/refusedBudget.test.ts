import assert from "node:assert/strict";
import { test } from "node:test";

import { refusedBudgetOf } from "./refusedBudget.ts";

test("names the budget behind a budget refusal", () => {
  assert.deepEqual(refusedBudgetOf("tenant daily budget exceeded"), { scope: "tenant", window: "daily" });
});

test("names no budget for a per-request cap", () => {
  assert.equal(refusedBudgetOf("request model call limit reached"), null);
});
