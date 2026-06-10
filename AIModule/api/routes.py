
from fastapi import APIRouter, BackgroundTasks, WebSocket, WebSocketDisconnect
from core.runner import run_pipeline, send_to_spring

import numpy as np
import cv2
import base64
import json
import asyncio

router = APIRouter()

#라우터 엔드포인트에 따라 구현
@router.post("/analyze")
async def analyze(payload: dict, background_tasks: BackgroundTasks):
    # 즉시 응답 반환
    background_tasks.add_task(run_and_callback, payload)
    return {"status": "processing"}  # Spring은 여기서 바로 받음

async def run_and_callback(payload: dict):
    try:
        # 백그라운드에서 분석 후 콜백
        result = run_pipeline(payload["video_path"])
        callback_payload = {
            "interview_id": str(payload.get("interview_id")),
            "status": "success",
            "result": result
        }
        await send_to_spring(payload["callback_url"], callback_payload)
    except Exception as e:
        import traceback
        error_msg = f"Python pipeline error: {str(e)}\n{traceback.format_exc()}"
        print(f"[분석 오류 발생] {error_msg}")
        callback_payload = {
            "interview_id": str(payload.get("interview_id")),
            "status": "error",
            "error": error_msg
        }
        try:
            await send_to_spring(payload["callback_url"], callback_payload)
        except Exception as ex:
            print(f"[콜백 오류] {str(ex)}")

@router.websocket("/ws/analyze/{session_id}")
async def realtime_analyze(websocket: WebSocket, session_id: str):
    await websocket.accept()
    print(f"[WebSocket 연결] session_id={session_id}")

    from pipeline.emotion import EmotionAnalyzer
    from pipeline.gaze import analyze_gaze
    from pipeline.video_enhance import enhance_frame

    # FaceMesh 객체 재사용 (매 프레임마다 생성 X)
    from mediapipe.solutions import face_mesh as mp_face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        refine_landmarks=True,
        max_num_faces=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    try:
        while True:
            raw = await websocket.receive_text()
            payload = json.loads(raw)
            msg_type = payload.get("type")

            # ── 영상 프레임 수신 ──
            if msg_type == "frame":
                img_bytes = base64.b64decode(payload["data"])
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                frame = enhance_frame(frame)
                emotion = EmotionAnalyzer.analyze_emotion(frame, face_mesh)
                gaze    = analyze_gaze(frame, face_mesh)

                await websocket.send_json({
                    "type": "frame_result",
                    "session_id": session_id,
                    "emotion": emotion,
                    "gaze": gaze
                })

    except WebSocketDisconnect:
        print(f"[WebSocket 종료] session_id={session_id}")
        face_mesh.close()