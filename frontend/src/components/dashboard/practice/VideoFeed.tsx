import { forwardRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, VibrateOff, VideoOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sessionService } from "../../../services/sessionService";
import { useInterviewRecording } from "../../../contexts/InterviewRecordingContext";

interface VideoFeedProps {
  sessionId?: number;
  hasMoreQuestions?: boolean;
  onStartInterview?: () => void;
  onEndInterview?: () => void;
}

const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  (
    { sessionId, hasMoreQuestions = true, onStartInterview, onEndInterview },
    ref,
  ) => {
    const [isVideoOn] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

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
      }
    }, [isRecording, hasMoreQuestions, stopRecorder]);

    const startRecording = async () => {
      if (!stream) {
        alert("카메라 스트림을 준비 중입니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (sessionId) {
        try {
          await sessionService.startSession(sessionId);
        } catch (err) {
          console.error("Failed to start session via API:", err);
          alert(
            "서버 연결에 실패하여 면접 세션을 시작할 수 없습니다. 다시 시도해 주세요.",
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
        alert("녹화를 시작할 수 없습니다. 카메라/마이크 권한을 확인하세요.");
      }
    };

    const stopRecordingAndNavigate = async () => {
      if (isEnding) return;
      setIsEnding(true);

      try {
        await stopRecorder();

        const fullBlob = extractFullInterviewBlob();

        if (sessionId) {
          try {
            await sessionService.endSession(sessionId);
          } catch (err) {
            console.error("Failed to end session via API:", err);
            alert("세션 종료에 실패했습니다. 다시 시도해 주세요.");
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
              {isRecording ? "라이브 녹화 중" : "라이브 세션"}
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
                ? "Recording..."
                : !hasMoreQuestions
                  ? "답변 완료 (Completed)"
                  : "면접 시작 (Start)"}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isEnding}
            className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 cursor-pointer disabled:opacity-60"
            onClick={stopRecordingAndNavigate}
          >
            <VibrateOff size={24} />
          </motion.button>
        </div>
      </div>
    );
  },
);

export default VideoFeed;
