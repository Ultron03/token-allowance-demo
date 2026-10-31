# Token Allowance Demo

A small Spring Boot app that shows [Token Allowance](https://github.com/Ultron03/token-allowance) enforcing a per-user daily token budget on a Spring AI chat endpoint. It runs against a local [Ollama](https://ollama.com) model, so no API key is needed.

![Token Allowance demo: alice gets three answers, then HTTP 429, while bob is still served](demo/token-allowance.gif)

alice gets answers until her daily budget is used up. Her next request is refused with `429 Too Many Requests` before it ever reaches the model. bob has a separate budget and is still served.

## Requirements

- Java 17 or later
- [Ollama](https://ollama.com/download), running locally, with the `llama3.2` model:

  ```bash
  ollama pull llama3.2
  ```

## Run

```bash
./mvnw spring-boot:run
```

The app starts on port 8080 and exposes one endpoint, `POST /chat`.

## Try it

The user is taken from the `X-User-Id` header:

```bash
curl -X POST localhost:8080/chat \
  -H 'Content-Type: text/plain' \
  -H 'X-User-Id: alice' \
  -d 'Tell me a one-line joke about robots.'
```

Repeat the request until alice's budget runs out. From then on the response is:

```json
{
  "title": "Token budget exceeded",
  "status": 429,
  "detail": "user daily budget exceeded",
  "instance": "/chat"
}
```

Send the same request with `X-User-Id: bob` and it still goes through.

Budgets are kept in memory, so restarting the app resets them.

### Hit the limit faster

With the default settings (2000 tokens a day, full-length answers) it takes several requests to use up a budget. To see the 429 after three short answers, start the app with a smaller budget and shorter answers. These are the settings used in the recording above:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="\
--spring.ai.ollama.chat.options.num-predict=60 \
--token-allowance.limits[0].scope=user \
--token-allowance.limits[0].window=daily \
--token-allowance.limits[0].max-tokens=200"
```

`num-predict` caps the length of each answer. It matters because Token Allowance reserves an estimate before every model call, including room for the answer, and settles it to the real usage afterwards. A budget smaller than one reservation would refuse every request.

## How it works

There is no budget code in the app itself. The integration is a dependency and some configuration.

**Dependencies** ([pom.xml](pom.xml)):

| Dependency | Why |
|---|---|
| `token-allowance-spring-boot-starter` | Adds the budget checks to every `ChatClient` built from Spring AI's `ChatClient.Builder` |
| `spring-ai-starter-model-ollama` | The chat model |
| `spring-boot-starter-webmvc` | The HTTP endpoint |
| `spring-boot-starter-validation` | Token Allowance validates its configuration properties, which needs a Bean Validation implementation |

**Configuration** ([application.yml](src/main/resources/application.yml)):

```yaml
spring:
  ai:
    ollama:
      chat:
        model: llama3.2
token-allowance:
  pricing:
    models:
      - { name: llama3.2, input-per-mtok: "1.00", output-per-mtok: "2.00" }
  limits:
    - { scope: user, window: daily, max-tokens: 2000 }
```

- `limits` gives each user 2000 tokens a day.
- `pricing` is required even for a free local model, because Token Allowance rejects models it has no price for by default. The prices here are placeholders; with a hosted model, use the provider's real prices and set dollar limits with `max-cost`.

**Controller** ([ChatController.java](src/main/java/io/github/ultron03/token_allowance_demo/ChatController.java)) is a plain Spring AI controller:

```java
@RestController
class ChatController {

    private final ChatClient chatClient;

    ChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @PostMapping("/chat")
    String chat(@RequestBody String message) {
        return chatClient.prompt().user(message).call().content();
    }
}
```

For tenant and session budgets, dollar limits, per-request caps and the other options, see the [Token Allowance README](https://github.com/Ultron03/token-allowance).

## Recording the demo

The GIF is recorded with [VHS](https://github.com/charmbracelet/vhs) from [demo/chat-demo.tape](demo/chat-demo.tape). With VHS, `ttyd` and `ffmpeg` installed and Ollama running:

```bash
vhs demo/chat-demo.tape
```

The tape builds and starts the app off camera with the smaller budget shown above, records the requests, then stops the app. [demo/.curlrc](demo/.curlrc) adds `-s`, the `Content-Type` header and the `→ HTTP <status>` line to each curl command, so the recorded commands stay short.
