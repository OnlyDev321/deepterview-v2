import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from deepface import DeepFace
import subprocess
import os
import numpy as np
os.environ["GLOG_minloglevel"] = "2"          # MediaPipe 로그 억제
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"  # TensorFlow 로그 억제
def draw_debug(frame, face_landmarker):
    output = frame.copy()
    h, w = output.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    try:
        results = DeepFace.analyze(
            img_path = frame,
            actions=["emotion"],
            enforce_detection = False,
            silent=True
        )
        if isinstance(results, list):
            results = results[0]

        region = results.get("region", {})
        x, y, fw, fh = region.get("x",0), region.get("y",0), \
                        region.get("w",0), region.get("h",0)
        emotion = results.get("dominant_emotion", "")

        cv2.rectangle(output, (x, y), (x+fw, y+fh), (0, 255, 0), 2)
        cv2.putText(output, emotion, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    except:
        pass
    
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    res = face_landmarker.detect(mp_image)
    if res.face_landmarks:
        lm = res.face_landmarks[0]
        for idx in [468, 473]:
            cx = int(lm[idx].x * w)
            cy = int(lm[idx].y * h)
            cv2.circle(output, (cx, cy), 4, (0, 0, 255), -1)

    return output

def save_debug_video(video_path: str, output_path: str, frame_interval: int = 1):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps is None:
        fps = 30.0  # 기본값으로 고정
        print("[경고] fps 감지 실패, 30fps로 설정")

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    temp_path = output_path.replace(".mp4", "_temp.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))

    if not out.isOpened():
        print(f"[오류] VideoWriter 초기화 실패: {temp_path}")
        print(f"fps={fps}, width={width}, height={height}")
        cap.release()
        return

    frame_index = 0

    base_options = python.BaseOptions(model_asset_path='mediapipe/models/face_landmarker.task')
    options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
    face_landmarker = vision.FaceLandmarker.create_from_options(options)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % frame_interval == 0:
            annotated = draw_debug(frame, face_landmarker)
        else:
            annotated = frame  # 분석 안 하는 프레임은 원본 그대로

        out.write(annotated)
        frame_index += 1
        print(f"\r[디버그 영상 생성] {frame_index}프레임 처리 중...", end="")
        
    face_landmarker.close()
    cap.release()
    out.release()

    print("\n[재인코딩 중...]")
    result = subprocess.run([
        "ffmpeg", "-y",
        "-i", temp_path,
        "-vcodec", "libx264",
        "-acodec", "aac",
        "-pix_fmt", "yuv420p",  # 윈도우 미디어 플레이어 호환
        output_path
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print("[ffmpeg 오류 내용]")
        print(result.stderr)
    else:
        os.remove(temp_path)
        print(f"[완료] → {output_path}")

current_Dir = os.path.dirname(os.path.abspath(__file__))

parent_Dir = os.path.dirname(current_Dir)

video_Path = os.path.join(parent_Dir, "Analyze_Test.mp4")

if __name__ == "__main__":
    save_debug_video(
        video_path=video_Path,
        output_path="debug_output.mp4",
        frame_interval=5   # 1이면 모든 프레임, 5면 5프레임마다 분석
    )