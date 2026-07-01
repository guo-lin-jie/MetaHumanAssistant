"""
语音合成服务（TTS）
封装百度语音合成能力，后续换服务商只需修改本文件
"""
from aip import AipSpeech
from config.settings import BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY

_client = AipSpeech(BAIDU_APP_ID, BAIDU_API_KEY, BAIDU_SECRET_KEY)


def synthesize_speech(
    text: str,
    speed: int = 5,
    pitch: int = 5,
    volume: int = 5,
    speaker: int = 0
) -> bytes:
    """
    文字转语音二进制
    :param text: 待合成文字
    :param speed: 语速 0-9
    :param pitch: 音调 0-9
    :param volume: 音量 0-9
    :param speaker: 发音人 0女声/1男声/3度逍遥/4度丫丫
    :return: mp3音频二进制
    :raises Exception: 合成失败抛出异常
    """
    result = _client.synthesis(
        text,
        lang='zh',
        ctp=1,
        options={"spd": speed, "pit": pitch, "vol": volume, "per": speaker}
    )

    if not isinstance(result, dict):
        return result
    raise Exception(f"语音合成失败: {result.get('err_msg', '未知错误')}")