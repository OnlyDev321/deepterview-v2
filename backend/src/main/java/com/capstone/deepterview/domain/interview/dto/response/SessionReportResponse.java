package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.SessionType;
import com.capstone.deepterview.domain.report.domain.FeedbackReport;
import com.capstone.deepterview.domain.report.domain.Grade;

import java.time.LocalDateTime;

public record SessionReportResponse(
		Long sessionId,
		String jobTitle,
		SessionType sessionType,
		Float speechScore,
		Float nonverbalScore,
		Float contentScore,
		Float overallScore,
		Grade grade,
		String strengthSummary,
		String weaknessSummary,
		String improvementPriority,
		String aiSummary,
		LocalDateTime createdAt
) {
	public static SessionReportResponse of(FeedbackReport report) {
		var session = report.getSession();
		return new SessionReportResponse(
				session.getId(),
				session.getJobTitle(),
				session.getSessionType(),
				report.getSpeechScore(),
				report.getNonverbalScore(),
				report.getContentScore(),
				report.getOverallScore(),
				report.getGrade(),
				report.getStrengthSummary(),
				report.getWeaknessSummary(),
				report.getImprovementPriority(),
				report.getAiSummary(),
				report.getCreatedAt()
		);
	}
}
