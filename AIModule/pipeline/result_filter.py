def filter_emotion_result(result: dict, min_confidence: float = 0.5) -> dict:
    """
    신뢰도 낮은 표정 분석 결과 필터링
    얼굴이 부분적으로만 보이거나 역광일 때 confidence가 낮게 나옴
    """
    if not result.get("face_detected"):
        return None  # 얼굴 미감지 프레임 제외

    if result.get("confidence", 0) < min_confidence:
        return None  # 신뢰도 낮은 프레임 제외

    # neutral이 95% 이상이면 실제 분석 실패일 가능성이 높음
    emotions = result.get("emotions", {})
    if emotions.get("neutral", 0) > 95:
        return None

    return result


def filter_gaze_result(result: dict) -> dict:
    """
    시선 분석 신뢰도 필터링
    홍채 비율이 극단적이면 얼굴이 심하게 기울어진 것
    """
    if not result.get("face_detected"):
        return None

    avg_ratio = result.get("avg_ratio", 0.5)

    # 0.1 미만 또는 0.9 초과면 얼굴이 너무 옆을 향한 것 → 신뢰 불가
    if avg_ratio < 0.1 or avg_ratio > 0.9:
        return None

    return result