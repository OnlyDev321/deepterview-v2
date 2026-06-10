import api from "../lib/api";
import type { ApiResponse, SubmitAnswerResponse, AnswerAnalysis } from "../types";

export interface SubmitAnswerParams {
  questionId: number;
  transcript: string;
  durationSec: number;
  completionStatus: "COMPLETED" | "SKIPPED" | "TIMEOUT";
}

export const answerService = {
  submitAnswer: async (params: SubmitAnswerParams): Promise<SubmitAnswerResponse> => {
    const res = await api.post<ApiResponse<SubmitAnswerResponse>>("/api/v1/answers", params);
    return res.data.data;
  },

  uploadAnswerVideo: async (answerId: number, videoBlob: Blob): Promise<void> => {
    const formData = new FormData();
    formData.append("video", videoBlob, `answer_${answerId}.webm`);

    await api.post<ApiResponse<void>>(`/api/v1/answers/${answerId}/video`, formData);
  },

  getAnalysis: async (answerId: number): Promise<AnswerAnalysis> => {
    const res = await api.get<ApiResponse<AnswerAnalysis>>(
      `/api/v1/answers/${answerId}/analysis`,
    );
    return res.data.data;
  },
};
