import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../../services/AuthContext";
import { reviewService } from "../../services/reviewService";
import type { ReviewListResponse } from "../../types";
import ReviewModal from "../review/ReviewModal";
import { MessageCircle, Plus } from "lucide-react";
import { getImageUrl } from "../../lib/api";

const TestimonialsSection = () => {
  const { isLogged } = useContext(AuthContext);
  const [reviews, setReviews] = useState<ReviewListResponse[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(
    null,
  );
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reviewService.getReviews().then(setReviews).catch(console.error);
  }, []);

  const handleWriteReview = async () => {
    if (!writeContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newReview = await reviewService.createReview({
        content: writeContent.trim(),
      });
      setReviews((prev) => [
        {
          id: newReview.id,
          authorId: newReview.authorId,
          authorName: newReview.authorName,
          authorProfileImageUrl: newReview.authorProfileImageUrl,
          content: newReview.content,
          commentCount: 0,
          reactions: {},
          createdAt: newReview.createdAt,
        },
        ...prev,
      ]);
      setWriteContent("");
      setShowWriteModal(false);
    } catch {
      alert("후기 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex w-full max-w-[1280px] flex-col gap-12 scroll-mt-24 px-6 pt-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-4">
          <h2 className="text-3xl font-bold tracking-[-0.025em] text-[#e1e2e7] sm:text-4xl">
            <span className="block leading-10 text-[#cebdff]">사용자 후기</span>
          </h2>
          <p className="text-base leading-[26px] text-[#cbc3d7]">
            Deepterview와 함께한 사용자들의 생생한 경험을 들어보세요.
          </p>
        </div>
        {isLogged && (
          <button
            onClick={() => setShowWriteModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-[#9B7FED] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8a6fe0] transition-colors"
          >
            <Plus size={18} />
            후기 작성하기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, index) => (
          <motion.button
            key={review.id}
            onClick={() => setSelectedReviewId(review.id)}
            className="text-left rounded-3xl border border-[rgba(255,255,255,0.05)] bg-[rgba(12,14,18,0.6)] p-6 backdrop-blur-[20px] hover:border-[#cebdff]/20 transition-all hover:bg-[rgba(12,14,18,0.8)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full bg-[#323539] flex items-center justify-center overflow-hidden shrink-0">
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
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#e1e2e7] truncate">
                  {review.authorName}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#cbc3d7]/80 leading-relaxed line-clamp-4">
              {review.content}
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[#cbc3d7]/40">
              <MessageCircle size={14} />
              <span className="text-xs">{review.commentCount}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {reviews.length === 0 && (
        <p className="text-center text-[#cbc3d7]/40 py-12">
          아직 작성된 후기가 없습니다.
          {isLogged && " 첫 후기를 작성해보세요!"}
        </p>
      )}

      {selectedReviewId && (
        <ReviewModal
          reviewId={selectedReviewId}
          onClose={() => setSelectedReviewId(null)}
          onDeleted={(id) => setReviews((prev) => prev.filter((r) => r.id !== id))}
        />
      )}

      {showWriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowWriteModal(false)}
          />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-3xl border border-[#494454]/20 bg-[#191c1f] p-6 shadow-xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-bold text-[#e1e2e7] mb-4">
              후기 작성
            </h3>
            <textarea
              value={writeContent}
              onChange={(e) => setWriteContent(e.target.value)}
              placeholder="Deepterview를 사용한 경험을 공유해주세요..."
              rows={6}
              className="w-full bg-[#111417] border border-[#494454]/20 rounded-2xl py-3 px-4 text-sm text-[#e1e2e7] outline-none focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowWriteModal(false)}
                className="rounded-xl border border-[#494454]/20 px-5 py-2.5 text-sm text-[#cbc3d7] hover:text-[#e1e2e7] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleWriteReview}
                disabled={!writeContent.trim() || submitting}
                className="rounded-xl bg-[#9B7FED] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#8a6fe0] transition-colors"
              >
                {submitting ? "작성 중..." : "등록"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default TestimonialsSection;
