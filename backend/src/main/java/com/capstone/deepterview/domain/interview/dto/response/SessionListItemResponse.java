package com.capstone.deepterview.domain.interview.dto.response;

import java.time.LocalDateTime;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import com.capstone.deepterview.domain.interview.domain.SessionType;
import com.capstone.deepterview.domain.report.domain.Grade;

public record SessionListItemResponse(
		Long sessionId,
		String jobTitle,
		SessionType sessionType,
		SessionStatus status,
		Float overallScore,
		Grade grade,
		LocalDateTime createdAt,
		LocalDateTime endedAt) {
	public static SessionListItemResponse from(InterviewSession session) {
		Float overallScore = session.getFeedbackReport() == null ? null : session.getFeedbackReport().getOverallScore();
		Grade grade = session.getFeedbackReport() == null ? null : session.getFeedbackReport().getGrade();

		return new SessionListItemResponse(
				session.getId(),
				session.getJobTitle(),
				session.getSessionType(),
				session.getStatus(),
				overallScore,
				grade,
				session.getCreatedAt(),
				session.getEndedAt());
	}
}
