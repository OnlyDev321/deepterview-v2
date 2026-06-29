package com.capstone.deepterview.global.config;

import com.capstone.deepterview.domain.member.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final CustomOAuth2UserService customOAuth2UserService;
	private final OAuth2SuccessHandler oAuth2SuccessHandler;
	private final SecurityExceptionHandler securityExceptionHandler;
	private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;


	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.formLogin(form -> form.disable())
				.httpBasic(basic -> basic.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint(securityExceptionHandler)
						.accessDeniedHandler(securityExceptionHandler)
				)
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/swagger-ui/**", "/swagger-resources/**", "/v3/api-docs/**").permitAll()
						.requestMatchers("/api/v1/auth/**").permitAll()
						.requestMatchers("/api/v1/uploads/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/v1/job-categories").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
						.requestMatchers("/api/v1/internal/**").permitAll()
						.requestMatchers("/api/v1/public/**").permitAll()
						.requestMatchers("/oauth2/**", "/login/**").permitAll()
						.anyRequest().authenticated()
				)
				.oauth2Login(oauth2 -> oauth2
						.authorizationEndpoint(endpoint -> endpoint
								.authorizationRequestRepository(httpCookieOAuth2AuthorizationRequestRepository)
						)
						.userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
						.successHandler(oAuth2SuccessHandler)
				)
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of(
				"http://localhost:3000",
				"http://localhost:8080",
				"http://localhost:5173",
				"http://127.0.0.1:5173",
				"http://deepterview.duckdns.org",
				"https://deepterview.duckdns.org",
				"http://deepterview.duckdns.org:5173",
				"http://deepterview.duckdns.org:8080"
		));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}

