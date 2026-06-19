package com.capstone.deepterview.domain.review.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "감정 표현 토글 요청 DTO")
public record ToggleReactionRequest(
        @NotBlank @Schema(description = "이모지 (LIKE, LOVE, HAHA, WOW, SAD, ANGRY)")
        String emoji
) {
}
