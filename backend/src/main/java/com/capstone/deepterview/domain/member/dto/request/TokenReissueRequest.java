package com.capstone.deepterview.domain.member.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TokenReissueRequest(
		@NotBlank(message = "refreshToken은 필수입니다.")
		String refreshToken
) {
}

