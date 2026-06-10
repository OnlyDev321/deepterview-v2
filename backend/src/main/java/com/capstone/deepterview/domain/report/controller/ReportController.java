package com.capstone.deepterview.domain.report.controller;

import com.capstone.deepterview.domain.interview.dto.response.SessionReportResponse;
import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.domain.report.service.ReportService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "피드백 리포트 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/sessions")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/{sessionId}/report")
    public ApiResponse<SessionReportResponse> getReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long sessionId
    ) {
        return ApiResponse.success(reportService.getReport(principal.getId(), sessionId));
    }

    @PostMapping("/{sessionId}/report")
    @Operation(
            summary = "피드백 리포트 생성",
            description = "세션의 모든 답변을 종합하여 피드백 리포트를 생성합니다. 이미 생성된 리포트가 있으면 기존 리포트를 반환합니다."
    )
    public ApiResponse<SessionReportResponse> generateReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long sessionId
    ) {
        return ApiResponse.success(reportService.generateOrGetReport(principal.getId(), sessionId));
    }
}
