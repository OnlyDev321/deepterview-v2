package com.capstone.deepterview.domain.review.service;

import com.capstone.deepterview.domain.member.domain.User;
import com.capstone.deepterview.domain.member.repository.UserRepository;
import com.capstone.deepterview.domain.review.domain.Comment;
import com.capstone.deepterview.domain.review.domain.Emoji;
import com.capstone.deepterview.domain.review.domain.Reaction;
import com.capstone.deepterview.domain.review.domain.ReactionTargetType;
import com.capstone.deepterview.domain.review.domain.Review;
import com.capstone.deepterview.domain.review.dto.request.CreateCommentRequest;
import com.capstone.deepterview.domain.review.dto.request.CreateReviewRequest;
import com.capstone.deepterview.domain.review.dto.request.ToggleReactionRequest;
import com.capstone.deepterview.domain.review.dto.response.CommentResponse;
import com.capstone.deepterview.domain.review.dto.response.ReactionSummary;
import com.capstone.deepterview.domain.review.dto.response.ReviewDetailResponse;
import com.capstone.deepterview.domain.review.dto.response.ReviewListResponse;
import com.capstone.deepterview.domain.review.repository.CommentRepository;
import com.capstone.deepterview.domain.review.repository.ReactionRepository;
import com.capstone.deepterview.domain.review.repository.ReviewRepository;
import com.capstone.deepterview.global.exception.CustomException;
import com.capstone.deepterview.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReviewListResponse> getReviews(Pageable pageable) {
        Page<Review> reviews = reviewRepository.findAllWithAuthor(pageable);
        return reviews.map(review -> {
            int commentCount = commentRepository.findByReviewIdAndParentIsNullOrderByCreatedAtAsc(review.getId()).size();
            Map<String, Long> reactions = loadReactionCounts(ReactionTargetType.REVIEW, review.getId());
            return ReviewListResponse.of(review, commentCount, reactions);
        });
    }

    @Transactional(readOnly = true)
    public ReviewDetailResponse getReview(Long reviewId, Long currentUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));

        List<Comment> allComments = commentRepository.findByReviewIdOrderByCreatedAtAsc(reviewId);

        Map<Long, List<Comment>> childrenMap = allComments.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        List<Comment> topComments = allComments.stream()
                .filter(c -> c.getParent() == null)
                .toList();

        List<Long> allCommentIds = allComments.stream().map(Comment::getId).toList();
        Map<Long, Map<String, Long>> commentReactions = loadReactionsForCommentIds(allCommentIds);
        Map<Long, String> commentMyReactions = loadMyReactionsForCommentIds(allCommentIds, currentUserId);

        List<CommentResponse> commentResponses = topComments.stream()
                .map(c -> toCommentTree(c, childrenMap, commentReactions, commentMyReactions, currentUserId))
                .toList();

        ReactionSummary reviewReactions = loadReactionSummary(ReactionTargetType.REVIEW, reviewId, currentUserId);

        return ReviewDetailResponse.of(review, commentResponses, reviewReactions.counts(), reviewReactions.myReaction());
    }

    @Transactional
    public ReviewDetailResponse createReview(Long userId, CreateReviewRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Review review = Review.of(author, request.content());
        reviewRepository.save(review);
        return ReviewDetailResponse.of(review, List.of(), Map.of(), null);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));
        if (!review.getAuthor().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN, "자신의 후기만 삭제할 수 있습니다.");
        }
        review.softDelete(LocalDateTime.now());
    }

    @Transactional
    public CommentResponse createComment(Long userId, Long reviewId, CreateCommentRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));
        Comment comment = Comment.of(review, author, request.content());
        commentRepository.save(comment);
        return CommentResponse.of(comment, List.of(), Map.of(), null);
    }

    @Transactional
    public CommentResponse createReply(Long userId, Long reviewId, Long parentId, CreateCommentRequest request) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "후기를 찾을 수 없습니다."));
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다."));

        Comment actualParent = parent;
        String content = request.content();
        if (parent.getParent() != null) {
            actualParent = parent.getParent();
        }

        Comment reply = Comment.ofReply(review, author, actualParent, content);
        commentRepository.save(reply);
        return CommentResponse.of(reply, List.of(), Map.of(), null);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다."));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN, "자신의 댓글만 삭제할 수 있습니다.");
        }
        comment.softDelete(LocalDateTime.now());
    }

    @Transactional
    public ReactionSummary toggleReaction(Long userId, ReactionTargetType targetType, Long targetId, ToggleReactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다."));
        Emoji emoji = Emoji.valueOf(request.emoji());

        var existing = reactionRepository.findByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
        if (existing.isPresent()) {
            Reaction reaction = existing.get();
            if (reaction.getEmoji() == emoji) {
                reactionRepository.delete(reaction);
            } else {
                reaction.changeEmoji(emoji);
            }
        } else {
            Reaction reaction = Reaction.of(user, targetType, targetId, emoji);
            reactionRepository.save(reaction);
        }

        List<Reaction> reactions = reactionRepository.findByTargetTypeAndTargetId(targetType, targetId);
        return ReactionSummary.of(reactions, userId);
    }

    private Map<String, Long> loadReactionCounts(ReactionTargetType targetType, Long targetId) {
        List<Reaction> reactions = reactionRepository.findByTargetTypeAndTargetId(targetType, targetId);
        return reactions.stream()
                .collect(Collectors.groupingBy(r -> r.getEmoji().name(), Collectors.counting()));
    }

    private ReactionSummary loadReactionSummary(ReactionTargetType targetType, Long targetId, Long currentUserId) {
        List<Reaction> reactions = reactionRepository.findByTargetTypeAndTargetId(targetType, targetId);
        return ReactionSummary.of(reactions, currentUserId);
    }

    private Map<Long, Map<String, Long>> loadReactionsForCommentIds(List<Long> commentIds) {
        if (commentIds.isEmpty()) return Map.of();
        List<Reaction> allReactions = reactionRepository.findByTargetTypeAndTargetIdIn(ReactionTargetType.COMMENT, commentIds);
        return allReactions.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getTargetId(),
                        Collectors.groupingBy(r -> r.getEmoji().name(), Collectors.counting())
                ));
    }

    private Map<Long, String> loadMyReactionsForCommentIds(List<Long> commentIds, Long currentUserId) {
        if (currentUserId == null || commentIds.isEmpty()) return Map.of();
        return reactionRepository.findByTargetTypeAndTargetIdIn(ReactionTargetType.COMMENT, commentIds)
                .stream()
                .filter(r -> r.getUser().getId().equals(currentUserId))
                .collect(Collectors.toMap(Reaction::getTargetId, r -> r.getEmoji().name(), (a, b) -> b));
    }

    private CommentResponse toCommentTree(Comment comment, Map<Long, List<Comment>> childrenMap,
                                           Map<Long, Map<String, Long>> reactionsMap,
                                           Map<Long, String> myReactions, Long currentUserId) {
        List<Comment> descendants = new ArrayList<>();
        collectDescendants(comment.getId(), childrenMap, descendants);
        List<CommentResponse> flatReplies = descendants.stream()
                .map(child -> CommentResponse.of(child, List.of(),
                        reactionsMap.getOrDefault(child.getId(), Map.of()),
                        myReactions.getOrDefault(child.getId(), null)))
                .toList();
        return CommentResponse.of(comment, flatReplies,
                reactionsMap.getOrDefault(comment.getId(), Map.of()),
                myReactions.getOrDefault(comment.getId(), null));
    }

    private void collectDescendants(Long parentId, Map<Long, List<Comment>> childrenMap, List<Comment> result) {
        List<Comment> children = childrenMap.getOrDefault(parentId, List.of());
        for (Comment child : children) {
            result.add(child);
            collectDescendants(child.getId(), childrenMap, result);
        }
    }
}
