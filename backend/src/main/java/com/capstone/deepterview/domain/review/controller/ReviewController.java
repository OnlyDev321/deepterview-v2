package com.capstone.deepterview.domain.review.controller;

import com.capstone.deepterview.domain.member.dto.response.UserPrincipal;
import com.capstone.deepterview.domain.review.dto.request.CreateCommentRequest;
import com.capstone.deepterview.domain.review.dto.request.CreateReviewRequest;
import com.capstone.deepterview.domain.review.dto.request.ToggleReactionRequest;
import com.capstone.deepterview.domain.review.dto.response.CommentResponse;
import com.capstone.deepterview.domain.review.dto.response.ReactionSummary;
import com.capstone.deepterview.domain.review.dto.response.ReviewDetailResponse;
import com.capstone.deepterview.domain.review.dto.response.ReviewListResponse;
import com.capstone.deepterview.domain.review.service.ReviewService;
import com.capstone.deepterview.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@Tag(name = "후기 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    @Operation(summary = "후기 목록 조회 API")
    public ApiResponse<Page<ReviewListResponse>> getReviews(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ApiResponse.success(reviewService.getReviews(pageable));
    }

    @GetMapping("/{reviewId}")
    @Operation(summary = "후기 상세 조회 API")
    public ApiResponse<ReviewDetailResponse> getReview(
            @PathVariable Long reviewId,
            Principal principal
    ) {
        Long userId = extractUserId(principal);
        return ApiResponse.success(reviewService.getReview(reviewId, userId));
    }

    @PostMapping
    @Operation(summary = "후기 작성 API")
    public ApiResponse<ReviewDetailResponse> createReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return ApiResponse.success(reviewService.createReview(principal.getId(), request));
    }

    @DeleteMapping("/{reviewId}")
    @Operation(summary = "후기 삭제 API")
    public ApiResponse<Void> deleteReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId
    ) {
        reviewService.deleteReview(principal.getId(), reviewId);
        return ApiResponse.successMessage("후기가 삭제되었습니다.");
    }

    @PostMapping("/{reviewId}/comments")
    @Operation(summary = "댓글 작성 API")
    public ApiResponse<CommentResponse> createComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ApiResponse.success(reviewService.createComment(principal.getId(), reviewId, request));
    }

    @PostMapping("/{reviewId}/comments/{commentId}/replies")
    @Operation(summary = "답글 작성 API")
    public ApiResponse<CommentResponse> createReply(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId,
            @PathVariable Long commentId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ApiResponse.success(reviewService.createReply(principal.getId(), reviewId, commentId, request));
    }

    @DeleteMapping("/{reviewId}/comments/{commentId}")
    @Operation(summary = "댓글/답글 삭제 API")
    public ApiResponse<Void> deleteComment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId,
            @PathVariable Long commentId
    ) {
        reviewService.deleteComment(principal.getId(), commentId);
        return ApiResponse.successMessage("댓글이 삭제되었습니다.");
    }

    @PostMapping("/{reviewId}/reactions")
    @Operation(summary = "후기 감정 표현 API")
    public ApiResponse<ReactionSummary> toggleReviewReaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId,
            @Valid @RequestBody ToggleReactionRequest request
    ) {
        return ApiResponse.success(reviewService.toggleReaction(
                principal.getId(), com.capstone.deepterview.domain.review.domain.ReactionTargetType.REVIEW, reviewId, request));
    }

    @PostMapping("/{reviewId}/comments/{commentId}/reactions")
    @Operation(summary = "댓글 감정 표현 API")
    public ApiResponse<ReactionSummary> toggleCommentReaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reviewId,
            @PathVariable Long commentId,
            @Valid @RequestBody ToggleReactionRequest request
    ) {
        return ApiResponse.success(reviewService.toggleReaction(
                principal.getId(), com.capstone.deepterview.domain.review.domain.ReactionTargetType.COMMENT, commentId, request));
    }

    private Long extractUserId(Principal principal) {
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        return null;
    }
}
