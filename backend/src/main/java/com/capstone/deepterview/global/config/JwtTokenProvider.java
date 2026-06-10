package com.capstone.deepterview.global.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {

	@Value("${jwt.secret}")
	private String secret;

	@Value("${jwt.access-token-expiration-ms}")
	private long accessTokenExpirationMs;

	@Value("${jwt.refresh-token-expiration-ms}")
	private long refreshTokenExpirationMs;

	private SecretKey secretKey;

	@PostConstruct
	public void init() {
		byte[] keyBytes;
		try {
			keyBytes = Decoders.BASE64.decode(secret);
		} catch (Exception ignored) {
			keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		}
		this.secretKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public String createAccessToken(Long userId, String email) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(accessTokenExpirationMs);

		return Jwts.builder()
				.setSubject(String.valueOf(userId))
				.claim("email", email)
				.claim("type", "ACCESS")
				.setIssuedAt(Date.from(now))
				.setExpiration(Date.from(expiry))
				.signWith(secretKey, SignatureAlgorithm.HS256)
				.compact();
	}

	public String createRefreshToken(Long userId) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(refreshTokenExpirationMs);

		return Jwts.builder()
				.setSubject(String.valueOf(userId))
				.claim("type", "REFRESH")
				.setIssuedAt(Date.from(now))
				.setExpiration(Date.from(expiry))
				.signWith(secretKey, SignatureAlgorithm.HS256)
				.compact();
	}

	public boolean validateToken(String token) {
		try {
			Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public Claims parseClaims(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(secretKey)
				.build()
				.parseClaimsJws(token)
				.getBody();
	}

	public Long getUserId(String token) {
		return Long.parseLong(parseClaims(token).getSubject());
	}

	public long getRefreshTokenExpirationMs() {
		return refreshTokenExpirationMs;
	}
}

