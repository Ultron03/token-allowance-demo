import type { Budget } from "./budgets.ts";
import { basicAuth, type Pass } from "./passes.ts";
import { type Refusal, refusalOf } from "./problems.ts";

export type Mode = "chat" | "agent";

export type Outcome = { ok: true; text: string } | { ok: false; refusal: Refusal };

/** Sends one message; chat answers stream into {@code onText} as they arrive, the agent's answer arrives whole. */
export async function ask(pass: Pass, mode: Mode, message: string, onText: (soFar: string) => void): Promise<Outcome> {
  let response: Response;
  try {
    response = await fetch(mode === "chat" ? "/api/chat/stream" : "/api/agent", {
      method: "POST",
      headers: { Authorization: basicAuth(pass), "Content-Type": "text/plain" },
      body: message,
    });
  } catch {
    return { ok: false, refusal: { kind: "error", reason: "The console’s own server is not running. Start it with npm run dev in the ui folder.", retryAfterSeconds: null } };
  }
  if (!response.ok) {
    return { ok: false, refusal: refusalOf(response.status, await response.text(), response.headers.get("retry-after")) };
  }
  if (mode === "agent" || response.body === null) {
    const text = await response.text();
    onText(text);
    return { ok: true, text };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      text += decoder.decode(value, { stream: true });
      onText(text);
    }
  } catch {
    return { ok: false, refusal: { kind: "error", reason: "The answer stopped part way. Send the message again.", retryAfterSeconds: null } };
  }
  return { ok: true, text };
}

export async function loadBudgets(pass: Pass): Promise<Budget[]> {
  const response = await fetch("/api/me/budget", { headers: { Authorization: basicAuth(pass) }, cache: "no-store" });
  if (!response.ok) {
    throw new Error(refusalOf(response.status, await response.text(), null).reason);
  }
  return (await response.json()) as Budget[];
}
