import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../services/AuthContext";
import { reviewService } from "../../services/reviewService";
import type { ReviewDetailResponse, CommentResponse, Emoji } from "../../types";
import { X, MessageCircle, Send, Trash2, Reply, SmilePlus } from "lucide-react";
import { getImageUrl } from "../../lib/api";

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

const EmojiTrigger = ({
  myReaction,
  onToggle,
  compact = false,
}: {
  myReaction: string | null;
  onToggle?: (emoji: Emoji) => void;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const POPUP_GAP = 6;

  const updatePos = useCallback(() => {
    if (!buttonRef.current || !open) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.top - POPUP_GAP, left: rect.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        className={`flex items-center gap-1 rounded-lg transition-all ${
          compact
            ? "px-1.5 py-0.5 text-[11px] text-[#cbc3d7]/40 hover:text-[#cebdff] hover:bg-[#cebdff]/5"
            : "px-2 py-1 text-xs text-[#cbc3d7]/60 hover:text-[#cebdff] hover:bg-[#cebdff]/5"
        } ${!onToggle ? "cursor-default opacity-40" : "cursor-pointer"}`}
        disabled={!onToggle}
      >
        <SmilePlus size={compact ? 12 : 16} />
        <span>{t("review.emoji_label")}</span>
      </button>
      <AnimatePresence>
        {open && onToggle && (
          <motion.div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`fixed z-[100] flex gap-1 rounded-xl border border-[#494454]/30 bg-[#191c1f] shadow-xl ${
              compact ? "p-1.5" : "p-2"
            }`}
            style={{ top: pos.top, left: pos.left }}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => {
                  onToggle(emoji);
                  setOpen(false);
                }}
                className={`flex items-center justify-center rounded-lg text-lg hover:bg-[#323539] transition-colors cursor-pointer ${
                  compact ? "size-8" : "size-9"
                } ${
                  myReaction === emoji
                    ? "bg-[#9B7FED]/10 ring-1 ring-[#9B7FED]"
                    : ""
                }`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentItem = ({
  comment,
  reviewId,
  currentUserId,
  isLogged,
  depth = 0,
  onCommentDeleted,
  onReplyCreated,
}: {
  comment: CommentResponse;
  reviewId: number;
  currentUserId: number | undefined;
  isLogged: boolean;
  depth: number;
  onCommentDeleted: (commentId: number) => void;
  onReplyCreated?: (reply: CommentResponse) => void;
}) => {
  const { t } = useTranslation();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const REPLIES_PREVIEW_COUNT = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalComment(comment);
    setShowAllReplies(false);
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
      if (newReply.parentId === localComment.id) {
        setLocalComment((prev) => ({
          ...prev,
          replies: [...prev.replies, newReply],
        }));
      } else {
        onReplyCreated?.(newReply);
      }
      setReplyText("");
      setShowReply(false);
    } catch {
      alert(t("review.error_reply_create"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyClick = () => {
    const isOpening = !showReply;
    setShowReply(isOpening);
    if (isOpening) {
      if (depth > 0 && !replyText) {
        setReplyText(`@${localComment.authorName} `);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("review.confirm_delete"))) return;
    try {
      await reviewService.deleteComment(reviewId, localComment.id);
      onCommentDeleted(localComment.id);
    } catch {
      alert(t("review.error_delete"));
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

  const INDENT_DEPTH = 3;
  const showIndent = depth > 0 && depth <= INDENT_DEPTH;

  return (
    <div
      className={`${showIndent ? "ml-8" : ""} ${depth > 0 ? "pl-4 border-l border-[#494454]/20" : ""}`}
    >
      <div className="flex gap-2.5">
        <div className="size-7 shrink-0 rounded-full bg-[#323539] flex items-center justify-center overflow-hidden">
          {localComment.authorProfileImageUrl ? (
            <img
              src={getImageUrl(localComment.authorProfileImageUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="text-[10px] font-bold text-[#cebdff]">
              {localComment.authorName[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#e1e2e7]">
              {localComment.authorName}
            </span>
            {localComment.authorId === currentUserId && (
              <button
                onClick={handleDelete}
                className="text-[#cbc3d7]/30 hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <p className="text-sm text-[#cbc3d7]/80 mt-0.5 whitespace-pre">
            {localComment.content}
          </p>

          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <EmojiTrigger
              myReaction={localComment.myReaction}
              onToggle={isLogged ? handleReaction : undefined}
              compact
            />
            {EMOJIS.filter(
              ({ emoji }) => (localComment.reactions[emoji] ?? 0) > 0,
            ).map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => isLogged && handleReaction(emoji)}
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] border transition-all ${
                  localComment.myReaction === emoji
                    ? "border-[#9B7FED] bg-[#9B7FED]/10"
                    : "border-transparent hover:border-[#494454]/30"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`tabular-nums ${localComment.myReaction === emoji ? "text-[#cebdff]" : "text-[#cbc3d7]/50"}`}
                >
                  {localComment.reactions[emoji]}
                </span>
              </button>
            ))}
            {isLogged && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 ml-1 text-xs text-[#cbc3d7]/40 hover:text-[#cebdff] transition-colors cursor-pointer"
              >
                <Reply size={12} />
                {t("review.reply_btn")}
              </button>
            )}
          </div>

          {showReply && (
            <div className="flex gap-2 mt-2">
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={t("review.reply_placeholder")}
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

      {(showAllReplies
        ? localComment.replies
        : localComment.replies.slice(0, REPLIES_PREVIEW_COUNT)
      ).map((reply) => (
        <div key={reply.id} className="mt-3">
          <CommentItem
            comment={reply}
            reviewId={reviewId}
            currentUserId={currentUserId}
            isLogged={isLogged}
            depth={depth + 1}
            onCommentDeleted={(id) => {
              setLocalComment((prev) => ({
                ...prev,
                replies: prev.replies.filter((r) => r.id !== id),
              }));
            }}
            onReplyCreated={(newReply) => {
              if (newReply.parentId === localComment.id) {
                setLocalComment((prev) => ({
                  ...prev,
                  replies: [...prev.replies, newReply],
                }));
              } else {
                onReplyCreated?.(newReply);
              }
            }}
          />
        </div>
      ))}
      {!showAllReplies &&
        localComment.replies.length > REPLIES_PREVIEW_COUNT && (
          <button
            onClick={() => setShowAllReplies(true)}
            className="text-xs text-[#cbc3d7]/50 hover:text-[#cebdff] transition-colors mt-2 ml-8 cursor-pointer"
          >
            {t("review.reply_more", { count: localComment.replies.length - REPLIES_PREVIEW_COUNT })}
          </button>
        )}
    </div>
  );
};

const countAllComments = (comments: CommentResponse[]): number => {
  let count = 0;
  for (const c of comments) {
    count += 1 + countAllComments(c.replies);
  }
  return count;
};

const ReviewModal = ({ reviewId, onClose, onDeleted }: ReviewModalProps) => {
  const { t } = useTranslation();
  const { isLogged, user } = useContext(AuthContext);
  const [review, setReview] = useState<ReviewDetailResponse | null>(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const COMMENT_PREVIEW_COUNT = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowAllComments(false);
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
      alert(t("review.error_comment_create"));
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm(t("review.confirm_delete_review"))) return;
    try {
      await reviewService.deleteReview(reviewId);
      onDeleted?.(reviewId);
      onClose();
    } catch {
      alert(t("review.error_delete_review"));
    }
  };

  const handleReviewReaction = async (emoji: Emoji) => {
    if (!review) return;
    try {
      const result = await reviewService.toggleReviewReaction(reviewId, {
        emoji,
      });
      setReview((prev) =>
        prev
          ? { ...prev, reactions: result.counts, myReaction: result.myReaction }
          : prev,
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
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-x-auto overflow-y-auto rounded-3xl border border-[#494454]/20 bg-[#191c1f] p-6 shadow-xl"
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
                    <img
                      src={getImageUrl(review.authorProfileImageUrl)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-[#cebdff]">
                      {review.authorName[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#e1e2e7]">
                      {review.authorName}
                    </span>
                    {review.authorId === user?.id && (
                      <button
                        onClick={handleDeleteReview}
                        className="text-[#cbc3d7]/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-[#cbc3d7] leading-relaxed whitespace-pre-wrap">
                    {review.content}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-wrap border-t border-[#494454]/20 pt-3 mt-3">
                <EmojiTrigger
                  myReaction={review.myReaction}
                  onToggle={isLogged ? handleReviewReaction : undefined}
                />
                {EMOJIS.filter(
                  ({ emoji }) => (review.reactions[emoji] ?? 0) > 0,
                ).map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={() => isLogged && handleReviewReaction(emoji)}
                    className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs border transition-all ${
                      review.myReaction === emoji
                        ? "border-[#9B7FED] bg-[#9B7FED]/10"
                        : "border-transparent hover:border-[#494454]/30"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`tabular-nums ${review.myReaction === emoji ? "text-[#cebdff]" : "text-[#cbc3d7]/50"}`}
                    >
                      {review.reactions[emoji]}
                    </span>
                  </button>
                ))}
                <div className="flex items-center gap-1 text-[#cbc3d7]/50 ml-auto">
                  <MessageCircle size={14} />
                  <span className="text-xs">
                    {t("review.comment_count", { count: countAllComments(review.comments) })}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#494454]/20 pt-4 mt-3">
                <div className="space-y-4 mb-4">
                  {(showAllComments
                    ? review.comments
                    : review.comments.slice(0, COMMENT_PREVIEW_COUNT)
                  ).map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      reviewId={reviewId}
                      currentUserId={user?.id}
                      isLogged={isLogged}
                      depth={0}
                      onCommentDeleted={handleCommentDeleted}
                      onReplyCreated={(newReply) => {
                        setReview((prev) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            comments: prev.comments.map((c) =>
                              c.id === newReply.parentId
                                ? { ...c, replies: [...c.replies, newReply] }
                                : c,
                            ),
                          };
                        });
                      }}
                    />
                  ))}
                  {review.comments.length === 0 && (
                    <p className="text-center text-sm text-[#cbc3d7]/40 py-4">
                      {t("review.first_comment")}
                    </p>
                  )}
                  {!showAllComments &&
                    review.comments.length > COMMENT_PREVIEW_COUNT && (
                      <button
                        onClick={() => setShowAllComments(true)}
                        className="text-sm text-[#cbc3d7]/50 hover:text-[#cebdff] transition-colors"
                      >
                        {t("review.comment_more", { count: review.comments.length - COMMENT_PREVIEW_COUNT })}
                      </button>
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
                      placeholder={t("review.comment_placeholder")}
                      className="flex-1 bg-[#111417] border border-[#494454]/20 rounded-xl py-2.5 px-4 text-sm text-[#e1e2e7] outline-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all"
                    />
                    <button
                      onClick={handleComment}
                      disabled={!commentText.trim() || submitting}
                      className="rounded-xl bg-[#9B7FED] p-2.5 text-white disabled:opacity-40 hover:bg-[#8a6fe0] transition-colors cursor-pointer"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-[#cbc3d7]/50 py-2">
                    {t("review.login_to_comment")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center py-12 text-[#cbc3d7]">
              {t("review.load_error")}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
