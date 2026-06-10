import numpy as np
import librosa
import soundfile as sf

def enhance_audio(audio_path: str, output_path: str) -> str:
    """
    웹캠 음성 품질 보정
    1. 무음 구간 기반 노이즈 프로파일 추정
    2. 스펙트럼 차감으로 노이즈 제거
    3. 음량 정규화
    """
    y, sr = sf.read(audio_path)
    y = y.astype(np.float32)
    if len(y.shape) > 1:
        y = y.mean(axis=1)

    # 1. 노이즈 프로파일 추정 (앞 0.5초를 무음/노이즈 구간으로 가정)
    noise_sample = y[:int(sr * 0.5)]
    noise_profile = np.mean(np.abs(librosa.stft(noise_sample)), axis=1, keepdims=True)

    # 2. 스펙트럼 차감 (노이즈 제거)
    D = librosa.stft(y)
    magnitude, phase = np.abs(D), np.angle(D)

    # 노이즈 프로파일을 전체 길이에 맞게 확장
    noise_profile_full = np.repeat(noise_profile, magnitude.shape[1], axis=1)

    # 노이즈보다 작은 성분은 0으로 (과차감 방지를 위해 0.5 계수 사용)
    cleaned = np.maximum(magnitude - noise_profile_full * 0.5, 0)
    D_cleaned = cleaned * np.exp(1j * phase)
    y_cleaned = librosa.istft(D_cleaned)

    # 3. 음량 정규화 (RMS 기반)
    target_rms = 0.05
    current_rms = np.sqrt(np.mean(y_cleaned ** 2))
    if current_rms > 0:
        y_cleaned = y_cleaned * (target_rms / current_rms)

    # 클리핑 방지
    y_cleaned = np.clip(y_cleaned, -1.0, 1.0)

    sf.write(output_path, y_cleaned, sr)
    return output_path