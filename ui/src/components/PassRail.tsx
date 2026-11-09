import { type Budget, formatAmount, metersOf, windowName } from "@/lib/budgets.ts";
import type { Pass } from "@/lib/passes.ts";

import styles from "./console.module.css";

type Props = {
  passes: readonly Pass[];
  selectedId: string;
  budgetsById: Record<string, Budget[] | undefined>;
  stale: boolean;
  onSelect: (id: string) => void;
};

export function PassRail({ passes, selectedId, budgetsById, stale, onSelect }: Props) {
  return (
    <nav className={styles.rail} aria-label="Demo users">
      <ul className={styles.passes}>
        {passes.map((pass) => {
          const selected = pass.id === selectedId;
          return (
            <li key={pass.id}>
              <button
                type="button"
                className={styles.pass}
                data-plan={pass.plan}
                aria-pressed={selected}
                onClick={() => onSelect(pass.id)}
              >
                <span className={styles.passStripe} aria-hidden="true" />
                <span className={styles.passBody}>
                  <span className={styles.passName}>{pass.id}</span>
                  <span className={styles.passPlan}>{pass.plan} plan</span>
                  <span className={styles.passTenant}>{pass.tenant ?? "no tenant"}</span>
                  <span className={styles.passUsage} data-stale={stale}>
                    {usageLine(budgetsById[pass.id], stale)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function usageLine(budgets: Budget[] | undefined, stale: boolean): string {
  const own = budgets?.find((budget) => budget.scope === "user");
  const meter = own ? metersOf(own)[0] : undefined;
  if (!own || !meter) {
    return " ";
  }
  const unit = meter.unit === "tokens" ? " tokens" : "";
  const line = `${formatAmount(meter.unit, meter.left)}${unit} left ${windowName(own.window)}`;
  return stale ? `${line}, last seen` : line;
}
