import { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface FaceAnalysisResult {
  smileRatio: number;
  headStability: number;
  dominantEmotion: string;
  eyeContact: number; // 0-100
  confidence: number; // 0-100
  anxiety: number; // 0-100
}

// Global cache to prevent multiple downloads and compilations of MediaPipe FaceLandmarker
let globalLandmarker: FaceLandmarker | null = null;
let initPromise: Promise<FaceLandmarker> | null = null;

const getOrInitLandmarker = async (): Promise<FaceLandmarker> => {
  if (globalLandmarker) {
    return globalLandmarker;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    const landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
    });
    globalLandmarker = landmarker;
    return landmarker;
  })();

  return initPromise;
};

export const useFaceAnalysis = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean = false
) => {
  const [result, setResult] = useState<FaceAnalysisResult>({
    smileRatio: 0,
    headStability: 100,
    dominantEmotion: "중립",
    eyeContact: 100,
    confidence: 50,
    anxiety: 0,
  });

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const previousNosePos = useRef<{ x: number; y: number } | null>(null);
  const stabilityRef = useRef<number>(100);

  useEffect(() => {
    if (!isActive) return;

    let animationFrameId: number;
    let isMounted = true;

    const startAnalysis = async () => {
      try {
        const landmarker = await getOrInitLandmarker();
        if (!isMounted) return;

        landmarkerRef.current = landmarker;

        const predict = () => {
          if (!isMounted) return;

          if (
            videoRef.current &&
            videoRef.current.readyState >= 2 &&
            landmarkerRef.current
          ) {
            const results = landmarkerRef.current.detectForVideo(
              videoRef.current,
              performance.now()
            );

            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
              const shapes = results.faceBlendshapes[0].categories;

              // 1. Smile Ratio
              const smileLeft = shapes.find((s) => s.categoryName === "mouthSmileLeft")?.score || 0;
              const smileRight = shapes.find((s) => s.categoryName === "mouthSmileRight")?.score || 0;
              const currentSmile = Math.round(((smileLeft + smileRight) / 2) * 100);

              // 2. Head Stability (Based on Nose Tip landmark #1)
              let currentStability = stabilityRef.current;
              let eyeContactScore = 100;

              if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const landmarks = results.faceLandmarks[0];
                const nose = landmarks[1]; // Nose tip
                
                // --- Stability Calculation ---
                if (previousNosePos.current) {
                  const dx = nose.x - previousNosePos.current.x;
                  const dy = nose.y - previousNosePos.current.y;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const movement = Math.min(distance * 500, 1); 
                  const frameStability = (1 - movement) * 100;
                  currentStability = currentStability * 0.9 + frameStability * 0.1;
                  stabilityRef.current = currentStability;
                }
                previousNosePos.current = { x: nose.x, y: nose.y };

                // --- Simple Eye Contact Calculation ---
                // Based on head rotation (if nose is too far from center of face)
                const faceLeft = landmarks[234];
                const faceRight = landmarks[454];
                const faceCenter = (faceLeft.x + faceRight.x) / 2;
                const horizontalOffset = Math.abs(nose.x - faceCenter) / (faceRight.x - faceLeft.x);
                
                // If offset > 0.15, eye contact starts to drop
                eyeContactScore = Math.max(0, 100 - (horizontalOffset * 500));
              }

              // 3. Dominant Emotion
              const jawOpen = shapes.find((s) => s.categoryName === "jawOpen")?.score || 0;
              const browUp = shapes.find((s) => s.categoryName === "browInnerUp")?.score || 0;
              const eyeBlinkLeft = shapes.find((s) => s.categoryName === "eyeBlinkLeft")?.score || 0;
              const eyeBlinkRight = shapes.find((s) => s.categoryName === "eyeBlinkRight")?.score || 0;
              
              let emotion = "중립";
              if (currentSmile > 30) emotion = "행복";
              else if (jawOpen > 0.2 && browUp > 0.2) emotion = "놀람";
              else if (shapes.find((s) => s.categoryName === "browDownLeft")?.score! > 0.3) emotion = "슬픔";

              // 4. Derived metrics (Confidence & Anxiety)
              // Confidence: High if smiling, stable, and good eye contact
              const confidenceScore = Math.round(
                (currentSmile * 0.3) + (currentStability * 0.4) + (eyeContactScore * 0.3)
              );

              // Anxiety: High if high blinking frequency, low stability, or poor eye contact
              const blinkFactor = (eyeBlinkLeft + eyeBlinkRight) > 1.2 ? 40 : 0;
              const anxietyScore = Math.round(
                Math.max(0, 100 - currentStability - eyeContactScore/2 + blinkFactor)
              );

              setResult({
                smileRatio: currentSmile,
                headStability: Math.round(currentStability),
                dominantEmotion: emotion,
                eyeContact: Math.round(eyeContactScore),
                confidence: Math.min(100, confidenceScore),
                anxiety: Math.min(100, anxietyScore),
              });
            }
          }
          animationFrameId = requestAnimationFrame(predict);
        };

        predict();
      } catch (err) {
        console.error("Failed to initialize MediaPipe FaceLandmarker:", err);
      }
    };

    startAnalysis();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      landmarkerRef.current = null;
    };
  }, [videoRef, isActive]);

  return result;
};
