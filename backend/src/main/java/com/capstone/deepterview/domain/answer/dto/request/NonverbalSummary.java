package com.capstone.deepterview.domain.answer.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record NonverbalSummary(
    @JsonProperty("eye_contact_score") Float eyeContactScore,
    @JsonProperty("dominant_emotion") String dominantEmotion,
    @JsonProperty("emotion_distribution_json") String emotionDistributionJson,
    @JsonProperty("smile_ratio") Float smileRatio,
    @JsonProperty("anxiety_score") Float anxietyScore,
    @JsonProperty("confidence_score") Float confidenceScore,
    @JsonProperty("head_stability_score") Float headStabilityScore
) {}
