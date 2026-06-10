import os
import cv2
import httpx
from pipeline.extractor import extract_audio


def run_pipeline(video_path: str, output_dir: str = "output", frame_interval: int = 5 ) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    audio_path = extract_audio(video_path, output_dir)

    cap = cv2.VideoCapture(video_path)

    from pipeline.video_enhance import enhance_frame
    from pipeline.gaze import analyze_gaze
    from pipeline.emotion import EmotionAnalyzer
    from pipeline.audio import analyze_audio_librosa
    from pipeline.audio import transcribe_audio_whisper

    from pipeline.audio_enhance import enhance_audio

    from pipeline.result_filter import filter_emotion_result, filter_gaze_result

    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        refine_landmarks=True,
        max_num_faces=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    frame_results = []
    frame_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_index % frame_interval == 0:
            frame = enhance_frame(frame);
            gaze = analyze_gaze(frame, face_mesh)      # 배열 직접 전달
            emotion = EmotionAnalyzer.analyze_emotion(frame, face_mesh) # 배열 직접 전달
            

            emotion_filtered = filter_emotion_result(emotion)
            gaze_filtered = filter_gaze_result(gaze)

            # None이면 해당 프레임 결과를 집계에서 제외
            if emotion_filtered and gaze_filtered:
                frame_results.append({
                    "frame_index": frame_index,
                    "gaze_direction":   gaze_filtered["gaze_direction"],
                    "dominant_emotion": emotion_filtered["dominant_emotion"],
                    "confidence":       emotion_filtered["confidence"]
            })
        

        frame_index += 1

    cap.release()

    if audio_path is not None:
        try:
            audio_path = enhance_audio(audio_path, os.path.join(output_dir, "enhanced_audio.wav"))
            audio_features = analyze_audio_librosa(audio_path)
            stt_result = transcribe_audio_whisper(audio_path)
        except Exception as e:
            print(f"[음성 분석 오류] {e}")
            audio_features = {}
            stt_result = {}
    else:
        print("[음성 분석 건너뜀] 음성 스트림이 없어 음성 분석 단계를 건너뜁니다.")
        audio_features = {}
        stt_result = {}

    result = {
        "audio": {
            "tempo_bpm":     audio_features.get("tempo_bpm"),
            "pitch_mean_hz": audio_features.get("pitch_mean_hz"),
            "pitch_std_hz":  audio_features.get("pitch_std_hz"),
        },
        "transcription": {
            "text":     stt_result.get("text"),
            "language": stt_result.get("language"),
            "segments": [
                {
                    "start": seg["start"],
                    "end":   seg["end"],
                    "text":  seg["text"]
                }
                for seg in stt_result.get("segments", [])
            ]
        },
        "frame_count": len(frame_results),
        "gaze_frames": frame_results
    }

    return result

async def send_to_spring(callback_url: str, result: dict):
    """
    분석 결과를 Spring 콜백 엔드포인트로 전송
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                callback_url,
                json=result,
                timeout=10.0
            )
            if response.status_code == 200:
                print(f"[콜백 성공] interview_id={result['interview_id']}")
            else:
                print(f"[콜백 실패] status={response.status_code}")
    except Exception as e:
        print(f"[콜백 오류] {str(e)}")

if __name__ == "__main__":
    result = run_pipeline(
        video_path="Analyze_Test.mp4",
        output_dir="output",
        frame_interval=5   
    )