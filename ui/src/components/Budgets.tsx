import type { CSSProperties } from "react";

import { type Budget, formatAmount, metersOf, windowName } from "@/lib/budgets.ts";
import type { Pass } from "@/lib/passes.ts";
import type { RefusedBudget } from "@/lib/refusedBudget.ts";

import styles from "./console.module.css";

type Props = {
  pass: Pass;
  budgets: Budget[] | undefined;
  refused: RefusedBudget | null;
  error: string | null;
};

export function Budgets({ pass, budgets, refused, error }: Props) {
  return (
    <aside className={styles.budgets} aria-labelledby="budgets-title">
      <h2 id="budgets-title" className={styles.panelTitle}>
        Budgets
      </h2>
      {error ? (
        <p className={styles.panelNote}>Budgets can’t be loaded. {error}</p>
      ) : budgets === undefined ? (
        <p className={styles.panelNote}>Loading…</p>
      ) : budgets.length === 0 ? (
        <p className={styles.panelNote}>No budget applies to {pass.id} in this profile.</p>
      ) : (
        <>
          <Subject title={pass.id} capitalise budgets={budgets.filter((b) => b.scope === "user")} refused={refused} />
          {pass.tenant && (
            <Subject
              title={pass.tenant}
              kind="tenant"
              budgets={budgets.filter((b) => b.scope === "tenant")}
              refused={refused}
            />
          )}
        </>
      )}
      <p className={styles.panelFoot}>
        From <code>GET /me/budget</code>, refreshed every few seconds. A call is refused when its reserved estimate does not
        fit in what is left.
      </p>
    </aside>
  );
}

type SubjectProps = {
  title: string;
  kind?: string;
  capitalise?: boolean;
  budgets: Budget[];
  refused: RefusedBudget | null;
};

function Subject({ title, kind, capitalise, budgets, refused }: SubjectProps) {
  if (budgets.length === 0) {
    return null;
  }
  return (
    <section className={styles.subject}>
      <h3 className={styles.subjectName} data-capitalise={capitalise === true}>
        {title}
        {kind && <span className={styles.subjectKind}>{kind}</span>}
      </h3>
      <ul className={styles.rooms}>
        {budgets.map((budget) => {
          const isRefused = refused !== null && refused.scope === budget.scope && refused.window === budget.window;
          return (
            <li key={budget.window} className={styles.room} data-refused={isRefused}>
              <p className={styles.roomHead}>
                <span className={styles.roomSpan}>{windowName(budget.window)}</span>
                <span className={styles.roomReset}>resets {resetTime(budget)}</span>
              </p>
              {metersOf(budget).map((meter) => (
                <div key={meter.unit} className={styles.meter} data-full={meter.left === 0}>
                  <div
                    className={styles.bar}
                    role="meter"
                    aria-label={`${title} ${windowName(budget.window)} ${meter.unit}`}
                    aria-valuemin={0}
                    aria-valuemax={meter.cap}
                    aria-valuenow={Math.min(meter.used, meter.cap)}
                  >
                    <span className={styles.fill} style={{ "--share": meter.share } as CSSProperties} />
                  </div>
                  <p className={styles.meterNumbers}>
                    <span>
                      {formatAmount(meter.unit, meter.used)} of {formatAmount(meter.unit, meter.cap)}
                      {meter.unit === "tokens" ? " tokens" : ""}
                    </span>
                    <span className={styles.meterLeft}>{formatAmount(meter.unit, meter.left)} left</span>
                  </p>
                </div>
              ))}
              {isRefused && (
                <p className={styles.roomRefused}>Refused the last request: its reserved estimate did not fit in what is left.</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function resetTime(budget: Budget): string {
  const reset = new Date(budget.resetsAt);
  const options: Intl.DateTimeFormatOptions =
    budget.window === "minute" ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : { hour: "2-digit", minute: "2-digit" };
  const time = reset.toLocaleTimeString([], options);
  const sameDay = reset.toDateString() === new Date().toDateString();
  return sameDay ? `at ${time}` : `${reset.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}
