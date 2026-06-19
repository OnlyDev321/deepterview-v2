package com.capstone.deepterview.domain.review.dto.response;

import com.capstone.deepterview.domain.review.domain.Review;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ReviewDetailResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorProfileImageUrl,
        String content,
        List<CommentResponse> comments,
        Map<String, Long> reactions,
        String myReaction,
        LocalDateTime createdAt
) {
    public static ReviewDetailResponse of(Review review, List<CommentResponse> comments, Map<String, Long> reactions, String myReaction) {
        return new ReviewDetailResponse(
                review.getId(),
                review.getAuthor().getId(),
                review.getAuthor().getName(),
                review.getAuthor().getProfileImageUrl(),
                review.getContent(),
                comments,
                reactions,
                myReaction,
                review.getCreatedAt()
        );
    }
}
