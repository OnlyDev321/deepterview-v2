package com.capstone.deepterview.global.config;

import com.capstone.deepterview.domain.member.domain.OAuthProvider;
import com.capstone.deepterview.domain.member.dto.response.TokenResponse;
import com.capstone.deepterview.domain.member.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

	private final AuthService authService;

	@Value("${app.oauth2.redirect-success-url:http://localhost:5173/oauth2/success}")
	private String redirectSuccessUrl;

	@Override
	public void onAuthenticationSuccess(
			HttpServletRequest request,
			HttpServletResponse response,
			Authentication authentication
	) throws IOException, ServletException {
		try {
			OAuth2User principal = (OAuth2User) authentication.getPrincipal();
			Map<String, Object> attributes = principal.getAttributes();

			Long userId = Long.valueOf(String.valueOf(attributes.get("userId")));
			OAuthProvider provider = OAuthProvider.valueOf(String.valueOf(attributes.get("provider")));
			String providerId = String.valueOf(attributes.get("providerId"));

			TokenResponse tokenResponse = authService.issueTokensAndSaveRefresh(userId, provider, providerId);

			String targetUrl = UriComponentsBuilder.fromUriString(redirectSuccessUrl)
					.queryParam("accessToken", tokenResponse.accessToken())
					.queryParam("refreshToken", tokenResponse.refreshToken())
					.build()
					.toUriString();

			getRedirectStrategy().sendRedirect(request, response, targetUrl);
		} catch (Exception e) {
			log.error("OAuth2 로그인 처리 중 에러 ", e);
			throw e;
		}
	}
}

