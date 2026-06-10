package com.capstone.deepterview.domain.member.dto.response;

public record TokenResponse(
		String accessToken,
		String refreshToken
) {
}

