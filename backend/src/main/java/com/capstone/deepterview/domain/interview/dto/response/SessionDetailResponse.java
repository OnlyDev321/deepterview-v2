package com.capstone.deepterview.domain.interview.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.capstone.deepterview.domain.interview.domain.AnswerLanguage;
import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.JobCategoryTranslation;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;
import com.capstone.deepterview.domain.interview.domain.SessionType;

public record SessionDetailResponse(
		Long sessionId,
		String jobCategoryName,
		String jobTitle,
		int careerYears,
		SessionType sessionType,
		AnswerLanguage answerLanguage,
		SessionStatus status,
		int totalQuestions,
		LocalDateTime startedAt,
		LocalDateTime endedAt,
		List<QuestionResponse> questions,
		String shareToken,
		boolean shareEnabled) {
	public static SessionDetailResponse of(InterviewSession session, List<QuestionResponse> questions, Map<Long, JobCategoryTranslation> translationMap) {
		String name = session.getJobCategory().getName();
		if (translationMap != null) {
			JobCategoryTranslation t = translationMap.get(session.getJobCategory().getId());
			if (t != null && t.getName() != null) {
				name = t.getName();
			}
		}
		return new SessionDetailResponse(
				session.getId(),
				name,
				session.getJobTitle(),
				session.getCareerYears(),
				session.getSessionType(),
				session.getAnswerLanguage(),
				session.getStatus(),
				session.getTotalQuestions(),
				session.getStartedAt(),
				session.getEndedAt(),
				questions,
				session.getShareToken(),
				session.isShareEnabled());
	}
}
