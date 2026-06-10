package com.capstone.deepterview.domain.member.controller;

import com.capstone.deepterview.domain.member.dto.request.TestLoginRequest;
import com.capstone.deepterview.domain.member.dto.response.TokenResponse;
import com.capstone.deepterview.domain.member.service.AuthService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "로컬 인증 테스트용 컨트롤러")
@Profile("local")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class LocalTestAuthController {

	private final AuthService authService;

	@PostMapping("/test-login")
	@Operation(
			summary = "테스트용 로그인 API"
	)
	public ApiResponse<TokenResponse> testLogin(@Valid @RequestBody TestLoginRequest request) {
		return ApiResponse.success(authService.testLogin(request.email()));
	}
}

