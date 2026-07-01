"""
全局配置 — 所有配置项从环境变量 / .env 文件读取
"""
import os

# ========== 百度语音服务配置 ==========
BAIDU_APP_ID = os.getenv("BAIDU_APP_ID", "")
BAIDU_API_KEY = os.getenv("BAIDU_API_KEY", "")
BAIDU_SECRET_KEY = os.getenv("BAIDU_SECRET_KEY", "")

# ========== 大模型配置（LangChain，兼容OpenAI格式）==========
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "glm-4.7-flash")
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    "你是一个亲切自然的虚拟助手，使用中文回答相应问题。",
)

# ========== 服务配置 ==========
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
AUDIO_CACHE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "audio_cache"
)
