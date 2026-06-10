import api from "../lib/api";
import type { ApiResponse, SessionReport } from "../types";

export const reportService = {
  getSessionReport: async (sessionId: number): Promise<SessionReport> => {
    const res = await api.get<ApiResponse<SessionReport>>(
      `/api/v1/sessions/${sessionId}/report`,
    );
    return res.data.data;
  },

  createSessionReport: async (sessionId: number): Promise<SessionReport> => {
    const res = await api.post<ApiResponse<SessionReport>>(
      `/api/v1/sessions/${sessionId}/report`,
    );
    return res.data.data;
  },
};
