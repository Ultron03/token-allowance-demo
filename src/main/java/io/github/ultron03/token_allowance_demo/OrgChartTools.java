package io.github.ultron03.token_allowance_demo;

import java.util.Locale;
import java.util.Map;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/** A fixed org chart seven levels deep, so walking it to the top takes more model calls than the agent may make. */
@Component
class OrgChartTools {

    private final Map<String, String> managers = Map.of(
        "dave", "hana",
        "hana", "ivan",
        "ivan", "judy",
        "judy", "kofi",
        "kofi", "lena",
        "lena", "maya",
        "maya", "omar");

    @Tool(description = "Returns the direct manager of one employee, or says the employee has no manager.")
    String managerOf(@ToolParam(description = "First name of the employee, for example dave") String employee) {
        String manager = managers.get(employee.strip().toLowerCase(Locale.ROOT));
        return (manager != null) ? manager : employee + " has no manager; they are at the top of the organization.";
    }
}
