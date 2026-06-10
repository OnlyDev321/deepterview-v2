package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.InterviewSession;
import com.capstone.deepterview.domain.interview.domain.SessionStatus;

import java.time.LocalDateTime;
import java.util.List;

public record CreateSessionResponse(
		Long sessionId,
		SessionStatus status,
		List<QuestionResponse> questions,
		LocalDateTime createdAt
) {
	public static CreateSessionResponse of(InterviewSession session, List<QuestionResponse> questions) {
		return new CreateSessionResponse(
				session.getId(),
				session.getStatus(),
				questions,
				session.getCreatedAt()
		);
	}
}

