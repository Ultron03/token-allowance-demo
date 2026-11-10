# Demo console

A Next.js page for the Token Allowance demo app: pick a demo user, chat or run the agent, and watch the user's and tenant's budgets as each request is charged or refused.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for the budget and refusal logic
npm run build    # production build and type check
npm run record-demo   # records ../demo/console.gif, see the demo README
```

The Spring app must be running (see the [demo README](../README.md)). Requests go through `src/app/api/[...path]/route.ts`, which forwards `/chat`, `/chat/stream`, `/agent` and `/me/budget` to `TOKEN_ALLOWANCE_API_URL` (default `http://localhost:8080`) and streams the answers back. The demo users' passwords are in `src/lib/passes.ts`; that is fine for a local demo and nothing else.
