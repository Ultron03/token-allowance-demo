/** The scope and window a refusal names, read from the library's reason such as "user daily budget exceeded". */
export type RefusedBudget = { scope: string; window: string };

const BUDGET_REASON = /^(user|tenant|session|global) (minute|hour|daily|monthly) budget exceeded$/;

export function refusedBudgetOf(reason: string): RefusedBudget | null {
  const match = BUDGET_REASON.exec(reason);
  return match ? { scope: match[1], window: match[2] } : null;
}
