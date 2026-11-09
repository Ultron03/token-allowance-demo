package io.github.ultron03.token_allowance_demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/prometheus").permitAll()
                .anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .build();
    }

    // Tenant and plan are authorities; Token Allowance reads the PLAN_ one as the user's plan.
    @Bean
    UserDetailsService users() {
        return new InMemoryUserDetailsManager(
            User.withUsername("alice").password("{noop}alice").authorities("TENANT_acme").build(),
            User.withUsername("carol").password("{noop}carol").authorities("TENANT_acme", "PLAN_pro").build(),
            User.withUsername("bob").password("{noop}bob").authorities("ROLE_USER").build());
    }
}
