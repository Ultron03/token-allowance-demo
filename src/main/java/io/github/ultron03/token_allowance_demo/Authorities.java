package io.github.ultron03.token_allowance_demo;

import java.util.Map;

import org.jspecify.annotations.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import io.github.ultron03.tokenallowance.springai.subject.SpringSecuritySubjectResolver;
import io.github.ultron03.tokenallowance.springai.subject.SubjectParams;

/** Reads the tenant and plan that {@link SecurityConfig} gives each user as authorities. */
final class Authorities {

    static final String TENANT_PREFIX = "TENANT_";

    private Authorities() {
    }

    static @Nullable String tenantOf(Authentication auth) {
        return valueAfter(auth, TENANT_PREFIX);
    }

    static @Nullable String planOf(Authentication auth) {
        return valueAfter(auth, SpringSecuritySubjectResolver.PLAN_AUTHORITY_PREFIX);
    }

    /** Token Allowance takes the user and plan from the login itself; only the tenant has to be passed. */
    static Map<String, Object> tenantParam(Authentication auth) {
        String tenant = tenantOf(auth);
        return (tenant == null) ? Map.of() : Map.of(SubjectParams.TENANT_ID, tenant);
    }

    private static @Nullable String valueAfter(Authentication auth, String prefix) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            String name = authority.getAuthority();
            if (name != null && name.startsWith(prefix)) {
                return name.substring(prefix.length());
            }
        }
        return null;
    }
}
