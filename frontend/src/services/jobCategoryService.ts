import api from "../lib/api";
import type { JobCategory, ApiResponse } from "../types";

export const jobCategoryService = {
  getJobCategories: async (): Promise<JobCategory[]> => {
    const res = await api.get<ApiResponse<JobCategory[]>>("/api/v1/job-categories");
    return res.data.data;
  },
};
