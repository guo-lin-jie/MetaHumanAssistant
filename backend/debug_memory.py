"""
调试脚本：验证 ConversationSummaryBufferMemory 是否正常工作
"""
import sys
sys.path.insert(0, '.')

from services.llm_service import _get_or_create_memory
from langchain.schema import HumanMessage, AIMessage

# 传入一个已有的 session_id，或者新建一个测试
session_id = input("请输入要测试的 session_id (直接回车创建新测试): ").strip()

if not session_id:
    # 创建一个临时的 session_id 用于测试
    from services.llm_service import _get_or_create_session
    session_id = _get_or_create_session(None, user_id=1)
    print(f"创建新会话: {session_id}")

print(f"\n=== 测试会话: {session_id} ===\n")

# 获取 memory
memory = _get_or_create_memory(session_id)

# 查看当前 memory 里的消息
print("=== chat_memory.messages ===")
for i, msg in enumerate(memory.chat_memory.messages):
    content = msg.content if hasattr(msg, 'content') else str(msg)
    print(f"{i+1}. [{msg.__class__.__name__}] {content[:50]}...")

# 查看 memory 的属性
print("\n=== memory 属性 ===")
print(f"max_token_limit: {memory.max_token_limit}")
print(f"llm: {memory.llm}")

# 调用 load_memory_variables 看看返回什么
print("\n=== load_memory_variables() 结果 ===")
result = memory.load_memory_variables({})
chat_history = result.get('chat_history', [])
print(f"chat_history 消息数量: {len(chat_history)}")
for i, msg in enumerate(chat_history):
    content = msg.content if hasattr(msg, 'content') else str(msg)
    print(f"{i+1}. [{msg.__class__.__name__}] {content[:80]}...")

# 如果有摘要消息，单独显示
print("\n=== 检查摘要 ===")
summary_found = False
for msg in chat_history:
    if hasattr(msg, 'type') and msg.type == 'system':
        print(f"发现摘要: {msg.content[:100]}...")
        summary_found = True
if not summary_found:
    print("暂无摘要（消息数量未超过 token 限制）")