package com.capstone.deepterview.domain.answer.dto.request;

import com.capstone.deepterview.domain.answer.domain.Emotion;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record NonverbalAnalysisCallbackRequest(
		@NotNull(message = "answerId는 필수입니다.")
		Long answerId,
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
