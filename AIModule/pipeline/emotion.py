import numpy as np
from collections import deque
import cv2
import mediapipe as mp
from deepface import DeepFace

class EmotionAnalyzer:
    def __init__(self, smoothing_window = 5):
        self.history = deque(maxlen=smoothing_window)


    def analyze_emotion(self, frame: np.ndarray) -> dict:
        """
        DeepFace로 표정(감정)을 분석합니다.
 
        Returns:
            dominant_emotion: 가장 높은 감정
            emotions: 7가지 감정 확률 dict
            confidence: 얼굴 감지 신뢰도
        """
        try:
            result = DeepFace.analyze(
                img_path=frame,
                actions=["emotion"],
                enforce_detection=False,  # 얼굴 미감지 시 에러 대신 결과 반환
                silent=True
            )
            if isinstance(result, list):
                result = result[0]
    
            emotions = result["emotion"]
            self.history.append(emotions)

            smoothed ={}
            for key in emotions:
                smoothed[key] = round(
                    np.mean([h[key] for h in self.history]), 2
                )

            dominant = max(smoothed, key=smoothed.get)
            confidence = result.get("face_confidence", 0.0)

            #임시 리턴 형태, 추후 조정
            return {
                "dominant_emotion": dominant,
                "emotions": smoothed,
                "confidence": round(confidence, 3),
                "face_detected": confidence > 0.5
            }
        
        except Exception as e:
            #임시 리턴 형태, 추후 조정
            return {
                "dominant_emotion": "unknown",
                "emotions": {},
                "confidence": 0.0,
                "face_detected": False,
                "error": str(e)
            }