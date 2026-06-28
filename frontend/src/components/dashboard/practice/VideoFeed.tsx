import { forwardRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, VibrateOff, VideoOff, X, Trophy, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sessionService } from "../../../services/sessionService";
import { useInterviewRecording } from "../../../contexts/InterviewRecordingContext";

interface VideoFeedProps {
  sessionId?: number;
  hasMoreQuestions?: boolean;
  remainingQuestions?: number;
  onStartInterview?: () => void;
  onEndInterview?: () => void;
}

const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  (
    {
      sessionId,
      hasMoreQuestions = true,
      remainingQuestions = 0,
      onStartInterview,
      onEndInterview,
    },
    ref,
  ) => {
    const [isVideoOn] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [hasShownComplete, setHasShownComplete] = useState(false);

    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
      isRecording,
      startRecorder,
      stopRecorder,
      extractFullInterviewBlob,
    } = useInterviewRecording();

    useEffect(() => {
      let interval: ReturnType<typeof setInterval> | null = null;
      if (isRecording) {
        setRecordingTime(0);
        interval = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }

      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600)
        .toString()
        .padStart(2, "0");
      const mins = Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      return `${hrs}:${mins}:${secs}`;
    };

    useEffect(() => {
      let isMounted = true;
      let activeStream: MediaStream | null = null;

      async function setupCamera() {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (!isMounted) {
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }

          activeStream = mediaStream;
          setStream(mediaStream);
          if (ref && "current" in ref && ref.current) {
            ref.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }

      setupCamera();

      return () => {
        isMounted = false;

        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
        }

        if (ref && "current" in ref && ref.current) {
          ref.current.srcObject = null;
        }

        if (onEndInterview) {
          onEndInterview();
        }
      };
    }, []);

    // Automatically stop recording when there are no more questions left
    useEffect(() => {
      if (isRecording && !hasMoreQuestions) {
        void stopRecorder();
        setHasShownComplete(true);
      }
    }, [isRecording, hasMoreQuestions, stopRecorder]);

    const startRecording = async () => {
      if (!stream) {
        alert(t("video.alert_camera_stream"));
        return;
      }

      if (sessionId) {
        try {
          await sessionService.startSession(sessionId);
        } catch (err) {
          console.error("Failed to start session via API:", err);
          alert(
            t("video.alert_connection_failed"),
          );
          return;
        }
      }

      try {
        startRecorder(stream);
        if (onStartInterview) {
          onStartInterview();
        }
      } catch (err) {
        console.error("Failed to start MediaRecorder:", err);
        alert(t("video.alert_recording_failed"));
      }
    };

    const handleEndClick = () => {
      if (isEnding) return;
      if (hasMoreQuestions && isRecording) {
        setShowEndConfirm(true);
      } else {
        void stopRecordingAndNavigate();
      }
    };

    const stopRecordingAndNavigate = async () => {
      if (isEnding) return;
      setIsEnding(true);
      setShowEndConfirm(false);

      try {
        await stopRecorder();

        const fullBlob = extractFullInterviewBlob();

        if (sessionId) {
          try {
            await sessionService.endSession(sessionId);
          } catch (err) {
            console.error("Failed to end session via API:", err);
            alert(t("video.alert_end_failed"));
            setIsEnding(false);
            return;
          }

          if (fullBlob && fullBlob.size > 0) {
            try {
              await sessionService.uploadSessionVideo(sessionId, fullBlob);
            } catch (err) {
              console.error("Failed to upload full interview video:", err);
            }
          }

          try {
            await sessionService.generatePythonReport(sessionId);
          } catch (err) {
            console.error("Failed to trigger Python report generation:", err);
          }

          sessionStorage.removeItem("activeSessionId");

          if (onEndInterview) {
            onEndInterview();
          }

          navigate("/dashboard/practice/processing", {
            state: { sessionId, skipPythonTrigger: true },
          });
          return;
        }

        if (onEndInterview) {
          onEndInterview();
        }

        navigate("/dashboard/history");
      } finally {
        setIsEnding(false);
      }
    };

    return (
      <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-[#111417] shadow-[0_0_50px_rgba(0,0,0,0.3)]">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoOn ? "opacity-100" : "opacity-0"}`}
        />

        {!isVideoOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#191c1f]">
            <div className="w-32 h-32 rounded-full bg-[#cebdff]/10 flex items-center justify-center">
              <VideoOff size={48} className="text-[#cebdff]/40" />
            </div>
          </div>
        )}

        <div className="absolute top-6 left-6 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/30">
            <div
              className={`w-2 h-2 rounded-full bg-red-500 ${isRecording ? "animate-pulse" : ""}`}
            />
            <span className="text-[0.65rem] font-bold text-red-500 uppercase tracking-widest">
              {isRecording ? t("video.live_recording") : t("video.live_session")}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-[0.65rem] font-mono text-white/80">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <motion.button
            whileHover={!isRecording && hasMoreQuestions ? { scale: 1.05 } : {}}
            whileTap={!isRecording && hasMoreQuestions ? { scale: 0.95 } : {}}
            onClick={startRecording}
            disabled={isRecording || isEnding || !hasMoreQuestions}
            className={`px-6 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isRecording || !hasMoreQuestions
                ? "bg-[#191c1f] text-emerald-400 border border-emerald-500/30 shadow-none cursor-not-allowed opacity-80"
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50"
            }`}
          >
            <Play
              size={20}
              fill={isRecording || !hasMoreQuestions ? "none" : "currentColor"}
              className={isRecording ? "animate-pulse text-emerald-400" : ""}
            />
            <span className="text-xs uppercase tracking-wider">
              {isRecording
                ? t("video.btn_recording")
                : !hasMoreQuestions
                  ? t("video.btn_completed")
                  : t("video.btn_start")}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isEnding}
            animate={hasShownComplete ? {
              boxShadow: ["0 0 0px rgba(239,68,68,0.4)", "0 0 24px rgba(239,68,68,0.9)", "0 0 0px rgba(239,68,68,0.4)"],
              scale: [1, 1.08, 1],
            } : {}}
            transition={hasShownComplete ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" } : {}}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 cursor-pointer disabled:opacity-60"
            onClick={handleEndClick}
          >
            <VibrateOff size={24} />
          </motion.button>
        </div>

        {/* Session Complete Overlay */}
        <AnimatePresence>
          {hasShownComplete && (
            <motion.div
              key="session-complete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[2.5rem] pointer-events-none z-10"
            >
              {/* Subtle green shimmer border */}
              <div
                className="absolute inset-0 rounded-[2.5rem]"
                style={{
                  boxShadow: "inset 0 0 0 3px rgba(52,211,153,0.5), 0 0 40px rgba(52,211,153,0.15)",
                }}
              />

              {/* Top completion banner */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
                className="absolute top-6 right-6 pointer-events-auto"
              >
                <div className="flex items-center gap-3 px-5 py-3 bg-[#111417]/85 backdrop-blur-md border border-emerald-400/40 rounded-2xl shadow-lg shadow-black/40 whitespace-nowrap">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <Trophy size={18} className="text-emerald-400" />
                  </motion.div>
                  <div>
                    <p className="text-[0.7rem] font-black text-emerald-400 uppercase tracking-widest">
                      {t("video.all_done_title")}
                    </p>
                    <p className="text-[0.6rem] text-emerald-300/70">
                      {t("video.all_done_hint")}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* End-early confirmation modal */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-[#1a1d23] border border-[#494454]/30 rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#e1e2e7]">
                      {t("video.end_title")}
                    </h3>
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="w-8 h-8 rounded-full bg-[#191c1f] flex items-center justify-center hover:bg-[#23242a] transition-colors cursor-pointer"
                  >
                    <X size={16} className="text-[#cbc3d7]" />
                  </button>
                </div>
                    <p className="text-sm text-[#cbc3d7]/70 leading-relaxed mb-2"
                      dangerouslySetInnerHTML={{
                        __html: t("video.end_remaining", { count: remainingQuestions }),
                      }}
                    />
                    <p className="text-sm text-[#cbc3d7]/50 leading-relaxed mb-6">
                      {t("video.end_confirm")}
                    </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 px-5 py-3 bg-[#191c1f] border border-[#494454]/20 text-[#cbc3d7] rounded-full text-xs font-bold hover:border-[#cebdff]/30 transition-all cursor-pointer"
                  >
                      {t("video.end_continue")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void stopRecordingAndNavigate()}
                    className="flex-1 px-5 py-3 bg-red-500 text-white rounded-full text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
                  >
                      {t("video.end_stop")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

export default VideoFeed;
