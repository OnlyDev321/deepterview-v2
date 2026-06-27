import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { answerService } from "../../../services/answerService";
import { useInterviewRecording } from "../../../contexts/InterviewRecordingContext";
import type { QuestionResponse, AnswerLanguage } from "../../../types";

const STT_LANG_MAP: Record<AnswerLanguage, string> = {
  KOREAN: "ko-KR",
  ENGLISH: "en-US",
  VIETNAMESE: "vi-VN",
};

interface Message {
  id: string;
  sender: "interviewer" | "user";
  text: string;
}

interface TranscriptProps {
  isInterviewStarted?: boolean;
  currentQuestion?: QuestionResponse | null;
  hasMoreQuestions?: boolean;
  answerLanguage?: AnswerLanguage;
  onQuestionAnswered?: () => void;
}

const Transcript = ({
  isInterviewStarted = false,
  currentQuestion = null,
  hasMoreQuestions = true,
  answerLanguage = "KOREAN",
  onQuestionAnswered,
}: TranscriptProps) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const timeLimitRef = useRef(120);
  const timeoutHandledForQuestionRef = useRef<number | null>(null);

  const { isRecording, extractAnswerBlob, markQuestionStart } =
    useInterviewRecording();
  const { t } = useTranslation();

  const submitAnswerFlow = useCallback(
    async (
      transcript: string,
      durationSec: number,
      completionStatus: "COMPLETED" | "SKIPPED" | "TIMEOUT",
      displayText: string,
    ) => {
      if (!currentQuestion) {
        alert(t("transcript.alert_no_question"));
        return;
      }

      if (!isRecording) {
        alert(t("transcript.alert_start_recording"));
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await answerService.submitAnswer({
          questionId: currentQuestion.id,
          transcript,
          durationSec,
          completionStatus,
        });

        const videoBlob = extractAnswerBlob();
        if (videoBlob && videoBlob.size > 0) {
          void answerService
            .uploadAnswerVideo(response.answerId, videoBlob)
            .catch((err) => {
              console.error("Background video upload failed:", err);
            });
        }

        markQuestionStart();

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: "user",
            text: displayText,
          },
        ]);

        setInputText("");

        if (isListening && recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            /* ignore */
          }
          setIsListening(false);
        }

        const limit = timeLimitRef.current;
        setTimeLeft(limit);

        if (hasMoreQuestions) {
          onQuestionAnswered?.();
        }
      } catch (err) {
        console.error("Failed to submit answer:", err);
        alert(
          t("transcript.alert_submit_failed"),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentQuestion,
      isRecording,
      extractAnswerBlob,
      markQuestionStart,
      hasMoreQuestions,
      onQuestionAnswered,
      isListening,
    ],
  );

  useEffect(() => {
    if (!currentQuestion) return;

    const limit = currentQuestion.timeLimitSec || 120;
    timeLimitRef.current = limit;
    setTimeLeft(limit);

    timeoutHandledForQuestionRef.current = null;

    setMessages([
      {
        id: `q-${currentQuestion.id}`,
        sender: "interviewer",
        text: currentQuestion.content,
      },
    ]);
  }, [
    currentQuestion?.id,
    currentQuestion?.content,
    currentQuestion?.timeLimitSec,
  ]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  useEffect(() => {
    if (!isInterviewStarted || !currentQuestion) return;

    if (timeLeft <= 0) {
      if (timeoutHandledForQuestionRef.current === currentQuestion.id) {
        return;
      }
      timeoutHandledForQuestionRef.current = currentQuestion.id;
      void submitAnswerFlow(
        t("transcript.timeout_text"),
        timeLimitRef.current,
        "TIMEOUT",
        t("transcript.timeout_text"),
      );
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft, isInterviewStarted, currentQuestion, submitAnswerFlow]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = STT_LANG_MAP[answerLanguage] || "ko-KR";

    rec.onresult = (event: any) => {
      let finalResult = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalResult += event.results[i][0].transcript;
        }
      }
      if (finalResult) {
        setInputText((prev) => prev + (prev ? " " : "") + finalResult);
      }
    };

    rec.onerror = (e: Event) => {
      console.error("Speech recognition error:", e);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [answerLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t("transcript.alert_stt_not_supported"));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    const actualDurationSec = Math.max(1, timeLimitRef.current - timeLeft);

    await submitAnswerFlow(
      inputText.trim(),
      actualDurationSec,
      "COMPLETED",
      inputText.trim(),
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const submitDisabled =
    isSubmitting ||
    !isInterviewStarted ||
    !currentQuestion ||
    !hasMoreQuestions;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 relative group">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Sparkles size={18} className="text-[#cebdff]" />
          </div>
          <textarea
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={submitDisabled}
            rows={1}
            placeholder={
              !hasMoreQuestions
                ? t("transcript.placeholder_all_done")
                : isListening
                  ? t("transcript.placeholder_listening")
                  : t("transcript.placeholder_default")
            }
            className="w-full bg-[#191c1f] border border-[#494454]/20 rounded-xl py-5 pl-14 pr-5 text-sm text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none disabled:opacity-50 resize-none overflow-y-auto"
          />
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={!isInterviewStarted || submitDisabled}
            className={`p-4 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isListening
                ? "bg-red-500 text-white border-red-400/30 animate-pulse"
                : "bg-white/5 text-[#cebdff] hover:bg-white/10 border-white/10"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isListening ? t("transcript.title_listening_stop") : t("transcript.title_listening_start")}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>

          <button
            type="submit"
            disabled={submitDisabled || !inputText.trim()}
            className="px-6 py-4 bg-[#9b7fed] text-[#31057e] font-bold rounded-full text-xs uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("transcript.submit")} <Send size={14} />
          </button>
        </div>
      </form>

      <div className="bg-[#191c1f] rounded-[2rem] p-8 border border-[#494454]/10 shadow-[0_0_40px_0_rgba(206,189,255,0.05)]">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/60 font-bold">
            {t("transcript.live_chat")}
          </h4>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#cebdff]/10 text-[#cebdff] text-[0.6rem] font-bold uppercase rounded-full border border-[#cebdff]/20">
              {timeLeft}s
            </span>
          </div>
        </div>

        <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <p
                className={`text-sm font-bold ${
                  msg.sender === "interviewer"
                    ? "text-[#cebdff]"
                    : "text-emerald-400"
                }`}
              >
                {msg.sender === "interviewer" ? t("transcript.label_interviewer") : t("transcript.label_me")}
              </p>
              <p
                className={`leading-relaxed ${
                  msg.sender === "interviewer"
                    ? "text-[#e1e2e7]/80 italic"
                    : "text-[#e1e2e7] text-lg font-light"
                }`}
              >
                {msg.text}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Transcript;
