package com.capstone.deepterview.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "프로필 업데이트 요청 DTO")
public record UpdateProfileRequest(
        @Schema(description = "소개글")
        String bio,

        @Schema(description = "프로필 이미지 URL")
        String profileImageUrl
) {
}
