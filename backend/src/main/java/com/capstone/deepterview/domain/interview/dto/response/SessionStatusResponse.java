package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.SessionStatus;

import java.time.LocalDateTime;

public record SessionStatusResponse(
		Long sessionId,
		SessionStatus status,
		LocalDateTime startedAt,
		LocalDateTime endedAt
) {
	public static SessionStatusResponse started(Long sessionId, SessionStatus status, LocalDateTime startedAt) {
		return new SessionStatusResponse(sessionId, status, startedAt, null);
	}

	public static SessionStatusResponse ended(Long sessionId, SessionStatus status, LocalDateTime endedAt) {
		return new SessionStatusResponse(sessionId, status, null, endedAt);
	}
}

