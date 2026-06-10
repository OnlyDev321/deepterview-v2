package com.capstone.deepterview.domain.member.repository;

import com.capstone.deepterview.domain.member.domain.OAuthProvider;
import com.capstone.deepterview.domain.member.domain.UserOauth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserOauthRepository extends JpaRepository<UserOauth, Long> {
	Optional<UserOauth> findByProviderAndProviderId(OAuthProvider provider, String providerId);
	Optional<UserOauth> findFirstByUser_Id(Long userId);

	Optional<UserOauth> findByRefreshToken(String refreshToken);

	Optional<UserOauth> findByRefreshTokenAndTokenExpiresAtAfter(String refreshToken, LocalDateTime now);
}

