package com.example.horario_ifpb_monteiro.config;

import com.example.horario_ifpb_monteiro.jwt.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Acesso não autorizado. Faça login novamente.")
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. Rota de atualização do próprio perfil exige autenticação JWT
                        .requestMatchers(HttpMethod.PUT, "/api/v1/auth/me").authenticated()

                        // 2. Rotas públicas de autenticação (Login e registro inicial)
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/setup-admin").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/administradores").permitAll()

                        // 3. Documentação Swagger/OpenAPI liberada
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // 4. Todas as leituras (GET) são públicas para a consulta pública
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").permitAll()

                        // 5. Qualquer outra operação de escrita (POST, PUT, DELETE) exige autenticação
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}