package com.capstone.deepterview.domain.interview.controller;

import com.capstone.deepterview.domain.interview.dto.response.JobCategoryResponse;
import com.capstone.deepterview.domain.interview.service.InterviewService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "직무 카테고리 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/job-categories")
public class JobCategoryController {

	private final InterviewService interviewService;

	@GetMapping
	@Operation(
			summary = "직무 카테고리 조회 API",
			description = "직무 카테고리를 리스트 형태로 반환합니다. lang 파라미터로 번역 언어를 지정할 수 있습니다 (en, vi)."
	)
	public ApiResponse<List<JobCategoryResponse>> getJobCategories(
			@RequestParam(required = false) String lang) {
		return ApiResponse.success(interviewService.getJobCategories(lang));
	}
}

