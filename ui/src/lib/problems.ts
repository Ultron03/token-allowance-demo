/** What a failed request means for the visitor, from the demo app's ProblemDetail responses. */
export type Refusal = {
  kind: "budget" | "unavailable" | "error";
  reason: string;
  retryAfterSeconds: number | null;
};

type ProblemBody = { title?: string; detail?: string };

export function refusalOf(status: number, body: string, retryAfter: string | null): Refusal {
  const problem = parseProblem(body);
  const reason = problem.detail ?? problem.title ?? `HTTP ${status}`;
  const seconds = retryAfter !== null && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null;
  if (status === 429) {
    return { kind: "budget", reason, retryAfterSeconds: seconds };
  }
  if (status === 503) {
    return { kind: "unavailable", reason, retryAfterSeconds: seconds };
  }
  return { kind: "error", reason, retryAfterSeconds: null };
}

function parseProblem(body: string): ProblemBody {
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === "object" && parsed !== null ? (parsed as ProblemBody) : {};
  } catch {
    return {};
  }
}

/** "in 45 s", "in 12 min", "in 3 h 5 min"; a per-request cap has no wait. */
export function waitText(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) {
    return null;
  }
  if (seconds < 60) {
    return `in ${seconds} s`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `in ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `in ${hours} h` : `in ${hours} h ${rest} min`;
}
