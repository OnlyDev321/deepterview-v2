package com.capstone.deepterview.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "회원가입 요청 DTO")
public record RegisterRequest(
		@Schema(description = "로그인 ID")
		@NotBlank(message = "아이디는 필수 입력 항목입니다.")
		String id,

		@Schema(description = "비밀번호")
		@NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
		String password
) {
}
