import { useNavigate } from "react-router-dom";
import type { NavKey } from "../types/index";
import { useLocation } from "react-router-dom";
import {
  Bell,
  LogOut,
  User,
  UserCircle,
  ChevronRight,
  Menu,
  RefreshCw,
  MessageCircle,
  SmilePlus,
  AtSign,
  Reply,
} from "lucide-react";
import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../services/AuthContext";
import { sessionService } from "../services/sessionService";
import { notificationService } from "../services/notificationService";
import {
  getNotifications as getSessionNotifications,
  getUnreadCount as getSessionUnreadCount,
  markAsRead as markSessionRead,
  markAllAsRead as markAllSessionRead,
  dismissAll as dismissAllSession,
} from "../lib/notificationTracker";
import type { AnalysisNotification } from "../lib/notificationTracker";
import type { NotificationResponse } from "../types";
import { getImageUrl } from "../lib/api";
import LanguageSwitcher from "./LanguageSwitcher";

type HeaderProps = {
  activeNav?: NavKey;
  onNavigateSection?: (key: NavKey) => void;
  onToggleSidebar?: () => void;
};

const localeMap: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  vi: "vi-VN",
};

const Header = ({
  activeNav,
  onNavigateSection,
  onToggleSidebar,
}: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLogged, logout, user } = useContext(AuthContext);

  const isLandingPage = location.pathname === "/";
  const isSignInPage = location.pathname === "/signin";
  const isDashBoardPage = location.pathname.startsWith("/dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sessionNotifs, setSessionNotifs] = useState<AnalysisNotification[]>(
    [],
  );
  const [reviewNotifs, setReviewNotifs] = useState<NotificationResponse[]>([]);
  const [notifTitles, setNotifTitles] = useState<Record<number, string>>({});
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [reviewUnread, setReviewUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const dateLocale = localeMap[i18n.language] || "ko-KR";

  const refreshNotifications = useCallback(async () => {
    setSessionNotifs(getSessionNotifications());
    try {
      const [reviews, unread] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setReviewNotifs(reviews);
      setReviewUnread(unread);
    } catch {
      // backend not available
    }
  }, []);

  useEffect(() => {
    if (!isLogged) return;
    refreshNotifications();
    const handle = setInterval(refreshNotifications, 5000);
    return () => clearInterval(handle);
  }, [isLogged, refreshNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const unreadCount = getSessionUnreadCount() + reviewUnread;

  const handleBellClick = async () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      const notifs = getSessionNotifications();
      setSessionNotifs(notifs);
      const ids = notifs.map((n) => n.sessionId);
      if (ids.length > 0) {
        setLoadingTitles(true);
        const titles: Record<number, string> = {};
        await Promise.all(
          ids.map(async (id) => {
            try {
              const detail = await sessionService.getSessionDetail(id);
              titles[id] = detail.jobTitle;
            } catch {
              titles[id] = t("header.session_title_fallback", { id });
            }
          }),
        );
        setNotifTitles((prev) => ({ ...prev, ...titles }));
        setLoadingTitles(false);
      }
    }
  };

  const confirmLeaveInterview = () => {
    if (sessionStorage.getItem("interviewActive") !== "true") return true;
    const ok = window.confirm(t("header.confirm_leave_interview"));
    if (ok) sessionStorage.removeItem("interviewActive");
    return ok;
  };

  const handleSessionNotifClick = (n: AnalysisNotification) => {
    if (!confirmLeaveInterview()) return;
    markSessionRead(n.id);
    setNotifOpen(false);
    navigate("/dashboard/history", {
      state: { focusSessionId: n.sessionId },
    });
  };

  const handleReviewNotifClick = async (n: NotificationResponse) => {
    if (!confirmLeaveInterview()) return;
    if (!n.isRead) {
      await notificationService.markAsRead(n.id);
      setReviewNotifs((prev) =>
        prev.map((r) => (r.id === n.id ? { ...r, isRead: true } : r)),
      );
      setReviewUnread((prev) => Math.max(0, prev - 1));
    }
    setNotifOpen(false);
    navigate("/", { state: { openReviewId: n.referenceId } });
  };

  const handleMarkAllRead = async () => {
    await Promise.all([
      notificationService.markAllAsRead(),
      Promise.resolve(markAllSessionRead()),
    ]);
    setReviewNotifs((prev) => prev.map((r) => ({ ...r, isRead: true })));
    setReviewUnread(0);
    setSessionNotifs(getSessionNotifications());
  };

  const handleDismissAll = async () => {
    await notificationService.deleteAllNotifications();
    dismissAllSession();
    setReviewNotifs([]);
    setSessionNotifs([]);
    setNotifTitles({});
    setReviewUnread(0);
  };

  const NOTIF_ICONS: Record<string, React.ReactNode> = {
    REVIEW_COMMENT: <MessageCircle size={14} />,
    REVIEW_REPLY: <Reply size={14} />,
    REVIEW_REACTION: <SmilePlus size={14} />,
    COMMENT_REACTION: <SmilePlus size={14} />,
    MENTION: <AtSign size={14} />,
  };

  const NOTIF_ICON_COLORS: Record<string, string> = {
    REVIEW_COMMENT: "text-blue-400",
    REVIEW_REPLY: "text-green-400",
    REVIEW_REACTION: "text-yellow-400",
    COMMENT_REACTION: "text-yellow-400",
    MENTION: "text-purple-400",
  };

  const allNotifs = [
    ...sessionNotifs.map((n) => ({ type: "session" as const, data: n })),
    ...reviewNotifs.map((n) => ({ type: "review" as const, data: n })),
  ].sort((a, b) => {
    const dateA =
      a.type === "session"
        ? new Date(a.data.completedAt).getTime()
        : new Date(a.data.createdAt).getTime();
    const dateB =
      b.type === "session"
        ? new Date(b.data.completedAt).getTime()
        : new Date(b.data.createdAt).getTime();
    return dateB - dateA;
  });

  const navLinkClass = (key: NavKey) => {
    const base =
      "border-b-2 pb-1.5 text-sm font-medium tracking-wide transition-colors";
    if (activeNav === key) {
      return `${base} border-[#cebdff] text-[#cebdff]`;
    }
    return `${base} border-transparent text-[#94a3b8] hover:text-white`;
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full shrink-0 border-b border-[rgba(206,189,255,0.1)] bg-[rgba(2,6,23,0.6)] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-[32px]">
      <div className="relative flex h-full w-full items-center justify-between px-6 sm:px-8">
        <div className="flex items-center gap-3">
          {isDashBoardPage && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-[#cbc3d7]" />
            </button>
          )}
          <button
            className="text-xl font-bold tracking-tight text-[#cebdff] cursor-pointer"
            onClick={() => navigate("/")}
          >
            Deepterview
          </button>
          <LanguageSwitcher />
        </div>

        {isLandingPage && (
          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex"
            aria-label="Primary"
          >
            <a
              href="#overview"
              className={navLinkClass("overview")}
              onClick={(e) => {
                e.preventDefault();
                onNavigateSection?.("overview");
              }}
            >
              {t("header.overview")}
            </a>
            <a
              href="#resources"
              className={navLinkClass("resources")}
              onClick={(e) => {
                e.preventDefault();

                onNavigateSection?.("resources");
              }}
            >
              {t("header.resources")}
            </a>
          </nav>
        )}
        {(isLandingPage || isSignInPage) && (
          <div className="flex items-center gap-6">
            {isLogged && isLandingPage ? (
              <div className="relative group">
                <div
                  className="absolute inset-0 rounded-full bg-purple-500 opacity-40 blur-xl group-hover:opacity-60 transition-opacity"
                  aria-hidden
                />
                <button
                  type="button"
                  className="relative z-10 flex items-center rounded-full bg-[rgba(155,127,237,0.8)] px-3 py-2.5 text-sm font-semibold text-[#31057e] transition-all hover:scale-105 hover:bg-[rgba(155,127,237,1)] active:scale-95 shadow-lg shadow-purple-500/20 cursor-pointer"
                  onClick={() => navigate("/dashboard")}
                >
                  {t("header.dashboard")}
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="text-sm font-medium text-white transition hover:opacity-80 cursor-pointer"
                  onClick={() =>
                    navigate("/signin", { state: { tab: "login" } })
                  }
                >
                  {t("header.login")}
                </button>
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-purple-500 opacity-40 blur-xl"
                    aria-hidden
                  />
                  <button
                    type="button"
                    className="relative z-10 rounded-full bg-[rgba(155,127,237,0.8)] px-6 py-2 text-sm font-medium text-[#31057e] transition hover:opacity-90 cursor-pointer"
                    onClick={() =>
                      navigate("/signin", { state: { tab: "register" } })
                    }
                  >
                    {t("header.signup")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {isDashBoardPage && (
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <Bell className="text-[#94A3B8] w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-purple-500 text-white text-[0.55rem] font-bold rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[rgba(15,23,42,0.98)] border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white">
                      {t("header.notifications")}
                    </h3>
                    <div className="flex items-center gap-2">
                      {allNotifs.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[0.6rem] uppercase tracking-wider text-[#cebdff] hover:text-white transition cursor-pointer"
                        >
                          {t("header.mark_all_read")}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {loadingTitles ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw
                          size={18}
                          className="text-[#cebdff] animate-spin"
                        />
                      </div>
                    ) : allNotifs.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell
                          size={24}
                          className="mx-auto text-[#494454] mb-2"
                        />
                        <p className="text-xs text-[#494454]">
                          {t("header.no_notifications")}
                        </p>
                      </div>
                    ) : (
                      allNotifs.map((item) => {
                        if (item.type === "session") {
                          const n = item.data;
                          return (
                            <button
                              key={`session-${n.id}`}
                              onClick={() => handleSessionNotifClick(n)}
                              className={`w-full flex items-start gap-3 px-5 py-4 text-left transition hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 ${
                                !n.read ? "bg-[#cebdff]/5" : ""
                              }`}
                            >
                              <div className="mt-1.5">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    n.read ? "bg-transparent" : "bg-[#cebdff]"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                  {notifTitles[n.sessionId] ||
                                    t("header.session_title_fallback", {
                                      id: n.sessionId,
                                    })}
                                </p>
                                <p className="text-[0.65rem] text-[#94A3B8] mt-0.5">
                                  {t("header.ai_analysis_complete")} ·{" "}
                                  {new Date(n.completedAt).toLocaleDateString(
                                    dateLocale,
                                    {
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                            </button>
                          );
                        }
                        const n = item.data;
                        return (
                          <button
                            key={`review-${n.id}`}
                            onClick={() => handleReviewNotifClick(n)}
                            className={`w-full flex items-start gap-3 px-5 py-4 text-left transition hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 ${
                              !n.isRead ? "bg-[#cebdff]/5" : ""
                            }`}
                          >
                            <div className="mt-1.5">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  n.isRead ? "bg-transparent" : "bg-[#cebdff]"
                                }`}
                              />
                            </div>
                            <div className="mt-1 shrink-0">
                              <span
                                className={
                                  NOTIF_ICON_COLORS[n.type] || "text-[#94A3B8]"
                                }
                              >
                                {NOTIF_ICONS[n.type] || <Bell size={14} />}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#e1e2e7] leading-snug line-clamp-2">
                                {n.content}
                              </p>
                              <p className="text-[0.65rem] text-[#94A3B8] mt-0.5">
                                {new Date(n.createdAt).toLocaleDateString(
                                  dateLocale,
                                  {
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {allNotifs.length > 0 && (
                    <div className="border-t border-white/5 px-5 py-3">
                      <button
                        onClick={handleDismissAll}
                        className="w-full text-[0.6rem] uppercase tracking-wider text-[#494454] hover:text-white transition cursor-pointer text-center"
                      >
                        {t("header.dismiss_all")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(155,127,237,0.15)] hover:bg-[rgba(155,127,237,0.25)] transition cursor-pointer overflow-hidden"
              >
                {user?.profileImageUrl ? (
                  <img
                    src={getImageUrl(user.profileImageUrl)}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle
                    className="text-[#9B7FED] w-6 h-6"
                    strokeWidth={2}
                  />
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[rgba(15,23,42,0.95)] border border-white/10 shadow-lg backdrop-blur-md overflow-hidden">
                  <button
                    onClick={() => {
                      navigate("/dashboard/myinfo");
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    {t("header.my_info")}
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {t("header.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
