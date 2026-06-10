package com.capstone.deepterview.domain.answer.controller;

import com.capstone.deepterview.domain.answer.dto.request.NonverbalAnalysisCallbackRequest;
import com.capstone.deepterview.domain.answer.dto.response.NonverbalAnalysisCallbackResponse;
import com.capstone.deepterview.domain.answer.service.NonverbalAnalysisCallbackService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "비언어적 요소 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/internal")
public class InternalNonverbalAnalysisController {

	private final NonverbalAnalysisCallbackService nonverbalAnalysisCallbackService;

	@PostMapping("/nonverbal-analysis")
	@Operation(
			summary = "비언어적 요소 콜백 API",
			description = "Python 서버에서 비언어적 요소를 심층 분석한 뒤 호출하는 콜백 API입니다."
	)
	public ApiResponse<NonverbalAnalysisCallbackResponse> receiveNonverbal(
			@Valid @RequestBody NonverbalAnalysisCallbackRequest request
	) {
		return ApiResponse.success(nonverbalAnalysisCallbackService.upsert(request));
	}
}
