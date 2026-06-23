import api, { API_BASE_URL } from "../lib/api";
import type { User } from "../types";

export const authService = {
  getProfile: async (): Promise<User> => {
    const res = await api.get("/api/v1/users/me");
    return res.data.data;
  },

  getGoogleAuthUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
  getKakaoAuthUrl: () => `${API_BASE_URL}/oauth2/authorization/kakao`,
  deleteAccount: async (): Promise<void> => {
    await api.delete("/api/v1/users/me");
  },
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const res = await api.patch("/api/v1/users/me", profileData);
    return res.data.data;
  },
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/api/v1/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data;
  },
  login: async (id: string, password: string): Promise<any> => {
    const res = await api.post("/api/v1/auth/login", { id, password });
    return res.data.data;
  },
  register: async (id: string, password: string): Promise<any> => {
    const res = await api.post("/api/v1/auth/register", { id, password });
    return res.data.data;
  },
};
