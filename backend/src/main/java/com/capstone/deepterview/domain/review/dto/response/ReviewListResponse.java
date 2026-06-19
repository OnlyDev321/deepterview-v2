package com.capstone.deepterview.domain.review.dto.response;

import com.capstone.deepterview.domain.review.domain.Review;

import java.time.LocalDateTime;
import java.util.Map;

public record ReviewListResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorProfileImageUrl,
        String content,
        int commentCount,
        Map<String, Long> reactions,
        LocalDateTime createdAt
) {
    public static ReviewListResponse of(Review review, int commentCount, Map<String, Long> reactions) {
        return new ReviewListResponse(
                review.getId(),
                review.getAuthor().getId(),
                review.getAuthor().getName(),
                review.getAuthor().getProfileImageUrl(),
                review.getContent(),
                commentCount,
                reactions,
                review.getCreatedAt()
        );
    }
}
