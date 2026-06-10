import os
import subprocess

def extract_audio(video_path: str, output_dir: str):
    #영상에서 음성 데이터를 추출하는 함수
    """
    video_path : 파일 경로
    output_dir : 음성 파일 저장 디렉토리
    frame_interval = N 프레임마다 1장 추출  
    """

    audio_path = os.path.join(output_dir, "audio.wav")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                  # 영상 제외
        "-acodec", "pcm_s16le", # WAV 포맷
        "-ar", "16000",         # 16kHz (Whisper 권장)
        "-ac", "1",             # 모노
        audio_path
    ]

    result = subprocess.run(
    ffmpeg_cmd,
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="ignore"
)
    if result.returncode != 0:
        if "does not contain any stream" in result.stderr:
            print(f"[음성 추출] 음성 스트림 없음 (비디오 전용) → {video_path}")
            return None
        raise RuntimeError(f"음성 추출 실패: {result.stderr}")
 
    print(f"[음성 추출] 완료 → {audio_path}")
    return audio_path

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))

    parent_dir = os.path.dirname(current_dir)

    video_path = os.path.join(parent_dir, "Analyze_Test.mp4")

    output_dir = os.path.join(parent_dir, "output")

    extract_audio(video_path, output_dir)