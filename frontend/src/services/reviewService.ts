import api from "../lib/api";
import type {
  ReviewListResponse,
  ReviewDetailResponse,
  CreateReviewRequest,
  CreateCommentRequest,
  CommentResponse,
  ReactionSummary,
  ToggleReactionRequest,
} from "../types";

export const reviewService = {
  getReviews: async (page = 0): Promise<ReviewListResponse[]> => {
    const res = await api.get(`/api/v1/reviews?page=${page}&size=20`);
    return res.data.data.content;
  },

  getReview: async (reviewId: number): Promise<ReviewDetailResponse> => {
    const res = await api.get(`/api/v1/reviews/${reviewId}`);
    return res.data.data;
  },

  createReview: async (
    data: CreateReviewRequest,
  ): Promise<ReviewDetailResponse> => {
    const res = await api.post("/api/v1/reviews", data);
    return res.data.data;
  },

  deleteReview: async (reviewId: number): Promise<void> => {
    await api.delete(`/api/v1/reviews/${reviewId}`);
  },

  createComment: async (
    reviewId: number,
    data: CreateCommentRequest,
  ): Promise<CommentResponse> => {
    const res = await api.post(`/api/v1/reviews/${reviewId}/comments`, data);
    return res.data.data;
  },

  createReply: async (
    reviewId: number,
    commentId: number,
    data: CreateCommentRequest,
  ): Promise<CommentResponse> => {
    const res = await api.post(
      `/api/v1/reviews/${reviewId}/comments/${commentId}/replies`,
      data,
    );
    return res.data.data;
  },

  deleteComment: async (
    reviewId: number,
    commentId: number,
  ): Promise<void> => {
    await api.delete(`/api/v1/reviews/${reviewId}/comments/${commentId}`);
  },

  toggleReviewReaction: async (
    reviewId: number,
    data: ToggleReactionRequest,
  ): Promise<ReactionSummary> => {
    const res = await api.post(
      `/api/v1/reviews/${reviewId}/reactions`,
      data,
    );
    return res.data.data;
  },

  toggleCommentReaction: async (
    reviewId: number,
    commentId: number,
    data: ToggleReactionRequest,
  ): Promise<ReactionSummary> => {
    const res = await api.post(
      `/api/v1/reviews/${reviewId}/comments/${commentId}/reactions`,
      data,
    );
    return res.data.data;
  },
};
