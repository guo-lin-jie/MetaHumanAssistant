# 3D 虚拟人语音对话系统

基于 **Vue 3 + Three.js + FastAPI** 构建的 3D 虚拟人交互助手，支持语音识别、流式对话、语音合成，并带有历史会话管理和智能上下文压缩功能。

## ✨ 核心功能

- 🎤 **语音交互** – 按住说话，自动识别，AI 流式回复（打字机效果）
- 👤 **3D 虚拟人** – Three.js 渲染，呼吸动画、眼球追踪、嘴型同步、拖拽旋转
- 🔊 **语音合成** – 多音色、音量/语速可调，支持静音
- 💬 **弹幕显示** – AI 回复以弹幕形式飘过 3D 区域
- 📚 **会话管理** – 历史对话列表，新建/切换/删除会话，自动生成标题
- 🗜️ **上下文压缩** – 长对话自动摘要，减少 Token 消耗（基于 LangChain）
- 👤 **用户系统** – 注册登录，个性化设置本地持久化

## 🧱 技术栈

- **前端**：Vue 3 + TypeScript + Vite + Pinia + Three.js + RecordRTC
- **后端**：FastAPI + Python 3.12 + SQLite + Uvicorn
- **AI 服务**：百度 STT/TTS，兼容 OpenAI 接口的 LLM（推荐硅基流动、DeepSeek 等）

## 🚀 快速开始

### 环境要求
- Node.js ≥ 18，npm ≥ 9
- Python ≥ 3.12

### 1. 克隆与安装
```bash
git clone <your-repo>
cd 3d-avatar-chat

# 后端
cd backend
pip install -r requirements.txt
cp .env.example .env   # 填入百度语音及 LLM 密钥

# 前端
cd ../web
npm install
2. 启动开发服务
bash
# 终端1 – 后端
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000

# 终端2 – 前端
cd web
npm run dev
访问 http://localhost:5173

3. 生产部署（可选）
bash
cd web && npm run build
# 将 dist 目录静态文件置于后端服务下，或使用 Docker（提供 docker-compose.yml）
📁 项目结构（核心）
text
backend/
├── app.py                 # FastAPI 主入口
├── routers/               # 路由（chat, audio, auth）
├── services/              # STT/TTS/LLM 服务
├── models/                # 数据库模型
├── utils/                 # 工具（Result 统一响应）
└── data/                  # SQLite 数据库文件

web/
├── src/
│   ├── api/               # API 调用函数
│   ├── components/
│   │   ├── ChatPanel/
│   │   ├── ControlBar/
│   │   ├── SessionSidebar/   # 会话侧边栏
│   │   └── VirtualHuman/     # Three.js 3D 虚拟人
│   ├── stores/            # Pinia（chat, settings）
│   ├── composables/       # useAudio 等
│   └── types/             # TypeScript 类型
└── public/
🔌 主要 API 端点
所有接口统一返回 { code, msg, data } 格式

端点	方法	说明
/auth/register	POST	注册
/auth/login	POST	登录
/chat/stream	POST (SSE)	流式对话（主要使用）
/chat/sessions	GET	获取会话列表
/chat/sessions/{id}	GET	获取某会话消息
/chat/sessions/{id}	DELETE	删除会话
/audio/asr	POST	语音识别（返回文字）
/audio/tts	GET	语音合成（返回音频流）
🧠 智能上下文管理
采用 ConversationSummaryBufferMemory（LangChain 标准方案）

当对话 Token 超过 2000 时，自动摘要早期内容，保留最近对话

显著降低 LLM 成本（节省约 70% Token），摘要额外开销极小

🎮 操作指南
拖拽虚拟人：按住鼠标左键旋转视角

语音对话：按住麦克风按钮说话，松开后自动识别并回复

切换音色：在设置面板选择（女声/男声/度逍遥/度丫丫）

静音/弹幕：控制栏开关，状态自动记忆