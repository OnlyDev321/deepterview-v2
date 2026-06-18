package com.capstone.deepterview.domain.member.controller;

import com.capstone.deepterview.domain.member.dto.request.UpdateProfileRequest;
import com.capstone.deepterview.domain.member.dto.response.MeResponse;
import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.domain.member.service.MemberService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "유저 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

	private final MemberService memberService;

	@GetMapping("/me")
	@Operation(
			summary = "내 정보 조회 API",
			description = "이름, 닉네임, 프로필 사진 등의 내 정보를 조회합니다."
	)
	public ApiResponse<MeResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
		return ApiResponse.success(memberService.getMe(principal.getId()));
	}

	@PatchMapping("/me")
	@Operation(
			summary = "내 프로필 업데이트 API",
			description = "소개(bio) 및 프로필 이미지를 업데이트합니다. 이름과 이메일은 변경할 수 없습니다."
	)
	public ApiResponse<MeResponse> updateProfile(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestBody UpdateProfileRequest request
	) {
		return ApiResponse.success(memberService.updateProfile(principal.getId(), request));
	}

	@DeleteMapping("/me")
	@Operation(
			summary = "회원 탈퇴 API",
			description = "Soft Delete를 적용하여 User의 deletedAt 필드를 now로 업데이트 합니다."
	)
	public ApiResponse<Void> withdraw(@AuthenticationPrincipal UserPrincipal principal) {
		memberService.withdraw(principal.getId());
		return ApiResponse.successMessage("회원 탈퇴가 완료되었습니다.");
	}
}

