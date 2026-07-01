"""
语音服务接口路由
包含：语音识别、语音合成
"""
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response
from services.stt_service import recognize_audio
from services.tts_service import synthesize_speech
from utils.result import Result

router = APIRouter(prefix="/audio", tags=["语音服务"])


@router.post("/asr")
async def audio_to_text(audio_file: UploadFile = File(...)):
    """上传音频文件，识别为文字"""
    try:
        audio_data = await audio_file.read()
        text = recognize_audio(audio_data)
        return Result.success(data={"text": text}, msg="识别成功")
    except Exception as e:
        return Result.error(msg=f"识别失败: {str(e)}")


@router.get("/tts")
async def text_to_audio(
    text: str,
    speaker: int = 0,
    volume: int = 5,
    speed: int = 5,
    pitch: int = 5
):
    """输入文字，返回语音音频流"""
    try:
        audio_bytes = synthesize_speech(
            text,
            speed=speed,
            pitch=pitch,
            volume=volume,
            speaker=speaker
        )
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        return Result.error(msg=f"合成失败: {str(e)}")