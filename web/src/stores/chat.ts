import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatSession } from '@/types'
import {
  sendMessage as apiSend,
  sendMessageStream as apiSendStream,
  clearChat as apiClear,
  getSessionList,
  getSessionMessages,
  deleteSession as apiDeleteSession,
} from '@/api'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isThinking = ref(false)
  const error = ref<string | null>(null)
  
  // 当前会话ID（持久化）
  const currentSessionId = ref<string>('')
  const sessions = ref<ChatSession[]>([])
  const isLoadingSessions = ref(false)

  // 记录每个会话的 TTS 是否已处理（避免重复播放历史消息）
  const ttsProcessedSessions = ref<Set<string>>(new Set())

  const lastAiMessage = computed(() => {
    const ai = messages.value.filter(m => m.role === 'ai')
    return ai.length > 0 ? ai[ai.length - 1] : null
  })

  // 导出 session 信息供 TTS 使用
  const sessionInfo = computed(() => ({
    currentSessionId: currentSessionId.value,
    ttsProcessedSessions: ttsProcessedSessions.value
  }))

  function addMessage(role: 'user' | 'ai', content: string) {
    messages.value.push({
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: Date.now(),
    })
  }

  /** 初始化或加载会话 */
  async function initSession(sessionId?: string) {
    if (sessionId) {
      currentSessionId.value = sessionId
      // 从后端加载会话消息
      await loadSessionMessages(sessionId)
    } else {
      // 创建新会话
      currentSessionId.value = crypto.randomUUID()
      messages.value = []
    }

    // 持久化当前会话ID
    localStorage.setItem('current_session_id', currentSessionId.value)
  }

  /** 加载会话消息 */
  async function loadSessionMessages(sessionId: string) {
    try {
      const response = await getSessionMessages(sessionId)
      if (response.code === 0 && response.data) {
        messages.value = response.data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role as 'user' | 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp).getTime(),
        }))
        // 标记该会话的 TTS 已处理，避免加载历史消息时自动播放
        ttsProcessedSessions.value.add(sessionId)
      }
    } catch (e: any) {
      console.error('加载会话消息失败:', e)
      error.value = e.message || '加载失败'
    }
  }

  /** 加载会话列表 */
  async function loadSessions() {
    isLoadingSessions.value = true
    try {
      const response = await getSessionList(50)
      if (response.code === 0 && response.data) {
        sessions.value = response.data.sessions
      }
    } catch (e: any) {
      console.error('加载会话列表失败:', e)
      error.value = e.message || '加载失败'
    } finally {
      isLoadingSessions.value = false
    }
  }

  /** 切换到指定会话 */
  async function switchSession(sessionId: string) {
    currentSessionId.value = sessionId
    localStorage.setItem('current_session_id', sessionId)
    await loadSessionMessages(sessionId)
  }

  /** 删除会话 */
  async function deleteSession(sessionId: string) {
    try {
      const response = await apiDeleteSession(sessionId)
      if (response.code === 0) {
        // 从列表中移除
        sessions.value = sessions.value.filter(s => s.id !== sessionId)
        
        // 如果删除的是当前会话，创建新会话
        if (currentSessionId.value === sessionId) {
          await initSession()
        }
      } else {
        error.value = response.msg || '删除失败'
      }
    } catch (e: any) {
      error.value = e.message || '删除失败'
    }
  }

  /** 普通对话（一次性返回） */
  async function sendMessage(text: string) {
    if (!text.trim() || isThinking.value) return
    
    // 确保有会话ID
    if (!currentSessionId.value) {
      await initSession()
    }
    
    addMessage('user', text)
    isThinking.value = true
    error.value = null

    try {
      const response = await apiSend(text, currentSessionId.value)
      if (response.code === 0 && response.data) {
        addMessage('ai', response.data.reply)
        // 标记当前会话的 TTS 已处理
        ttsProcessedSessions.value.add(currentSessionId.value)
        // 刷新会话列表（更新标题和时间）
        await loadSessions()
      } else {
        error.value = response.msg || '未知错误'
      }
    } catch (e: any) {
      error.value = e.message || '请求失败'
    } finally {
      isThinking.value = false
    }
  }

  /** 流式对话（逐 token 追加，默认使用） */
  async function sendMessageStream(text: string) {
    if (!text.trim() || isThinking.value) return
    
    // 确保有会话ID
    if (!currentSessionId.value) {
      await initSession()
    }
    
    addMessage('user', text)
    isThinking.value = true
    error.value = null

    // 先插入一个空的 AI 消息，后续逐 token 追加
    const streamId = crypto.randomUUID()
    messages.value.push({
      id: streamId,
      role: 'ai',
      content: '',
      timestamp: Date.now(),
    })

    await apiSendStream(
      text,
      (token) => {
        // Append token via splice → triggers array reactivity
        const idx = messages.value.findIndex(m => m.id === streamId)
        if (idx >= 0) {
          messages.value.splice(idx, 1, {
            ...messages.value[idx],
            content: messages.value[idx].content + token,
          })
        }
      },
      async () => {
        isThinking.value = false
        // 标记当前会话的 TTS 已处理
        if (currentSessionId.value) {
          ttsProcessedSessions.value.add(currentSessionId.value)
        }
        // 刷新会话列表
        await loadSessions()
      },
      (err) => {
        error.value = err
        // 移除空消息
        const idx = messages.value.findIndex(m => m.id === streamId)
        if (idx >= 0 && !messages.value[idx].content) {
          messages.value.splice(idx, 1)
        }
        isThinking.value = false
      },
      currentSessionId.value
    )
  }

  async function clearHistory() {
    try {
      const response = await apiClear(currentSessionId.value)
      if (response.code === 0) {
        messages.value = []
        await loadSessions()
      } else {
        error.value = response.msg || '清空失败'
      }
    } catch (e: any) {
      error.value = e.message
    }
  }

  return {
    messages,
    isThinking,
    error,
    lastAiMessage,
    currentSessionId,
    sessions,
    isLoadingSessions,
    ttsProcessedSessions,
    sessionInfo,
    sendMessage,
    sendMessageStream,
    clearHistory,
    initSession,
    loadSessions,
    switchSession,
    deleteSession,
  }
})
