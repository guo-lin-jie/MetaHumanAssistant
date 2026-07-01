export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: number
}

/** 会话信息 */
export interface ChatSession {
  id: string
  title: string
  summary?: string
  created_at: string
  updated_at: string
  message_count: number
  token_estimate?: number
}

/** 统一API响应格式 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T | null
}

/** 聊天发送接口响应数据 */
export interface ChatSendData {
  reply: string
}

/** 语音识别接口响应数据 */
export interface AsrData {
  text: string
}

/** 用户信息 */
export interface UserInfo {
  user_id: number
  username: string
  token?: string
  settings?: Record<string, any>
}

export interface TtsSpeaker {
  id: number
  name: string
  label: string
  icon: string
}

export interface TtsSettings {
  speaker: number
  volume: number
  speed: number
  pitch: number
}

export const TTS_SPEAKERS: TtsSpeaker[] = [
  { id: 0, name: 'female', label: '女声', icon: '👩' },
  { id: 1, name: 'male', label: '男声', icon: '👨' },
  { id: 3, name: 'duxiaoyao', label: '度逍遥', icon: '🧑' },
  { id: 4, name: 'duyaya', label: '度丫丫', icon: '👧' },
]

export const DEFAULT_TTS_SETTINGS: TtsSettings = {
  speaker: 0,
  volume: 5,
  speed: 5,
  pitch: 5,
}
