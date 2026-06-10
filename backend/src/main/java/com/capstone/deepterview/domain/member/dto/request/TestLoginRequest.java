package com.capstone.deepterview.domain.member.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record TestLoginRequest(
		@NotBlank(message = "email은 필수입니다.")
		@Email(message = "유효한 이메일 형식이 아닙니다.")
		String email
) {
}

