export type Plan = "free" | "pro";

export type Pass = {
  id: string;
  password: string;
  plan: Plan;
  tenant: string | null;
};

/** The users defined in the demo app's SecurityConfig; passwords equal the names. */
export const PASSES: readonly Pass[] = [
  { id: "alice", password: "alice", plan: "free", tenant: "acme" },
  { id: "carol", password: "carol", plan: "pro", tenant: "acme" },
  { id: "bob", password: "bob", plan: "free", tenant: null },
];

export function basicAuth(pass: Pass): string {
  return "Basic " + btoa(`${pass.id}:${pass.password}`);
}
