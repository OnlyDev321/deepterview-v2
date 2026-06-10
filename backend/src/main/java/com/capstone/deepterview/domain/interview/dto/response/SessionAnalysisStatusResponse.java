package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.SessionStatus;

public record SessionAnalysisStatusResponse(
        Long sessionId,
        SessionStatus status,
        int totalQuestions,
        int answeredCount,
        int answersWithVideoCount,
        int analysesReadyCount,
        boolean feedbackReportExists) {
}
