import api from "../lib/api";
import type { JobCategory, ApiResponse } from "../types";

const I18N_TO_LANG: Record<string, string> = {
  ko: "ko",
  en: "en",
  vi: "vi",
};

export const jobCategoryService = {
  getJobCategories: async (uiLang?: string): Promise<JobCategory[]> => {
    const lang = uiLang ? I18N_TO_LANG[uiLang] || "ko" : "ko";
    const res = await api.get<ApiResponse<JobCategory[]>>("/api/v1/job-categories", {
      params: { lang },
    });
    return res.data.data;
  },
};
