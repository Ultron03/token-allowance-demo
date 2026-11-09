import type { Mode } from "@/lib/api.ts";
import { type Refusal, waitText } from "@/lib/problems.ts";

import styles from "./console.module.css";

export type Exchange = {
  id: number;
  mode: Mode;
  question: string;
  answer: string;
  state: "answering" | "answered" | "refused";
  refusal?: Refusal;
};

type Props = {
  exchanges: Exchange[];
  passId: string;
  mode: Mode;
  onExample: (text: string) => void;
};

const EXAMPLES: Record<Mode, string[]> = {
  chat: ["Tell me a one-line joke about robots.", "Describe Java in one short sentence.", "One-line fun fact about octopuses."],
  agent: ["Who is at the very top of the organization above dave? Use managerOf one step at a time."],
};

export function Transcript({ exchanges, passId, mode, onExample }: Props) {
  if (exchanges.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyLead}>
          Nothing sent as {passId} yet. Each message is one request to the demo app, checked against {passId}’s
          budgets before the model is called.
        </p>
        <ul className={styles.examples} aria-label="Example messages">
          {EXAMPLES[mode].map((example) => (
            <li key={example}>
              <button type="button" className={styles.example} onClick={() => onExample(example)}>
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ol className={styles.transcript} aria-live="polite">
      {exchanges.map((exchange) => (
        <li key={exchange.id} className={styles.exchange} data-state={exchange.state}>
          <p className={styles.question}>
            <span className={styles.via}>{exchange.mode === "agent" ? "Agent" : "Chat"}</span>
            {exchange.question}
          </p>
          {exchange.state === "refused" && exchange.refusal ? (
            <RefusalNote refusal={exchange.refusal} />
          ) : (
            <p className={styles.answer}>
              {exchange.answer || (exchange.state === "answering" ? "Waiting for the model…" : "")}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

const REFUSAL_CODES: Record<Refusal["kind"], string> = {
  budget: "429",
  unavailable: "503",
  error: "Failed",
};

function RefusalNote({ refusal }: { refusal: Refusal }) {
  const wait = waitText(refusal.retryAfterSeconds);
  return (
    <div className={styles.refusal} role="status">
      <p className={styles.refusalReason}>
        <span className={styles.refusalCode}>{REFUSAL_CODES[refusal.kind]}</span> {refusal.reason}
      </p>
      {refusal.kind === "budget" && (
        <p className={styles.refusalWait}>
          {wait ? `A new window opens ${wait}.` : "This cap is per request; the next request starts fresh."}
        </p>
      )}
    </div>
  );
}
