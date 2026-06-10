package com.capstone.deepterview.domain.answer.dto.response;

public record AnswerAnalysisResponse(
		Long answerId,
		String transcript,
		Integer durationSec,
		SpeechAnalysisView speechAnalysis,
		StarAnalysisView starAnalysis,
		NonverbalAnalysisView nonverbalAnalysis,
		LlmFeedbackView llmFeedback
) {
}
