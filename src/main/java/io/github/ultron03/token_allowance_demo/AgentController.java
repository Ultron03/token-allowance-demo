package io.github.ultron03.token_allowance_demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.github.ultron03.tokenallowance.springai.advisor.RequestLimitParams;

@RestController
class AgentController {

    /** More than the app-wide two calls a chat request gets, but fewer than a walk to the top of the org chart. */
    private static final int AGENT_MAX_MODEL_CALLS = 5;

    private final ChatClient chatClient;

    private final OrgChartTools orgChartTools;

    AgentController(ChatClient.Builder builder, OrgChartTools orgChartTools) {
        this.chatClient = builder
            .defaultAdvisors(a -> a.param(RequestLimitParams.MAX_MODEL_CALLS, AGENT_MAX_MODEL_CALLS))
            .build();
        this.orgChartTools = orgChartTools;
    }

    @PostMapping("/agent")
    String agent(@RequestBody String message, Authentication auth) {
        return chatClient.prompt()
            .user(message)
            .advisors(a -> a.params(Authorities.tenantParam(auth)))
            .tools(orgChartTools)
            .call()
            .content();
    }
}
