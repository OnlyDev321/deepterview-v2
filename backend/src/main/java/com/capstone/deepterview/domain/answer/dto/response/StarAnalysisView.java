package com.capstone.deepterview.domain.answer.dto.response;

public record StarAnalysisView(
		Double situationScore,
		Double taskScore,
		Double actionScore,
		Double resultScore,
		Double totalScore,
		String situationFeedback,
		String taskFeedback,
		String actionFeedback,
		String resultFeedback
) {
}
