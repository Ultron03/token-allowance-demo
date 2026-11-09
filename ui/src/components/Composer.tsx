"use client";

import { type FormEvent, type KeyboardEvent } from "react";

import type { Mode } from "@/lib/api.ts";

import styles from "./console.module.css";

type Props = {
  mode: Mode;
  draft: string;
  sending: boolean;
  onDraft: (text: string) => void;
  onSend: () => void;
};

export function Composer({ mode, draft, sending, onDraft, onSend }: Props) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!sending) {
      onSend();
    }
  }

  function sendOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      submit(event);
    }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <label className={styles.visuallyHidden} htmlFor="message">
        Message
      </label>
      <textarea
        id="message"
        name="message"
        autoComplete="off"
        className={styles.input}
        rows={2}
        value={draft}
        placeholder={mode === "chat" ? "Ask anything" : "Ask about the org chart"}
        onChange={(event) => onDraft(event.target.value)}
        onKeyDown={sendOnEnter}
      />
      <button type="submit" className={styles.send} disabled={sending}>
        {sending ? "Sending…" : "Send"}
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
          <path
            d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
