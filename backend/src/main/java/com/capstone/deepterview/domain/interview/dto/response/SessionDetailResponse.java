package com.capstone.deepterview.domain.interview.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import com.capstone.deepterview.domain.interview.domain.SessionType;

public record SessionDetailResponse(
		Long sessionId,
		String jobCategoryName,
		String jobTitle,
		int careerYears,
		SessionType sessionType,
		SessionStatus status,
		int totalQuestions,
		LocalDateTime startedAt,
		LocalDateTime endedAt,
		List<QuestionResponse> questions) {
	public static SessionDetailResponse of(InterviewSession session, List<QuestionResponse> questions) {
		return new SessionDetailResponse(
				session.getId(),
				session.getJobCategory().getName(),
				session.getJobTitle(),
				session.getCareerYears(),
				session.getSessionType(),
				session.getStatus(),
				session.getTotalQuestions(),
				session.getStartedAt(),
				session.getEndedAt(),
				questions);
	}
}
