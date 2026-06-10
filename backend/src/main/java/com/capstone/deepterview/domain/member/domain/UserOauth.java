package com.capstone.deepterview.domain.member.domain;

import com.capstone.deepterview.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(
		name = "user_oauth",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_user_oauth_provider", columnNames = {"provider", "provider_id"})
		}
)
@SQLRestriction("deleted_at is null")
public class UserOauth extends BaseTimeEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "provider", nullable = false, length = 20)
	private OAuthProvider provider;

	@Column(name = "provider_id", nullable = false, length = 255)
	private String providerId;

	@Lob
	@Column(name = "access_token")
	private String accessToken;

	@Lob
	@Column(name = "refresh_token")
	private String refreshToken;

	@Column(name = "token_expires_at")
	private LocalDateTime tokenExpiresAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	protected UserOauth() {
	}

	public static UserOauth of(
			User user,
			OAuthProvider provider,
			String providerId,
			String accessToken,
			String refreshToken,
			LocalDateTime tokenExpiresAt
	) {
		UserOauth oauth = new UserOauth();
		oauth.user = user;
		oauth.provider = provider;
		oauth.providerId = providerId;
		oauth.accessToken = accessToken;
		oauth.refreshToken = refreshToken;
		oauth.tokenExpiresAt = tokenExpiresAt;
		return oauth;
	}

	public void updateTokens(String accessToken, String refreshToken, LocalDateTime tokenExpiresAt) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.tokenExpiresAt = tokenExpiresAt;
	}

	public void clearRefreshToken() {
		this.refreshToken = null;
		this.tokenExpiresAt = null;
	}

	public void softDelete(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
}

