import librosa
import numpy as np
import whisper

def analyze_audio_librosa(audio_path: str) -> dict:

    try:
        import soundfile as sf
        data, sr = sf.read(audio_path)  # librosa.load 대신 soundfile로 먼저 테스트
        print(f"1. soundfile 로딩 완료 - sr={sr}, shape={data.shape}")

        import numpy as np
        y = data.astype(np.float32)
        if len(y.shape) > 1:
            y = y.mean(axis=1)  # 스테레오면 모노로 변환
        print(f"2. numpy 변환 완료 - {len(y)}샘플, {len(y)/sr:.2f}초")

        print("3. tempo 시작")
        tempo = librosa.feature.tempo(y=y, sr=sr)
        print(f"4. tempo 완료 - {float(tempo[0]):.1f} BPM")

 
        # 피치 (F0 추정)
        f0 = librosa.yin(y, fmin=50, fmax=400, sr=sr)
        f0_voiced = f0[f0 > 0]  # 유성음 구간만
        pitch_mean = float(np.mean(f0_voiced)) if len(f0_voiced) > 0 else 0.0
        pitch_std = float(np.std(f0_voiced)) if len(f0_voiced) > 0 else 0.0

        print("5. pitch 완료")
        if len(f0_voiced) > 0:
            print(f"  평균: {np.mean(f0_voiced):.1f} Hz")
            print(f"  최소: {np.min(f0_voiced):.1f} Hz")
            print(f"  최대: {np.max(f0_voiced):.1f} Hz")
            print(f"  표준편차: {np.std(f0_voiced):.1f} Hz")
        else:
            print("  유성음 구간 없음 (무음 또는 잡음만 있는 파일)")
  
        return {
            "tempo_bpm": round(float(tempo[0]), 2),
            "pitch_mean_hz": round(pitch_mean, 2),
            "pitch_std_hz": round(pitch_std, 2),
        }
    except Exception as e:
        return {"error": str(e)}
    
def transcribe_audio_whisper(audio_path: str, model_size: str = "base") -> dict:
    try:
        model = whisper.load_model(model_size)
        result = model.transcribe(audio_path, fp16=False)
 
        segments = [
            {
                "start": round(seg["start"], 2),
                "end": round(seg["end"], 2),
                "text": seg["text"].strip()
            }
            for seg in result.get("segments", [])
        ]

        print(result["text"])
        
        return {
            "text": result.get("text", "").strip(),
            "language": result.get("language", "unknown"),
            "segments": segments
        }
 
    except Exception as e:
        return {"text": "", "language": "unknown", "segments": [], "error": str(e)}

if __name__ == "__main__":
    import os

    current_dir = os.path.dirname(os.path.abspath(__file__))

    parent_dir = os.path.dirname(current_dir)

    audio_path = os.path.join(parent_dir, "output/audio.wav")

    analyze_audio_librosa(audio_path)
    transcribe_audio_whisper(audio_path)