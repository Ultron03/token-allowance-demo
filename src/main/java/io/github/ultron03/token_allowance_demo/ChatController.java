package io.github.ultron03.token_allowance_demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

@RestController
class ChatController {

    private final ChatClient chatClient;

    ChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @PostMapping("/chat")
    String chat(@RequestBody String message, Authentication auth) {
        return chatClient.prompt()
            .user(message)
            .advisors(a -> a.params(Authorities.tenantParam(auth)))
            .call()
            .content();
    }

    @PostMapping("/chat/stream")
    Flux<String> chatStream(@RequestBody String message, Authentication auth) {
        return chatClient.prompt()
            .user(message)
            .advisors(a -> a.params(Authorities.tenantParam(auth)))
            .stream()
            .content();
    }
}
