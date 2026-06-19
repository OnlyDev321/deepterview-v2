package com.capstone.deepterview.domain.review.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "후기 작성 요청 DTO")
public record CreateReviewRequest(
        @NotBlank(message = "내용을 입력해주세요.")
        @Schema(description = "후기 내용")
        String content
) {
}
