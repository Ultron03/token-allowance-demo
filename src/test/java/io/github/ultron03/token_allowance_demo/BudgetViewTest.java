package io.github.ultron03.token_allowance_demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import io.github.ultron03.token_allowance_demo.BudgetController.BudgetView;
import io.github.ultron03.tokenallowance.core.Amount;
import io.github.ultron03.tokenallowance.core.BudgetStatus;
import io.github.ultron03.tokenallowance.core.Limit;
import io.github.ultron03.tokenallowance.core.Money;
import io.github.ultron03.tokenallowance.core.Scope;
import io.github.ultron03.tokenallowance.core.Spend;
import io.github.ultron03.tokenallowance.core.Window;

class BudgetViewTest {

    private static final Instant START = Instant.parse("2026-11-09T00:00:00Z");

    private static final Instant RESET = Instant.parse("2026-11-10T00:00:00Z");

    @Test
    void showsTokensLeftUnderTheCap() {
        BudgetView view = BudgetView.of(Scope.USER, status(2000L, 500));

        assertThat(view).isEqualTo(new BudgetView("user", "daily", 2000L, 500, 1500L, null,
            new BigDecimal("0.000000"), null, RESET));
    }

    @Test
    void neverShowsLessThanZeroLeft() {
        // A budget can go a little over its cap, because a call that already ran is always charged.
        assertThat(BudgetView.of(Scope.USER, status(2000L, 2100)).tokensLeft()).isZero();
    }

    @Test
    void showsDollarsLeftUnderCostCap() {
        Limit costOnly = new Limit(Scope.USER, Window.DAILY, null, Money.ofDollars("0.0006"));
        Spend spent = new Spend(new Amount(125, Money.ofDollars("0.000195")), Amount.ZERO);

        BudgetView view = BudgetView.of(Scope.USER, new BudgetStatus(costOnly, START, RESET, spent));

        assertThat(view.costLeft()).isEqualByComparingTo("0.000405");
    }

    @Test
    void hasNoTokensLeftWithoutTokenCap() {
        Limit costOnly = new Limit(Scope.USER, Window.DAILY, null, Money.ofDollars("1.00"));
        BudgetStatus status = new BudgetStatus(costOnly, START, RESET, Spend.ZERO);

        assertThat(BudgetView.of(Scope.USER, status).tokensLeft()).isNull();
    }

    private static BudgetStatus status(Long maxTokens, long usedTokens) {
        Limit limit = new Limit(Scope.USER, Window.DAILY, maxTokens, null);
        return new BudgetStatus(limit, START, RESET, new Spend(new Amount(usedTokens, Money.ZERO), Amount.ZERO));
    }
}
