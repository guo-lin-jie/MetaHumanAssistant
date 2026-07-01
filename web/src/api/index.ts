import type { ApiResponse, ChatSendData, AsrData, ChatSession } from '@/types'

const BASE = '' // Vite proxy handles routing

// 获取用户ID（从localStorage）
function getUserId(): string | null {
  return localStorage.getItem('user_id')
}

/** 发送文字消息，获取AI回复（一次性返回） */
export async function sendMessage(message: string, sessionId?: string): Promise<ApiResponse<ChatSendData>> {
  const userId = getUserId()
  const res = await fetch(`${BASE}/chat/send`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {})
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 流式对话 — 返回 ReadableStream，逐 token 读取 */
export async function sendMessageStream(
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  sessionId?: string
): Promise<void> {
  try {
    const userId = getUserId()
    const res = await fetch(`${BASE}/chat/stream`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Id': userId } : {})
      },
      body: JSON.stringify({ message, session_id: sessionId }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (!res.body) throw new Error('No response body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') { 
          onDone(); 
          return 
        }
        if (data.startsWith('[ERROR]')) { 
          onError(data.slice(8)); 
          return 
        }
        onToken(data)
      }
    }
    onDone()
  } catch (e: any) {
    onError(e.message || 'Stream request failed')
  }
}

/** 清空对话历史 */
export async function clearChat(sessionId?: string): Promise<ApiResponse<null>> {
  const url = sessionId ? `${BASE}/chat/clear?session_id=${sessionId}` : `${BASE}/chat/clear`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 获取会话列表 */
export async function getSessionList(limit: number = 50): Promise<ApiResponse<{ sessions: ChatSession[] }>> {
  const userId = getUserId()
  const res = await fetch(`${BASE}/chat/sessions?limit=${limit}`, {
    headers: {
      ...(userId ? { 'X-User-Id': userId } : {})
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 获取指定会话的消息 */
export async function getSessionMessages(sessionId: string, limit?: number): Promise<ApiResponse<{ messages: any[] }>> {
  const url = limit ? `${BASE}/chat/sessions/${sessionId}?limit=${limit}` : `${BASE}/chat/sessions/${sessionId}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 删除会话 */
export async function deleteSession(sessionId: string): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE}/chat/sessions/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 语音识别：上传音频文件，识别为文字 */
export async function speechToText(audioBlob: Blob): Promise<ApiResponse<AsrData>> {
  const formData = new FormData()
  formData.append('audio_file', audioBlob, 'record.wav')
  const res = await fetch(`${BASE}/audio/asr`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** 生成TTS音频URL */
export function ttsUrl(
  text: string,
  speaker: number,
  volume: number,
  speed: number
): string {
  const params = new URLSearchParams({
    text,
    speaker: String(speaker),
    volume: String(volume),
    speed: String(speed),
  })
  return `${BASE}/audio/tts?${params.toString()}`
}
