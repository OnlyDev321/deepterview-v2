package com.capstone.deepterview.domain.interview.controller;

import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import com.capstone.deepterview.domain.interview.dto.request.CreateSessionRequest;
import com.capstone.deepterview.domain.interview.dto.response.CreateSessionResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionAnalysisStatusResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionDetailResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionListResponse;
import com.capstone.deepterview.domain.interview.dto.response.SessionStatusResponse;
import com.capstone.deepterview.domain.interview.service.InterviewService;
import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "면접 세션 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/sessions")
public class InterviewController {

	private final InterviewService interviewService;

	@PostMapping
	public ApiResponse<CreateSessionResponse> createSession(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody CreateSessionRequest request) {
		return ApiResponse.success(interviewService.createSession(principal.getId(), request));
	}

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ApiResponse<CreateSessionResponse> createSessionMultipart(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestPart("request") @Valid CreateSessionRequest request,
			@RequestPart(value = "resume", required = false) MultipartFile resume) {
		return ApiResponse.success(interviewService.createSession(principal.getId(), request, resume));
	}

	@GetMapping
	public ApiResponse<SessionListResponse> getSessions(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size,
			@RequestParam(required = false) SessionStatus status) {
		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
		return ApiResponse.success(interviewService.getSessions(principal.getId(), status, pageable));
	}

	@GetMapping("/{sessionId}")
	@Operation(summary = "세션 단건 조회", description = "세션에서 답변한 질문들도 모두 함께 조회됩니다.")
	public ApiResponse<SessionDetailResponse> getSessionDetail(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		return ApiResponse.success(interviewService.getSessionDetail(principal.getId(), sessionId));
	}

	@PatchMapping("/{sessionId}/start")
	public ApiResponse<SessionStatusResponse> startSession(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		return ApiResponse.success(interviewService.startSession(principal.getId(), sessionId));
	}

	@PatchMapping("/{sessionId}/end")
	public ApiResponse<SessionStatusResponse> endSession(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		return ApiResponse.success(interviewService.endSession(principal.getId(), sessionId));
	}

	@DeleteMapping("/{sessionId}")
	public ApiResponse<Void> deleteSession(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		interviewService.deleteSession(principal.getId(), sessionId);
		return ApiResponse.successMessage("세션이 삭제되었습니다.");
	}

	@GetMapping("/{sessionId}/analysis-status")
	@Operation(summary = "세션 분석 진행 상태 조회", description = "답변 수, Python 분석 완료 수, 피드백 리포트 생성 여부를 반환합니다.")
	public ApiResponse<SessionAnalysisStatusResponse> getAnalysisStatus(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		return ApiResponse.success(interviewService.getAnalysisStatus(principal.getId(), sessionId));
	}

	@PostMapping(value = "/{sessionId}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@Operation(summary = "전체 면접 영상 업로드 API", description = "면접 종료 후 전체 인터뷰 영상을 업로드합니다.")
	public ApiResponse<Void> uploadSessionVideo(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId,
			@RequestParam MultipartFile video) {
		interviewService.uploadSessionVideo(principal.getId(), sessionId, video);
		return ApiResponse.successMessage("전체 면접 영상이 업로드되었습니다.");
	}

	@PostMapping("/{sessionId}/report/generate")
	@Operation(summary = "저장된 영상 Python 서버로 전송 API", description = "저장된 영상을 Python 서버로 전송하여 정밀 분석시키는 트리거 API입니다.")
	public ApiResponse<Void> generateReport(
			@AuthenticationPrincipal UserPrincipal principal,
			@PathVariable Long sessionId) {
		interviewService.generateReport(principal.getId(), sessionId);
		return ApiResponse.successMessage("정밀 분석이 시작되었습니다.");
	}
}
