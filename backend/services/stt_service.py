"""
语音识别服务（STT）
封装百度短语音识别能力，后续换服务商只需修改本文件
"""
from aip import AipSpeech
from config.settings import BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY

# 全局单例客户端，避免重复初始化
_client = AipSpeech(BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY)


def recognize_audio(audio_data: bytes, fmt: str = "wav", sample_rate: int = 16000) -> str:
    """
    音频二进制转文字
    :param audio_data: wav音频二进制
    :param fmt: 音频格式
    :param sample_rate: 采样率
    :return: 识别后的文字
    :raises Exception: 识别失败抛出异常
    """
    result = _client.asr(
        audio_data,
        fmt,
        sample_rate,
        {
            "dev_pid": 1537,
            "cuid": "virtual_human_web",
            "enable_noise_suppression": True
        }
    )

    if result.get("err_no") == 0:
        return result["result"][0]
    raise Exception(f"语音识别失败: {result.get('err_msg', '未知错误')}")