package com.capstone.deepterview.domain.answer.dto.response;

import java.util.Map;

public record SpeechAnalysisView(
		Double wpm,
		Integer fillerCount,
		Map<String, Integer> fillerWords,
		Double silenceRatio,
		Double paceScore,
		Double clarityScore,
		String feedback
) {
}
