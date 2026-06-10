package com.capstone.deepterview.domain.answer.dto.response;

import com.capstone.deepterview.domain.answer.domain.Answer;
import com.capstone.deepterview.domain.answer.domain.CompletionStatus;

import java.time.LocalDateTime;

public record SubmitAnswerResponse(
		Long answerId,
		Long questionId,
		CompletionStatus completionStatus,
		String analysisStatus,
		LocalDateTime createdAt
) {
	public static SubmitAnswerResponse of(Answer answer) {
		return new SubmitAnswerResponse(
				answer.getId(),
				answer.getQuestion().getId(),
				answer.getCompletionStatus(),
				"PROCESSING",
				answer.getCreatedAt()
		);
	}
}
