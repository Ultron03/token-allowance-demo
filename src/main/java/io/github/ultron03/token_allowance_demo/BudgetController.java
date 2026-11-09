package io.github.ultron03.token_allowance_demo;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.github.ultron03.tokenallowance.core.Amount;
import io.github.ultron03.tokenallowance.core.BudgetService;
import io.github.ultron03.tokenallowance.core.BudgetStatus;
import io.github.ultron03.tokenallowance.core.Money;
import io.github.ultron03.tokenallowance.core.Scope;

/** What the logged-in user has left: their own budgets, and their tenant's if they belong to one. */
@RestController
class BudgetController {

    private final BudgetService budgetService;

    BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping("/me/budget")
    List<BudgetView> myBudget(Authentication auth) {
        String plan = Authorities.planOf(auth);
        List<BudgetView> budgets = new ArrayList<>();
        for (BudgetStatus status : budgetService.statusOf(Scope.USER, auth.getName(), plan)) {
            budgets.add(BudgetView.of(Scope.USER, status));
        }
        String tenant = Authorities.tenantOf(auth);
        if (tenant != null) {
            for (BudgetStatus status : budgetService.statusOf(Scope.TENANT, tenant, plan)) {
                budgets.add(BudgetView.of(Scope.TENANT, status));
            }
        }
        return budgets;
    }

    /** One budget as the UI shows it, in tokens and in dollars; a field is null when the limit has no such cap. */
    record BudgetView(String scope, String window, @Nullable Long maxTokens, long usedTokens,
            @Nullable Long tokensLeft, @Nullable BigDecimal maxCost, BigDecimal usedCost,
            @Nullable BigDecimal costLeft, Instant resetsAt) {

        static BudgetView of(Scope scope, BudgetStatus status) {
            Amount used = status.spend().committed();
            Long maxTokens = status.limit().maxTokens();
            Long tokensLeft = (maxTokens != null) ? Math.max(0, maxTokens - used.tokens()) : null;
            BigDecimal usedCost = used.cost().toDollars();
            Money maxCost = status.limit().maxCost();
            BigDecimal costLeft = (maxCost != null)
                ? maxCost.toDollars().subtract(usedCost).max(BigDecimal.ZERO)
                : null;
            return new BudgetView(lowerCase(scope), lowerCase(status.limit().window()), maxTokens, used.tokens(),
                tokensLeft, (maxCost != null) ? maxCost.toDollars() : null, usedCost, costLeft, status.resetsAt());
        }

        private static String lowerCase(Enum<?> value) {
            return value.name().toLowerCase(Locale.ROOT);
        }
    }
}
