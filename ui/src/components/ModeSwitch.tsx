import type { Mode } from "@/lib/api.ts";

import styles from "./console.module.css";

const MODE_NOTES: Record<Mode, string> = {
  chat: "Streams the answer from /chat/stream. Each request may make two model calls (per-request.max-model-calls).",
  agent: "Answers through /agent, calling the managerOf tool in a loop. The agent’s client allows five model calls per request.",
};

type Props = {
  mode: Mode;
  onMode: (mode: Mode) => void;
};

export function ModeSwitch({ mode, onMode }: Props) {
  return (
    <div className={styles.modeBar}>
      <div className={styles.modes} role="group" aria-label="Mode">
        {(["chat", "agent"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={styles.mode}
            aria-pressed={mode === option}
            onClick={() => onMode(option)}
          >
            {option === "chat" ? "Chat" : "Agent"}
          </button>
        ))}
      </div>
      <p className={styles.modeNote}>{MODE_NOTES[mode]}</p>
    </div>
  );
}
