import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface InterviewRecordingContextValue {
  isRecording: boolean;
  startRecorder: (stream: MediaStream) => void;
  stopRecorder: () => Promise<void>;
  markQuestionStart: () => void;
  extractAnswerBlob: () => Blob | null;
  extractFullInterviewBlob: () => Blob | null;
  getMimeType: () => string;
}

const InterviewRecordingContext =
  createContext<InterviewRecordingContextValue | null>(null);

function resolveMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return "video/webm";
}

export function InterviewRecordingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentChunksRef = useRef<Blob[]>([]);
  const completedQuestionBlobsRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef(resolveMimeType());
  const stopResolverRef = useRef<(() => void) | null>(null);

  const [isRecording, setIsRecording] = useState(false);

  const startNewRecorderSession = useCallback((stream: MediaStream) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeTypeRef.current,
    });
    const chunks: Blob[] = [];
    currentChunksRef.current = chunks;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeTypeRef.current });
      if (blob.size > 0) {
        // Only add if not already in completed lists to prevent duplicates
        if (!completedQuestionBlobsRef.current.includes(blob)) {
          completedQuestionBlobsRef.current.push(blob);
        }
      }
    };

    recorder.onerror = (event) => {
      console.error("MediaRecorder error:", event);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
  }, []);

  const startRecorder = useCallback(
    (stream: MediaStream) => {
      streamRef.current = stream;
      completedQuestionBlobsRef.current = [];
      currentChunksRef.current = [];
      mimeTypeRef.current = resolveMimeType();

      startNewRecorderSession(stream);
      setIsRecording(true);
    },
    [startNewRecorderSession],
  );

  const markQuestionStart = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch (err) {
        console.error(
          "Failed to stop MediaRecorder on question boundary:",
          err,
        );
      }
    }

    if (streamRef.current) {
      startNewRecorderSession(streamRef.current);
    }
  }, [startNewRecorderSession]);

  const stopRecorder = useCallback(() => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve();
        return;
      }

      stopResolverRef.current = resolve;
      const originalOnStop = recorder.onstop;
      recorder.onstop = (event) => {
        if (originalOnStop) {
          originalOnStop.call(recorder, event);
        }
        stopResolverRef.current?.();
        stopResolverRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };

      try {
        recorder.stop();
      } catch (err) {
        console.error(err);
        setIsRecording(false);
        resolve();
      }
    });
  }, []);

  const extractAnswerBlob = useCallback((): Blob | null => {
    const chunks = currentChunksRef.current;
    if (chunks.length === 0) {
      return null;
    }
    return new Blob(chunks, { type: mimeTypeRef.current });
  }, []);

  const extractFullInterviewBlob = useCallback((): Blob | null => {
    if (completedQuestionBlobsRef.current.length === 0) {
      return extractAnswerBlob();
    }
    const blobs = [...completedQuestionBlobsRef.current];
    const activeBlob = extractAnswerBlob();
    if (activeBlob && activeBlob.size > 0 && !blobs.includes(activeBlob)) {
      blobs.push(activeBlob);
    }
    return new Blob(blobs, { type: mimeTypeRef.current });
  }, [extractAnswerBlob]);

  const getMimeType = useCallback(() => mimeTypeRef.current, []);

  const value = useMemo(
    () => ({
      isRecording,
      startRecorder,
      stopRecorder,
      markQuestionStart,
      extractAnswerBlob,
      extractFullInterviewBlob,
      getMimeType,
    }),
    [
      isRecording,
      startRecorder,
      stopRecorder,
      markQuestionStart,
      extractAnswerBlob,
      extractFullInterviewBlob,
      getMimeType,
    ],
  );

  return (
    <InterviewRecordingContext.Provider value={value}>
      {children}
    </InterviewRecordingContext.Provider>
  );
}

export function useInterviewRecording() {
  const context = useContext(InterviewRecordingContext);
  if (!context) {
    throw new Error(
      "useInterviewRecording must be used within InterviewRecordingProvider",
    );
  }
  return context;
}
