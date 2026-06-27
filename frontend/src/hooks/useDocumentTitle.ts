import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

export const useDocumentTitle = () => {
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = t("page_title.home");

    if (path === "/") {
      title = t("page_title.home");
    } else if (path === "/signin") {
      title = t("page_title.signin");
    } else if (path === "/dashboard") {
      title = t("page_title.dashboard");
    } else if (path === "/dashboard/practice") {
      title = t("page_title.practice");
    } else if (path === "/dashboard/practice/processing") {
      title = t("page_title.processing");
    } else if (path === "/dashboard/history") {
      title = t("page_title.history");
    } else if (path === "/dashboard/myinfo") {
      title = t("page_title.myinfo");
    } else if (
      path.startsWith("/dashboard/history/") &&
      path.endsWith("/analytics")
    ) {
      title = t("page_title.analytics");
    }

    document.title = title;
  }, [location, t]);
};
