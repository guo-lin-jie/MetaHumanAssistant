"""
大模型对话服务（LLM）
基于LangChain实现，使用 ConversationSummaryBufferMemory（工业标准方案）
自动在窗口模式和摘要模式之间智能切换
"""
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationSummaryBufferMemory
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from config.settings import LLM_BASE_URL, LLM_API_KEY, LLM_MODEL_NAME, SYSTEM_PROMPT
from models.database import SessionManager, MessageManager, SQLiteChatMessageHistory
from typing import Optional, Dict
import uuid

# 初始化大模型客户端
_llm = ChatOpenAI(
    base_url=LLM_BASE_URL,
    api_key=LLM_API_KEY,
    model=LLM_MODEL_NAME,
    temperature=0.7,
    streaming=True,
    request_timeout=30,
)

# 会话内存缓存
_session_memories: Dict[str, ConversationSummaryBufferMemory] = {}


def _get_or_create_memory(session_id: str, user_id: int = 1) -> ConversationSummaryBufferMemory:
    """
    获取或创建会话内存
    使用 ConversationSummaryBufferMemory + 自定义 SQLiteChatMessageHistory（自动读写 messages 表）
    """
    if session_id not in _session_memories:
        # 使用自定义 ChatMessageHistory 自动从 messages 表加载/保存消息
        chat_history = SQLiteChatMessageHistory(session_id=session_id)

        memory = ConversationSummaryBufferMemory(
            llm=_llm,
            chat_memory=chat_history,  # 传入自动管理消息的 chat_memory
            max_token_limit=2000,      # Token阈值：超过2000时自动摘要
            return_messages=True,
            memory_key="chat_history"
        )

        print(f"[内存] 会话 {session_id[:8]}... 使用 SummaryBufferMemory + SQLiteChatMessageHistory")

        _session_memories[session_id] = memory

    return _session_memories[session_id]


def _get_or_create_session(session_id: Optional[str] = None, user_id: int = 1) -> str:
    """获取或创建会话"""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    session = SessionManager.get_session(session_id)
    if not session:
        SessionManager.create_session(user_id, session_id, "新对话")
    
    return session_id


def chat(user_text: str, session_id: Optional[str] = None, user_id: int = 1) -> str:
    """
    发送消息获取AI回复，使用智能上下文管理
    :param user_text: 用户输入文字
    :param session_id: 会话ID（可选）
    :param user_id: 用户ID
    :return: AI回复文字
    """
    session_id = _get_or_create_session(session_id, user_id)
    memory = _get_or_create_memory(session_id, user_id)

    # SQLiteChatMessageHistory 会自动保存消息到 messages 表
    # 这里只需要把用户消息加入 memory（用于计算 token 和生成摘要）
    memory.chat_memory.add_message(HumanMessage(content=user_text))

    # 使用LangChain内存获取上下文（自动包含摘要+最近消息）
    chat_history = memory.load_memory_variables({})
    print(f"[DEBUG] chat_history 消息数: {len(chat_history.get('chat_history', []))}")

    # 调用LLM
    response = _llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        *chat_history.get('chat_history', []),
        HumanMessage(content=user_text)
    ])

    print(response)
    reply = response.content

    # 保存AI回复（SQLiteChatMessageHistory 会自动写入 messages 表）
    memory.chat_memory.add_message(AIMessage(content=reply))

    # 如果是第一条AI回复，生成会话标题
    session = SessionManager.get_session(session_id)
    if session and session['message_count'] <= 2:
        _generate_session_title(session_id, user_text, reply)
    return reply


async def chat_stream_async(user_text: str, session_id: Optional[str] = None, user_id: int = 1):
    """
    异步流式对话 — 逐 token 返回 AI 回复
    :param user_text: 用户输入
    :param session_id: 会话ID
    :param user_id: 用户ID
    """

    session_id = _get_or_create_session(session_id, user_id)
    memory = _get_or_create_memory(session_id, user_id)

    # SQLiteChatMessageHistory 会自动保存消息到 messages 表
    memory.chat_memory.add_message(HumanMessage(content=user_text))

    # 获取历史上下文（自动包含摘要+最近消息）
    chat_history = memory.load_memory_variables({})

    full_reply = ""

    print("开始调用")
    # 流式调用
    async for chunk in _llm.astream([
        SystemMessage(content=SYSTEM_PROMPT),
        *chat_history.get('chat_history', []),
        HumanMessage(content=user_text)
    ]):
        token = chunk.content if hasattr(chunk, "content") else str(chunk)
        if token:
            full_reply += token
            print(token, end="", flush=True)
            yield token
    
    print(full_reply)
    # 保存AI回复（SQLiteChatMessageHistory 会自动写入 messages 表）
    memory.chat_memory.add_message(AIMessage(content=full_reply))
    
    # 如果是第一条AI回复，生成会话标题
    session = SessionManager.get_session(session_id)
    if session and session['message_count'] <= 2:
        _generate_session_title(session_id, user_text, full_reply)


def _estimate_tokens(text: str) -> int:
    """简单估算token数量（中文约1字符=1token）"""
    chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    other_chars = len(text) - chinese_chars
    return chinese_chars + (other_chars // 4)


def _generate_session_title(session_id: str, first_user_msg: str, first_ai_msg: str):
    """根据前几条消息生成会话标题"""
    try:
        title_prompt = f"""请为以下对话生成一个简洁的标题，概括主要话题：

用户: {first_user_msg[:100]}
AI: {first_ai_msg[:100]}

标题："""
        
        response = _llm.invoke([HumanMessage(content=title_prompt)])
        title = response.content.strip()[:15]
        SessionManager.update_session_title(session_id, title)
        print(f"[标题生成] 会话标题: {title}")
    except Exception as e:
        print(f"[标题生成] 失败: {e}")
        # 使用用户第一条消息作为标题
        SessionManager.update_session_title(session_id, first_user_msg[:15])


def clear_history(session_id: Optional[str] = None):
    """清空对话历史"""
    if session_id:
        SessionManager.delete_session(session_id)
        # 清除内存缓存
        if session_id in _session_memories:
            del _session_memories[session_id]
    else:
        # 向后兼容：删除默认会话
        default_id = "default_session"
        SessionManager.delete_session(default_id)
        if default_id in _session_memories:
            del _session_memories[default_id]


def get_session_list(user_id: int = 1, limit: int = 50):
    """获取用户的会话列表"""
    return SessionManager.get_user_sessions(user_id, limit)


def get_session_messages(session_id: str, limit: int = None):
    """获取会话的消息列表"""
    return MessageManager.get_session_messages(session_id, limit)


def delete_session(session_id: str):
    """删除指定会话"""
    SessionManager.delete_session(session_id)
    # 清除内存缓存
    if session_id in _session_memories:
        del _session_memories[session_id]
