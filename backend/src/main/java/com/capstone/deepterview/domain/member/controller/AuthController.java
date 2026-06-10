package com.capstone.deepterview.domain.member.controller;

import com.capstone.deepterview.domain.member.dto.request.LogoutRequest;
import com.capstone.deepterview.domain.member.dto.request.TokenReissueRequest;
import com.capstone.deepterview.domain.member.dto.response.TokenResponse;
import com.capstone.deepterview.domain.member.service.AuthService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "인증 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	@PostMapping("/reissue")
	@Operation(
			summary = "토큰 재발급 API",
			description = "리프레쉬 토큰으로 액세스 토큰을 재발급합니다."
	)
	public ApiResponse<TokenResponse> reissue(@Valid @RequestBody TokenReissueRequest request) {
		return ApiResponse.success(authService.reissue(request.refreshToken()));
	}

	@PostMapping("/logout")
	@Operation(
			summary = "로그아웃 API",
			description = "리프레쉬 토큰을 삭제합니다."
	)
	public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request) {
		authService.logout(request.refreshToken());
		return ApiResponse.successMessage("로그아웃 되었습니다.");
	}
}

