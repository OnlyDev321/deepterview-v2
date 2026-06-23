import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "Deepterview | AI 기반 모의 면접 플랫폼",
  "/signin": "로그인 | Deepterview",
  "/dashboard": "대시보드 | Deepterview",
  "/dashboard/practice": "면접 연습 설정 | Deepterview",
  "/dashboard/practice/processing": "면접 진행 중 | Deepterview",
  "/dashboard/history": "면접 내역 | Deepterview",
  "/dashboard/myinfo": "내 정보 | Deepterview",
};

export const useDocumentTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Deepterview | AI 기반 모의 면접 플랫폼";

    // Matching static routes
    if (routeTitles[path]) {
      title = routeTitles[path];
    } else if (path.startsWith("/dashboard/history/") && path.endsWith("/analytics")) {
      title = "면접 분석 결과 | Deepterview";
    }

    document.title = title;
  }, [location]);
};
