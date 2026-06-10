import numpy as np
import cv2
import mediapipe as mp
from deepface import DeepFace
import os
os.environ["GLOG_minloglevel"] = "2"          # MediaPipe 로그 억제
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"      # TensorFlow 로그 억제

"""
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    refine_landmarks=True,
    max_num_faces=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
"""
def analyze_gaze(frame: np.ndarray, face_mesh) -> dict:  
    if frame is None:
        return
    
    image = frame
    h, w = image.shape[:2]
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb)

    if not results.multi_face_landmarks:
            return {"gaze_direction": "unknown", "face_detected": False}
 
    landmarks = results.multi_face_landmarks[0].landmark

    def get_point(idx):
        lm = landmarks[idx]
        return np.array([lm.x * w, lm.y * h])
    
    # 왼쪽 눈
    left_iris = get_point(468)
    left_eye_left = get_point(33)
    left_eye_right = get_point(133)
    left_eye_width = np.linalg.norm(left_eye_right - left_eye_left)
    left_ratio = (left_iris[0] - left_eye_left[0]) / (left_eye_width + 1e-6)
 
    # 오른쪽 눈
    right_iris = get_point(473)
    right_eye_left = get_point(362)
    right_eye_right = get_point(263)
    right_eye_width = np.linalg.norm(right_eye_right - right_eye_left)
    right_ratio = (right_iris[0] - right_eye_left[0]) / (right_eye_width + 1e-6)
 
    avg_ratio = (left_ratio + right_ratio) / 2
 
    if avg_ratio < 0.42:
        direction = "left"
    elif avg_ratio > 0.58:
        direction = "right"
    else:
        direction = "center"
 
    return {
        "gaze_direction": direction,
        "face_detected": True
    }