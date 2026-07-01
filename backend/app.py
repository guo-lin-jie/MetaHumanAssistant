"""
虚拟人项目启动入口
"""
import os
from dotenv import load_dotenv

# 加载 .env 文件（必须在其他 import 之前）
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config.settings import SERVER_HOST, SERVER_PORT, AUDIO_CACHE_DIR
from api.audio_router import router as audio_router
from api.chat_router import router as chat_router
from api.auth_router import router as auth_router

# 创建音频缓存目录
os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)

# 初始化应用
app = FastAPI(title="虚拟人语音对话系统", version="2.0.0")

# 跨域中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册业务路由
app.include_router(auth_router)
app.include_router(audio_router)
app.include_router(chat_router)

# 挂载静态前端页面（访问根路径直接打开前端）
# 注意：从backend目录运行，需要回到上级目录的web/dist
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
app.mount("/", StaticFiles(directory="../web/dist", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
