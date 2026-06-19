import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../services/AuthContext";
import { reviewService } from "../../services/reviewService";
import type { ReviewDetailResponse, CommentResponse, Emoji } from "../../types";
import { X, MessageCircle, Send, Trash2, Reply } from "lucide-react";

const EMOJIS: { emoji: Emoji; label: string }[] = [
  { emoji: "LIKE", label: "👍" },
  { emoji: "LOVE", label: "❤️" },
  { emoji: "HAHA", label: "😂" },
  { emoji: "WOW", label: "😮" },
  { emoji: "SAD", label: "😢" },
  { emoji: "ANGRY", label: "😡" },
];

interface ReviewModalProps {
  reviewId: number;
  onClose: () => void;
  onDeleted?: (reviewId: number) => void;
}

const EmojiRow = ({
  reactions,
  myReaction,
  onToggle,
  size = "sm",
}: {
  reactions: Record<string, number>;
  myReaction: string | null;
  onToggle?: (emoji: Emoji) => void;
  size?: "sm" | "xs";
}) => (
  <div className={`flex gap-1 flex-wrap ${size === "xs" ? "mt-1.5" : "mt-3"}`}>
    {EMOJIS.map(({ emoji, label }) => {
      const count = reactions[emoji] ?? 0;
      const isActive = myReaction === emoji;
      return (
        <button
          key={emoji}
          onClick={() => onToggle?.(emoji)}
          disabled={!onToggle}
          className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs transition-all border ${
            isActive
              ? "border-[#9B7FED] bg-[#9B7FED]/10"
              : "border-transparent hover:border-[#494454]/30"
          } ${!onToggle ? "cursor-default" : "cursor-pointer"}`}
        >
          <span className="text-sm">{label}</span>
          {count > 0 && (
            <span
              className={`font-medium tabular-nums ${isActive ? "text-[#cebdff]" : "text-[#cbc3d7]/50"}`}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const CommentItem = ({
  comment,
  reviewId,
  currentUserId,
  isLogged,
  depth = 0,
  onCommentDeleted,
}: {
  comment: CommentResponse;
  reviewId: number;
  currentUserId: number | undefined;
  isLogged: boolean;
  depth: number;
  onCommentDeleted: (commentId: number) => void;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalComment(comment);
  }, [comment]);

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newReply = await reviewService.createReply(
        reviewId,
        localComment.id,
        { content: replyText.trim() },
      );
      setLocalComment((prev) => ({
        ...prev,
        replies: [...prev.replies, newReply],
      }));
      setReplyText("");
      setShowReply(false);
    } catch {
      alert("답글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await reviewService.deleteComment(reviewId, localComment.id);
      onCommentDeleted(localComment.id);
    } catch {
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReaction = async (emoji: Emoji) => {
    try {
      const result = await reviewService.toggleCommentReaction(
        reviewId,
        localComment.id,
        { emoji },
      );
      setLocalComment((prev) => ({
        ...prev,
        reactions: result.counts,
        myReaction: result.myReaction,
      }));
    } catch {
      console.error("reaction failed");
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-8 pl-4 border-l border-[#494454]/20" : ""}`}>
      <div className="flex gap-2.5">
        <div className="size-7 shrink-0 rounded-full bg-[#323539] flex items-center justify-center overflow-hidden">
          {localComment.authorProfileImageUrl ? (
            <img src={localComment.authorProfileImageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-[#cebdff]">
              {localComment.authorName[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#e1e2e7]">
              {localComment.authorName}
            </span>
            {localComment.authorId === currentUserId && (
              <button onClick={handleDelete} className="text-[#cbc3d7]/30 hover:text-red-400 transition-colors">
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-sm text-[#cbc3d7]/80 mt-0.5 whitespace-pre-wrap">
            {localComment.content}
          </p>

          <EmojiRow
            reactions={localComment.reactions}
            myReaction={localComment.myReaction}
            onToggle={isLogged ? handleReaction : undefined}
            size="xs"
          />

          {isLogged && (
            <button
              onClick={() => { setShowReply(!showReply); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="flex items-center gap-1 mt-1 text-xs text-[#cbc3d7]/40 hover:text-[#cebdff] transition-colors"
            >
              <Reply size={12} />
              답글
            </button>
          )}

          {showReply && (
            <div className="flex gap-2 mt-2">
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder="답글 입력..."
                className="flex-1 bg-[#111417] border border-[#494454]/20 rounded-lg py-1.5 px-3 text-xs text-[#e1e2e7] outline-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || submitting}
                className="rounded-lg bg-[#9B7FED] p-1.5 text-white disabled:opacity-40 hover:bg-[#8a6fe0] transition-colors"
              >
                <Send size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {localComment.replies.map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentItem
            comment={reply}
            reviewId={reviewId}
            currentUserId={currentUserId}
            isLogged={isLogged}
            depth={1}
            onCommentDeleted={(id) => {
              setLocalComment((prev) => ({
                ...prev,
                replies: prev.replies.filter((r) => r.id !== id),
              }));
            }}
          />
        </div>
      ))}
    </div>
  );
};

const ReviewModal = ({ reviewId, onClose, onDeleted }: ReviewModalProps) => {
  const { isLogged, user } = useContext(AuthContext);
  const [review, setReview] = useState<ReviewDetailResponse | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reviewService.getReview(reviewId).then((data) => {
      setReview(data);
      setLoading(false);
    });
  }, [reviewId]);

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await reviewService.createComment(reviewId, {
        content: commentText.trim(),
      });
      setReview((prev) =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : prev,
      );
      setCommentText("");
    } catch {
      alert("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm("후기를 삭제하시겠습니까?")) return;
    try {
      await reviewService.deleteReview(reviewId);
      onDeleted?.(reviewId);
      onClose();
    } catch {
      alert("후기 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReviewReaction = async (emoji: Emoji) => {
    if (!review) return;
    try {
      const result = await reviewService.toggleReviewReaction(reviewId, { emoji });
      setReview((prev) =>
        prev ? { ...prev, reactions: result.counts, myReaction: result.myReaction } : prev,
      );
    } catch {
      console.error("reaction failed");
    }
  };

  const handleCommentDeleted = (commentId: number) => {
    setReview((prev) =>
      prev
        ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
        : prev,
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[#494454]/20 bg-[#191c1f] p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-[#cbc3d7]/60 hover:text-[#e1e2e7] transition-colors"
          >
            <X size={20} />
          </button>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="size-8 animate-spin rounded-full border-2 border-[#9B7FED] border-t-transparent" />
            </div>
          ) : review ? (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="size-10 shrink-0 rounded-full bg-[#323539] flex items-center justify-center overflow-hidden">
                  {review.authorProfileImageUrl ? (
                    <img src={review.authorProfileImageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-[#cebdff]">
                      {review.authorName[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#e1e2e7]">{review.authorName}</span>
                    {review.authorId === user?.id && (
                      <button onClick={handleDeleteReview} className="text-[#cbc3d7]/40 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-[#cbc3d7] leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                  <EmojiRow
                    reactions={review.reactions}
                    myReaction={review.myReaction}
                    onToggle={isLogged ? handleReviewReaction : undefined}
                  />
                </div>
              </div>

              <div className="border-t border-[#494454]/20 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={16} className="text-[#cebdff]" />
                  <span className="text-sm text-[#cbc3d7]">댓글 {review.comments.length}개</span>
                </div>

                <div className="space-y-4 mb-4">
                  {review.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      reviewId={reviewId}
                      currentUserId={user?.id}
                      isLogged={isLogged}
                      depth={0}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))}
                  {review.comments.length === 0 && (
                    <p className="text-center text-sm text-[#cbc3d7]/40 py-4">
                      첫 번째 댓글을 남겨보세요
                    </p>
                  )}
                </div>

                {isLogged ? (
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleComment()}
                      placeholder="댓글 입력..."
                      className="flex-1 bg-[#111417] border border-[#494454]/20 rounded-xl py-2.5 px-4 text-sm text-[#e1e2e7] outline-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all"
                    />
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim() || submitting}
                      className="rounded-xl bg-[#9B7FED] p-2.5 text-white disabled:opacity-40 hover:bg-[#8a6fe0] transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-[#cbc3d7]/50 py-2">
                    댓글을 작성하려면 로그인해주세요
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-[#cbc3d7]">후기를 불러올 수 없습니다.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
