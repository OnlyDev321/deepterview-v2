package com.capstone.deepterview.domain.review.dto.response;

import com.capstone.deepterview.domain.review.domain.Comment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String authorProfileImageUrl,
        String content,
        List<CommentResponse> replies,
        Map<String, Long> reactions,
        String myReaction,
        LocalDateTime createdAt
) {
    public static CommentResponse of(Comment comment, List<CommentResponse> replies, Map<String, Long> reactions, String myReaction) {
        return new CommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getName(),
                comment.getAuthor().getProfileImageUrl(),
                comment.getContent(),
                replies,
                reactions,
                myReaction,
                comment.getCreatedAt()
        );
    }
}
