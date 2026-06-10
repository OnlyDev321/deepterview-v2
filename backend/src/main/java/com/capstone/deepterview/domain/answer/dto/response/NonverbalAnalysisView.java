package com.capstone.deepterview.domain.answer.dto.response;

import com.capstone.deepterview.domain.answer.domain.Emotion;

import java.util.Map;

public record NonverbalAnalysisView(
		Double eyeContactScore,
		Double confidenceScore,
		Double anxietyScore,
		Double smileRatio,
		Double headStabilityScore,
		Emotion dominantEmotion,
		Map<String, Double> emotionDistribution,
		String feedback
) {
}
