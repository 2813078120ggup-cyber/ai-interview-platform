package com.tyut.aiinterview.config;

import com.tyut.aiinterview.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          UserDetailsService userDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health", "/api/auth/register", "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS).permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/users").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Interview module: HR and Admin can manage
                        .requestMatchers(HttpMethod.POST, "/api/interviews").hasAnyRole("HR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/interviews/**").hasAnyRole("HR", "ADMIN", "INTERVIEWER")
                        .requestMatchers(HttpMethod.GET, "/api/interviews/**").authenticated()
                        // Interview room (start/end/answer)
                        .requestMatchers("/api/interview-room/**").authenticated()
                        // Question banks (Interviewer, HR, Admin)
                        .requestMatchers(HttpMethod.POST, "/api/questions/**").hasAnyRole("HR", "ADMIN", "INTERVIEWER")
                        .requestMatchers(HttpMethod.PUT, "/api/questions/**").hasAnyRole("HR", "ADMIN", "INTERVIEWER")
                        .requestMatchers(HttpMethod.DELETE, "/api/questions/**").hasAnyRole("HR", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/questions/**").authenticated()
                        // Evaluations
                        .requestMatchers(HttpMethod.POST, "/api/evaluations/human/**").hasAnyRole("INTERVIEWER", "HR", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/evaluations/ai/**").authenticated()
                        .requestMatchers("/api/evaluations/**").authenticated()
                        // Reports
                        .requestMatchers(HttpMethod.POST, "/api/reports/generate/**").hasAnyRole("HR", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/reports/publish/**").hasAnyRole("HR", "ADMIN")
                        .requestMatchers("/api/reports/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
