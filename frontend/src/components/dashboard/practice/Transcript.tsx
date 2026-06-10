import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";
import { answerService } from "../../../services/answerService";
import { useInterviewRecording } from "../../../contexts/InterviewRecordingContext";
import type { QuestionResponse } from "../../../types";

interface Message {
  id: string;
  sender: "interviewer" | "user";
  text: string;
}

interface TranscriptProps {
  isInterviewStarted?: boolean;
  currentQuestion?: QuestionResponse | null;
  hasMoreQuestions?: boolean;
  onQuestionAnswered?: () => void;
}

const Transcript = ({
  isInterviewStarted = false,
  currentQuestion = null,
  hasMoreQuestions = true,
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

  const submitAnswerFlow = useCallback(
    async (
      transcript: string,
      durationSec: number,
      completionStatus: "COMPLETED" | "SKIPPED" | "TIMEOUT",
      displayText: string,
    ) => {
      if (!currentQuestion) {
        alert("질문 정보를 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
        return;
      }

      if (!isRecording) {
        alert("먼저 '면접 시작' 버튼을 눌러 녹화를 시작해 주세요.");
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
          "답변을 전송하는 데 실패했습니다. 네트워크 상태를 확인해 주세요.",
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
        "(시간 초과 - 답변 없음)",
        timeLimitRef.current,
        "TIMEOUT",
        "(시간 초과 - 답변 없음)",
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
    rec.lang = "ko-KR";

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
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해 주세요.",
      );
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

  const submitDisabled =
    isSubmitting ||
    !isInterviewStarted ||
    !currentQuestion ||
    !hasMoreQuestions;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Sparkles size={18} className="text-[#cebdff]" />
        </div>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={submitDisabled}
          placeholder={
            !hasMoreQuestions
              ? "모든 질문에 답변했습니다. 면접 종료 버튼을 눌러 주세요."
              : isListening
                ? "말씀해 주세요... 실시간으로 받아적고 있습니다..."
                : "메모를 입력하거나 음성 인식으로 답변하세요..."
          }
          className="w-full bg-[#191c1f] border border-[#494454]/20 rounded-full py-5 pl-14 pr-48 text-sm text-[#e1e2e7] focus:ring-2 focus:ring-[#cebdff]/20 focus:border-[#cebdff]/30 transition-all outline-none disabled:opacity-50"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={!isInterviewStarted || submitDisabled}
            className={`p-3 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
              isListening
                ? "bg-red-500 text-white border-red-400/30 animate-pulse"
                : "bg-white/5 text-[#cebdff] hover:bg-white/10 border-white/10"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isListening ? "음성 인식 중지" : "음성 인식 시작"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </motion.button>

          <button
            type="submit"
            disabled={submitDisabled || !inputText.trim()}
            className="px-6 py-3 bg-[#9b7fed] text-[#31057e] font-bold rounded-full text-xs uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            제출 <Send size={14} />
          </button>
        </div>
      </form>

      <div className="bg-[#191c1f] rounded-[2rem] p-8 border border-[#494454]/10 shadow-[0_0_40px_0_rgba(206,189,255,0.05)]">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[0.65rem] uppercase tracking-[0.2em] text-[#cbc3d7]/60 font-bold">
            실시간 대화록
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
                {msg.sender === "interviewer" ? "면접관:" : "나 (답변):"}
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
