package com.capstone.deepterview.domain.member.dto.response;

import com.capstone.deepterview.domain.member.domain.User;

import java.time.LocalDateTime;

public record MeResponse(
		Long id,
		String email,
		String name,
		String profileImageUrl,
		String bio,
		LocalDateTime createdAt
) {
	public static MeResponse from(User user) {
		return new MeResponse(
				user.getId(),
				user.getEmail(),
				user.getName(),
				user.getProfileImageUrl(),
				user.getBio(),
				user.getCreatedAt()
		);
	}
}

