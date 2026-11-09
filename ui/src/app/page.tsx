"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { Budgets } from "@/components/Budgets";
import { Composer } from "@/components/Composer";
import { ModeSwitch } from "@/components/ModeSwitch";
import { PassRail } from "@/components/PassRail";
import { type Exchange, Transcript } from "@/components/Transcript";
import styles from "@/components/console.module.css";
import { ask, loadBudgets, type Mode } from "@/lib/api.ts";
import type { Budget } from "@/lib/budgets.ts";
import { PASSES } from "@/lib/passes.ts";
import { refusedBudgetOf } from "@/lib/refusedBudget.ts";

const REFRESH_MS = 4000;

/** The user and mode in the address, so a link can open the console as carol in Agent mode. */
function stateFromUrl(): { passId: string; mode: Mode } {
  const params = new URLSearchParams(window.location.search);
  const passId = PASSES.find((each) => each.id === params.get("user"))?.id ?? PASSES[0].id;
  const mode: Mode = params.get("mode") === "agent" ? "agent" : "chat";
  return { passId, mode };
}

export default function Console() {
  const [passId, setPassId] = useState(PASSES[0].id);
  const [mode, setMode] = useState<Mode>("chat");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [exchangesById, setExchangesById] = useState<Record<string, Exchange[]>>({});
  const [budgetsById, setBudgetsById] = useState<Record<string, Budget[] | undefined>>({});
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const nextId = useRef(1);
  const urlApplied = useRef(false);

  useEffect(() => {
    const fromUrl = stateFromUrl();
    const apply = setTimeout(() => {
      setPassId(fromUrl.passId);
      setMode(fromUrl.mode);
      urlApplied.current = true;
    }, 0);
    return () => clearTimeout(apply);
  }, []);

  useEffect(() => {
    if (!urlApplied.current) {
      return;
    }
    const params = new URLSearchParams({ user: passId, mode });
    window.history.replaceState(null, "", `?${params}`);
  }, [passId, mode]);

  const pass = PASSES.find((candidate) => candidate.id === passId) ?? PASSES[0];

  const refreshBudgets = useCallback(async () => {
    try {
      const loaded = await Promise.all(PASSES.map(async (each) => [each.id, await loadBudgets(each)] as const));
      setBudgetsById(Object.fromEntries(loaded));
      setBudgetError(null);
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : "Budgets could not be loaded");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(refreshBudgets, 0);
    const timer = setInterval(refreshBudgets, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refreshBudgets]);

  function update(id: number, owner: string, change: Partial<Exchange>) {
    setExchangesById((all) => ({
      ...all,
      [owner]: (all[owner] ?? []).map((exchange) => (exchange.id === id ? { ...exchange, ...change } : exchange)),
    }));
  }

  async function send() {
    const question = draft.trim();
    if (question === "") {
      document.getElementById("message")?.focus();
      return;
    }
    const owner = pass;
    const id = nextId.current++;
    setDraft("");
    setSending(true);
    setExchangesById((all) => ({
      ...all,
      [owner.id]: [...(all[owner.id] ?? []), { id, mode, question, answer: "", state: "answering" }],
    }));

    const outcome = await ask(owner, mode, question, (soFar) => update(id, owner.id, { answer: soFar }));
    update(id, owner.id, outcome.ok ? { answer: outcome.text, state: "answered" } : { state: "refused", refusal: outcome.refusal });
    setSending(false);
    void refreshBudgets();
  }

  const exchanges = exchangesById[pass.id] ?? [];
  const last = exchanges.at(-1);
  const refused = last?.state === "refused" && last.refusal?.kind === "budget" ? refusedBudgetOf(last.refusal.reason) : null;
  const planColour = { "--plan": `var(--${pass.plan})`, "--plan-strong": `var(--${pass.plan}-strong)` } as CSSProperties;

  return (
    <div className={styles.console} style={planColour}>
      <a className={styles.skip} href="#conversation">
        Skip to the conversation
      </a>
      <header className={styles.header}>
        <p className={styles.wordmark}>
          Token Allowance <span className={styles.wordmarkSub}>demo console</span>
        </p>
        <p className={styles.status} data-ok={budgetError === null}>
          {budgetError === null ? "Connected to the demo app" : "Demo app not reachable"}
        </p>
        <a className={styles.readme} href="https://github.com/Ultron03/token-allowance" target="_blank" rel="noreferrer">
          Library README
        </a>
      </header>

      <PassRail
        passes={PASSES}
        selectedId={pass.id}
        budgetsById={budgetsById}
        stale={budgetError !== null}
        onSelect={setPassId}
      />

      <main id="conversation" className={styles.work}>
        <h1 className={styles.workTitle}>
          Signed in as <span className={styles.workName}>{pass.id}</span>
        </h1>
        <ModeSwitch mode={mode} onMode={setMode} />
        <div className={styles.scroll}>
          <Transcript exchanges={exchanges} passId={pass.id} mode={mode} onExample={setDraft} />
        </div>
        <Composer mode={mode} draft={draft} sending={sending} onDraft={setDraft} onSend={send} />
      </main>

      <Budgets pass={pass} budgets={budgetsById[pass.id]} refused={refused} error={budgetError} />
    </div>
  );
}
