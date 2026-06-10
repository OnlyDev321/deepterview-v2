import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://52.78.137.153:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor cho Request: Tự động thêm Token vào Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accesstoken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor cho Response: Xử lý lỗi 401 (Hết hạn Token)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu mã lỗi là 401 và chưa từng retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshtoken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi API reissue để lấy cặp token mới
        const res = await axios.post(`${API_BASE_URL}/api/v1/auth/reissue`, {
          refreshToken: refreshToken,
        });

        if (res.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            res.data.data;

          // Lưu token mới vào localStorage
          localStorage.setItem("accesstoken", newAccessToken);
          localStorage.setItem("refreshtoken", newRefreshToken);

          // Cập nhật lại Authorization header cho request cũ và thực thi lại
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh token cũng hết hạn hoặc có lỗi khác -> Logout
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        localStorage.removeItem("user");

        // Chuyển hướng về trang login (hoặc reload để AuthProvider xử lý)
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
