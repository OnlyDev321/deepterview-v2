package com.capstone.deepterview.domain.member.service;

import com.capstone.deepterview.domain.member.domain.OAuthProvider;
import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.domain.UserOauth;
import com.capstone.deepterview.domain.member.dto.response.TokenResponse;
import com.capstone.deepterview.domain.member.repository.UserOauthRepository;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.global.config.JwtTokenProvider;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

	private final JwtTokenProvider jwtTokenProvider;
	private final UserRepository userRepository;
	private final UserOauthRepository userOauthRepository;

	@Transactional
	public TokenResponse issueTokensAndSaveRefresh(Long userId, OAuthProvider provider, String providerId) {
		log.error("issueTokensAndSaveRefresh 진입 - userId: {}, provider: {}, providerId: {}",
				userId, provider, providerId);

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED, "유효하지 않은 사용자입니다."));
		log.error("issueTokensAndSaveRefresh - user 조회 완료");

		UserOauth userOauth = userOauthRepository.findByProviderAndProviderId(provider, providerId)
				.orElseGet(() -> userOauthRepository.save(
						UserOauth.of(user, provider, providerId, null, null, null)
				));

		log.error("issueTokensAndSaveRefresh - userOauth 조회 완료");

		String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
		String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
		LocalDateTime expiresAt = LocalDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000);

		userOauth.updateTokens(accessToken, refreshToken, expiresAt);
		log.error("issueTokensAndSaveRefresh - 토큰 저장 완료");

		return new TokenResponse(accessToken, refreshToken);
	}

	@Transactional
	public TokenResponse reissue(String refreshToken) {
		if (!jwtTokenProvider.validateToken(refreshToken)) {
			throw new CustomException(ErrorCode.UNAUTHORIZED, "유효하지 않은 refreshToken 입니다.");
		}

		Claims claims = jwtTokenProvider.parseClaims(refreshToken);
		String type = (String) claims.get("type");
		if (!"REFRESH".equals(type)) {
			throw new CustomException(ErrorCode.UNAUTHORIZED, "refreshToken이 아닙니다.");
		}

		UserOauth userOauth = userOauthRepository.findByRefreshTokenAndTokenExpiresAtAfter(refreshToken, LocalDateTime.now())
				.orElseThrow(() -> new CustomException(ErrorCode.UNAUTHORIZED, "만료되었거나 로그아웃된 refreshToken 입니다."));

		User user = userOauth.getUser();
		String newAccessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
		String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getId());
		LocalDateTime expiresAt = LocalDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000);
		userOauth.updateTokens(newAccessToken, newRefreshToken, expiresAt);

		return new TokenResponse(newAccessToken, newRefreshToken);
	}

	@Transactional
	public void logout(String refreshToken) {
		UserOauth userOauth = userOauthRepository.findByRefreshToken(refreshToken)
				.orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "존재하지 않는 refreshToken 입니다."));
		userOauth.clearRefreshToken();
	}

	@Transactional
	public TokenResponse testLogin(String email) {
		User user = userRepository.findByEmail(email)
				.orElseGet(() -> userRepository.save(
						User.of(email, "테스트 유저", null)
				));

		UserOauth userOauth = userOauthRepository.findFirstByUser_Id(user.getId())
				.orElseGet(() -> userOauthRepository.save(
						UserOauth.of(user, OAuthProvider.KAKAO, "local-" + user.getId(), null, null, null)
				));

		String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail());
		String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());
		LocalDateTime expiresAt = LocalDateTime.now().plusNanos(jwtTokenProvider.getRefreshTokenExpirationMs() * 1_000_000);
		userOauth.updateTokens(accessToken, refreshToken, expiresAt);

		return new TokenResponse(accessToken, refreshToken);
	}
}

