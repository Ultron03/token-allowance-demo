# Token Allowance Demo

A small Spring Boot app that shows [Token Allowance](https://github.com/Ultron03/token-allowance) enforcing token budgets on Spring AI calls: per user, per tenant, per plan, and per request for an agent that loops over a tool. It runs against a local [Ollama](https://ollama.com) model by default, so no API key is needed. A small web console shows each budget as you use it, and an optional Docker Compose stack adds Redis, Prometheus and a Grafana dashboard.

![Token Allowance demo: alice gets three answers, then HTTP 429; bob is still served; carol is on the pro plan but runs into the budget she shares with alice](demo/token-allowance.gif)

alice gets answers until her daily budget is used up. Her next request is refused with `429 Too Many Requests` before it ever reaches the model. bob has a separate budget and is still served. carol is on the pro plan, but she and alice share the acme tenant's budget, so she is stopped when acme's is used up.

![Token Allowance demo: a streamed answer, an agent stopped after five model calls, and a dollar budget at Gemini's published prices](demo/agent-and-dollars.gif)

On a hosted model: a streamed answer is charged like any other, the agent is stopped after five model calls, and a dollar budget priced at Gemini 3.5 Flash-Lite's published rates runs out after a few answers.

## Requirements

- Java 17 or later
- Node.js 20 or later, for the console (optional)
- Docker, for Redis, Prometheus and Grafana (optional)
- [Ollama](https://ollama.com/download), running locally, with the `llama3.2` model:

  ```bash
  ollama pull llama3.2
  ```

## Run

```bash
./mvnw spring-boot:run
```

The app starts on port 8080. Every endpoint except `/actuator/health` needs a login (HTTP Basic). There are three users:

| User | Password | Tenant | Plan | Daily budget |
|---|---|---|---|---|
| alice | `alice` | acme | free | 2,000 tokens |
| carol | `carol` | acme | pro | 20,000 tokens, at most 5,000 a minute |
| bob | `bob` | none | free | 2,000 tokens |

alice and carol also share acme's budget of 5,000 tokens a day.

## Open the console

```bash
cd ui
npm install
npm run dev
```

Open http://localhost:3000. Pick alice, carol or bob on the left, send messages in Chat or Agent mode, and watch their budgets on the right. A refused request stays in the conversation with the library's reason and when the budget resets. The console reaches the app through its own server, so the app needs no CORS setup; set `TOKEN_ALLOWANCE_API_URL` if the app is not on `http://localhost:8080`.

## Try it with curl

**Chat** until a budget runs out:

```bash
curl -u alice:alice localhost:8080/chat -H 'Content-Type: text/plain' \
  -d 'Tell me a one-line joke about robots.'
```

Once alice's budget is used up, the response is:

```json
{
  "title": "Token budget exceeded",
  "status": 429,
  "detail": "user daily budget exceeded",
  "instance": "/chat"
}
```

bob is still served, and carol gets ten times as much as alice because she is on the pro plan. When alice and carol together reach acme's 5,000 tokens, both are refused with `tenant daily budget exceeded`.

**Stream** the answer instead; it is charged the same way:

```bash
curl -N -u alice:alice localhost:8080/chat/stream -H 'Content-Type: text/plain' -d 'Say hello.'
```

**See what is left** for the logged-in user, and for their tenant:

```bash
curl -u alice:alice localhost:8080/me/budget
```

```json
[
  { "scope": "user", "window": "daily", "maxTokens": 2000, "usedTokens": 41, "tokensLeft": 1959, "maxCost": null, "usedCost": 0.000000, "costLeft": null, "resetsAt": "2026-11-10T00:00:00Z" },
  { "scope": "tenant", "window": "daily", "maxTokens": 5000, "usedTokens": 41, "tokensLeft": 4959, "maxCost": null, "usedCost": 0.000000, "costLeft": null, "resetsAt": "2026-11-10T00:00:00Z" }
]
```

A field is `null` when the limit has no cap of that kind.

**Ask the agent** a question that makes it walk an org chart one tool call at a time:

```bash
curl -u carol:carol localhost:8080/agent -H 'Content-Type: text/plain' \
  -d 'Who is at the very top of the organization above dave? Use managerOf one step at a time.'
```

The chart is seven levels deep, but the agent may make only five model calls per request, so it is stopped with `429` and `request model call limit reached` instead of looping on. Small local models like `llama3.2` often stop calling the tool on their own before that; use a hosted model (below) to see the cut-off.

**Look up anyone's budget** through the actuator endpoint, with the limits of a plan:

```bash
curl -u alice:alice 'localhost:8080/actuator/tokenallowance/user/carol?plan=pro'
```

Budgets are kept in memory, so restarting the app resets them.

### Hit the limit faster

With the default settings it takes several requests to use up a budget, because Token Allowance reserves room for a full-length answer before every call. The `small` profile ([application-small.yml](src/main/resources/application-small.yml)) gives alice and bob 200 tokens a day, acme 280, and caps each answer at 60 tokens, so every limit is reached within a few requests. The first recording above uses it:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=small
```

`num-predict` caps the length of each answer. It matters because Token Allowance reserves an estimate before every model call, including room for the answer, and settles it to the real usage afterwards. A budget smaller than one reservation would refuse every request.

### Reserving less than a full answer

Before every call, Token Allowance reserves room for the longest answer the request allows (its max tokens, or 1,024). A user is refused once that no longer fits, even with budget left. The demo sets `token-allowance.estimate.output-tokens: 300`, so a call reserves room for a 300-token answer instead; a longer answer is still charged in full afterwards. Remove the line to see the default: alice is refused with almost half her budget left.

### Use a hosted model

The `groq` and `gemini` profiles switch the chat model to Groq or Google Gemini through their OpenAI-compatible APIs. Copy `.env.example` to `.env` and fill in the key; `.env` is git-ignored and read at startup.

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=gemini
```

### Dollar budgets

Add the `priced` profile to the `gemini` one to budget in dollars instead of tokens ([application-priced.yml](src/main/resources/application-priced.yml)). It switches to Gemini 3.5 Flash-Lite, prices it at Google's published rates ($0.30 input, $2.50 output per million tokens), and gives free users $0.00025 a day, pro users $0.05 and acme $0.01:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=gemini,priced
```

With a free-tier key, nothing is actually billed; the costs are what the same calls would cost on the paid tier. Each call first reserves the price of a 60-token answer (`estimate.output-tokens: 60`), about $0.00015, so alice is refused after a few answers once what is left is less than one reservation, even though each answer costs only about $0.00004.

## Share budgets in Redis and watch them in Grafana

```bash
docker compose up -d
./mvnw spring-boot:run -Dspring-boot.run.profiles=redis
```

[docker-compose.yml](docker-compose.yml) starts Redis on 6379, Prometheus on 9090 and Grafana on http://localhost:3001 (no login needed to view). With the `redis` profile, budgets live in Redis, so they survive restarts and every instance of the app shares them. Without a local Ollama, start one in Docker too: `docker compose --profile ollama up -d` (the first start downloads `llama3.2`, about 2 GB).

The **Token Allowance** dashboard ([docker/grafana/dashboards](docker/grafana/dashboards/token-allowance.json)) charts the library's meters: cost and tokens by model, decisions by stage and outcome, denials by budget, and how much of each reservation calls really used. A low "real usage ÷ estimate" is the sign to set `estimate.output-tokens`. Prometheus scrapes `/actuator/prometheus`, which the demo leaves open without a login.

## Profiles

| Profile | What it changes |
|---|---|
| `small` | 200-token user budgets and 280 for acme, 60-token answers, so every limit is reached in a few requests |
| `gemini` | Google Gemini through its OpenAI-compatible API (`GEMINI_API_KEY` in `.env`) |
| `groq` | Groq through its OpenAI-compatible API (`GROQ_API_KEY` in `.env`); chat and streaming only, see above |
| `priced` | With `gemini`: dollar budgets at Gemini 3.5 Flash-Lite's published prices |
| `redis` | Budgets in Redis from `docker compose up -d` |

Combine them with commas, for example `-Dspring-boot.run.profiles=gemini,priced,redis`.

Use `gemini` for the agent. With Spring AI 2.0.1, the agent's tool loop fails on Groq: Groq rejects the reasoning text that Spring AI sends back from `gpt-oss` models. Chat and streaming work on both. Gemini's free tier allows only a few requests a minute, which one agent request can use up; the provider then answers with its own rate-limit error.

## How it works

The budget rules are all configuration. The app code only tells Token Allowance which tenant a user belongs to and gives the agent its own per-request cap.

**Dependencies** ([pom.xml](pom.xml)):

| Dependency | Why |
|---|---|
| `token-allowance-spring-boot-starter` | Adds the budget checks to every `ChatClient` built from Spring AI's `ChatClient.Builder` |
| `spring-ai-starter-model-ollama` | The default chat model |
| `spring-ai-starter-model-openai` | Groq and Gemini, through their OpenAI-compatible APIs |
| `spring-boot-starter-webmvc` | The HTTP endpoints |
| `spring-boot-starter-security` | Logins; Token Allowance takes the user and plan from them |
| `spring-boot-starter-actuator` | The `tokenallowance` and `prometheus` endpoints |
| `micrometer-registry-prometheus` | Exports the `token.allowance.*` meters for Prometheus |
| `token-allowance-redis`, `spring-boot-starter-data-redis` | Budgets in Redis with the `redis` profile |

**Configuration** ([application.yml](src/main/resources/application.yml)):

```yaml
token-allowance:
  limits:
    - { scope: user, window: daily, max-tokens: 2000 }
    - { scope: tenant, window: daily, max-tokens: 5000 }
  plans:
    pro:
      - { scope: user, window: daily, max-tokens: 20000 }
      - { scope: user, window: minute, max-tokens: 5000 }
  per-request:
    max-model-calls: 2
  estimate:
    output-tokens: 300
```

- `limits` apply to everyone. The `pro` plan replaces the user's daily limit and adds a per-minute one.
- `per-request.max-model-calls` stops any single request after two model calls; the agent raises it for its own requests.
- `estimate.output-tokens` reserves room for a 300-token answer before each call instead of a full-length one.
- No prices are needed, because all limits count tokens.

**Users** ([SecurityConfig.java](src/main/java/io/github/ultron03/token_allowance_demo/SecurityConfig.java)) carry their tenant and plan as authorities, such as `TENANT_acme` and `PLAN_pro`. Token Allowance reads the user name and the `PLAN_` authority by itself. The tenant is passed on each call ([Authorities.java](src/main/java/io/github/ultron03/token_allowance_demo/Authorities.java)):

```java
@PostMapping("/chat")
String chat(@RequestBody String message, Authentication auth) {
    return chatClient.prompt()
        .user(message)
        .advisors(a -> a.params(Authorities.tenantParam(auth)))
        .call()
        .content();
}
```

**The agent** ([AgentController.java](src/main/java/io/github/ultron03/token_allowance_demo/AgentController.java)) gets its own cap when its client is built:

```java
this.chatClient = builder
    .defaultAdvisors(a -> a.param(RequestLimitParams.MAX_MODEL_CALLS, 5))
    .build();
```

**What is left** ([BudgetController.java](src/main/java/io/github/ultron03/token_allowance_demo/BudgetController.java)) comes from `BudgetService.statusOf`.

For dollar limits, Redis, alerts and the other options, see the [Token Allowance README](https://github.com/Ultron03/token-allowance).

## Recording the demo

The GIFs are recorded with [VHS](https://github.com/charmbracelet/vhs) from [demo/chat-demo.tape](demo/chat-demo.tape) (Ollama, `small` profile) and [demo/agent-demo.tape](demo/agent-demo.tape) (Gemini, `gemini,priced` profiles; needs `GEMINI_API_KEY` in `.env`). With VHS, `ttyd`, `ffmpeg` and `jq` installed:

```bash
vhs demo/chat-demo.tape
vhs demo/agent-demo.tape
```

Each tape builds and starts the app off camera, records the requests, then stops the app. [demo/.curlrc](demo/.curlrc) adds `-s`, the `Content-Type` header and the `→ HTTP <status>` line to each curl command, so the recorded commands stay short.
