import cv2
import numpy as np

def enhance_frame(frame: np.ndarray) -> np.ndarray:
    """
    웹캠 프레임 화질 보정
    1. 노이즈 제거
    2. 조명 정규화
    3. 대비 향상
    """
    # 1. 노이즈 제거 (bilateral filter - 엣지 보존하며 노이즈만 제거)
    denoised = cv2.bilateralFilter(frame, d=9, sigmaColor=75, sigmaSpace=75)

    # 2. 조명 정규화 (CLAHE - 지역적 히스토그램 평활화)
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # 3. 살짝 샤프닝 (흐릿한 웹캠 보정)
    kernel = np.array([[0, -1, 0],
                        [-1, 5, -1],
                        [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)

    return sharpened