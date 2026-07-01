"""
对话服务接口路由
封装大模型对话能力，支持文字输入、历史清空、流式输出、多会话管理
"""
from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.llm_service import (
    chat, 
    chat_stream_async, 
    clear_history,
    get_session_list,
    get_session_messages,
    delete_session
)
from utils.result import Result

router = APIRouter(prefix="/chat", tags=["对话服务"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # 会话ID（可选）


@router.post("/send")
async def send_message(req: ChatRequest, x_user_id: Optional[str] = Header(None)):
    """发送文字消息，获取AI回复（一次性返回）"""
    user_id = int(x_user_id) if x_user_id else 1
    
    try:
        reply = chat(req.message, req.session_id, user_id)
        return Result.success(data={"reply": reply}, msg="回复成功")
    except Exception as e:
        return Result.error(msg=f"回复失败: {str(e)}")


@router.post("/stream")
async def send_message_stream(req: ChatRequest, x_user_id: Optional[str] = Header(None)):
    """发送文字消息，获取AI回复（SSE 流式，逐 token 返回）"""
    user_id = int(x_user_id) if x_user_id else 1
    
    async def event_stream():
        try:
            async for token in chat_stream_async(req.message, req.session_id, user_id):
                if token:  # 只yield非空token
                    yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/clear")
async def clear_chat_history(session_id: Optional[str] = None):
    """清空对话历史，重置会话"""
    try:
        clear_history(session_id)
        return Result.success(msg="对话历史已清空")
    except Exception as e:
        return Result.error(msg=f"清空失败: {str(e)}")


@router.get("/sessions")
async def list_sessions(x_user_id: Optional[str] = Header(None), limit: int = 50):
    """获取用户的会话列表"""
    user_id = int(x_user_id) if x_user_id else 1
    
    try:
        sessions = get_session_list(user_id, limit)
        return Result.success(data={"sessions": sessions}, msg="获取成功")
    except Exception as e:
        return Result.error(msg=f"获取会话列表失败: {str(e)}")


@router.get("/sessions/{session_id}")
async def get_session_msgs(session_id: str, limit: Optional[int] = None):
    """获取指定会话的消息列表"""
    try:
        messages = get_session_messages(session_id, limit)
        return Result.success(data={"messages": messages}, msg="获取成功")
    except Exception as e:
        return Result.error(msg=f"获取消息失败: {str(e)}")


@router.delete("/sessions/{session_id}")
async def remove_session(session_id: str):
    """删除指定会话"""
    try:
        delete_session(session_id)
        return Result.success(msg="会话已删除")
    except Exception as e:
        return Result.error(msg=f"删除失败: {str(e)}")
