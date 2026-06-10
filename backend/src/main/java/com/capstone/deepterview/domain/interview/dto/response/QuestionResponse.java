package com.capstone.deepterview.domain.interview.dto.response;

import com.capstone.deepterview.domain.interview.domain.Question;
import com.capstone.deepterview.domain.interview.domain.QuestionType;

public record QuestionResponse(
		Long id,
		int orderNum,
		String content,
		QuestionType questionType,
		int timeLimitSec,
		Long answerId,
		String answerText
) {
	public static QuestionResponse from(Question question) {
		return new QuestionResponse(
				question.getId(),
				question.getOrderNum(),
				question.getContent(),
				question.getQuestionType(),
				question.getTimeLimitSec(),
				question.getAnswer() != null ? question.getAnswer().getId() : null,
				question.getAnswer() != null ? question.getAnswer().getTranscript() : null
		);
	}
}

