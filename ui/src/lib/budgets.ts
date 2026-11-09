/** One entry of the demo app's GET /me/budget. A field is null when the limit has no cap of that kind. */
export type Budget = {
  scope: string;
  window: string;
  maxTokens: number | null;
  usedTokens: number;
  tokensLeft: number | null;
  maxCost: number | null;
  usedCost: number;
  costLeft: number | null;
  resetsAt: string;
};

export type Meter = {
  unit: "tokens" | "dollars";
  used: number;
  cap: number;
  left: number;
  share: number;
};

/** The caps a budget sets, each as a fill share between 0 and 1. */
export function metersOf(budget: Budget): Meter[] {
  const meters: Meter[] = [];
  if (budget.maxTokens !== null) {
    meters.push(meter("tokens", budget.usedTokens, budget.maxTokens));
  }
  if (budget.maxCost !== null) {
    meters.push(meter("dollars", budget.usedCost, budget.maxCost));
  }
  return meters;
}

function meter(unit: Meter["unit"], used: number, cap: number): Meter {
  return { unit, used, cap, left: Math.max(0, cap - used), share: cap > 0 ? Math.min(1, used / cap) : 1 };
}

const WINDOW_NAMES: Record<string, string> = {
  minute: "this minute",
  hour: "this hour",
  daily: "today",
  monthly: "this month",
};

export function windowName(window: string): string {
  return WINDOW_NAMES[window] ?? window;
}

export function formatAmount(unit: Meter["unit"], value: number): string {
  if (unit === "tokens") {
    return Math.round(value).toLocaleString("en-US");
  }
  if (value === 0) {
    return "$0";
  }
  return "$" + value.toFixed(Math.abs(value) < 1 ? 6 : 2);
}
