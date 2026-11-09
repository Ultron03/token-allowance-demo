package io.github.ultron03.token_allowance_demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;

import io.github.ultron03.tokenallowance.springai.subject.SubjectParams;

class AuthoritiesTest {

    @Test
    void passesTenantAuthorityAsTenantParam() {
        assertThat(Authorities.tenantParam(login("TENANT_acme", "PLAN_pro")))
            .isEqualTo(Map.of(SubjectParams.TENANT_ID, "acme"));
    }

    @Test
    void passesNoParamForUserWithoutTenant() {
        assertThat(Authorities.tenantParam(login("ROLE_USER"))).isEmpty();
    }

    @Test
    void readsPlanAuthority() {
        assertThat(Authorities.planOf(login("TENANT_acme", "PLAN_pro"))).isEqualTo("pro");
    }

    private static Authentication login(String... authorities) {
        return UsernamePasswordAuthenticationToken.authenticated("carol", null,
            AuthorityUtils.createAuthorityList(authorities));
    }
}
