import { ref, watch } from 'vue'
import RecordRTC from 'recordrtc'
import { speechToText, ttsUrl } from '@/api'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'

// Module-level singleton state — shared across all component instances
const isRecording = ref(false)
const isPlaying = ref(false)
const audioLevel = ref(0)
const error = ref<string | null>(null)

let recorder: any = null
let stream: MediaStream | null = null
let audioEl: HTMLAudioElement | null = null
let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animFrameId: number = 0
let watchInstalled = false

// Lazy store accessors — defer init until after Pinia is active
let _chatStore: ReturnType<typeof useChatStore> | null = null
let _settingsStore: ReturnType<typeof useSettingsStore> | null = null

function getChatStore() {
  if (!_chatStore) _chatStore = useChatStore()
  return _chatStore
}
function getSettingsStore() {
  if (!_settingsStore) _settingsStore = useSettingsStore()
  return _settingsStore
}

let ttsMsgId = ''     // which message we last sent to TTS
let ttsPlayedLen = 0   // how much of that message was played
let ttsTimer: ReturnType<typeof setTimeout> | null = null

function scheduleTTS() {
  if (ttsTimer) clearTimeout(ttsTimer)
  ttsTimer = setTimeout(doPlayTTS, 500)
}

function doPlayTTS() {
  const store = getChatStore()
  if (store.isThinking) return // stream still going, schedule will retry
  const msg = store.lastAiMessage

  if (!msg?.content || getSettingsStore().muted) return

  // 检查当前会话是否已经过 TTS 处理
  const sessionId = store.sessionInfo.currentSessionId
  if (store.sessionInfo.ttsProcessedSessions?.has(sessionId)) {
    return
  }

  const newContent = msg.content.slice(ttsPlayedLen)
  // Play if: new message OR substantial new content OR stream just finished
  if (msg.id !== ttsMsgId || newContent.length > 5) {
    ttsMsgId = msg.id
    ttsPlayedLen = msg.content.length
    playTTS(msg.content)
  }
}

function installWatch() {
  if (watchInstalled) return
  watchInstalled = true

  // Watch content changes (now reactive thanks to splice in store)
  watch(
    () => getChatStore().lastAiMessage?.content ?? '',
    (content, oldContent) => {
      if (!content || getSettingsStore().muted) return
      const hasPunct = /[。！？\n]/.test(content)
      if (hasPunct) {
        // Sentence boundary — play soon (debounced)
        scheduleTTS()
      }
    }
  )

  // When streaming completes, play remaining
  watch(() => getChatStore().isThinking, (thinking, oldThinking) => {
    if (thinking) return
    // Streaming just finished — play immediately
    const msg = getChatStore().lastAiMessage
    if (!msg?.content || getSettingsStore().muted) return
    ttsMsgId = msg.id
    ttsPlayedLen = msg.content.length
    if (ttsTimer) clearTimeout(ttsTimer)
    playTTS(msg.content)
  })
}

export function useAudio() {
  // Ensure the watcher is only installed once
  installWatch()

  async function startRecording() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: (RecordRTC as any).StereoAudioRecorder,
        numberOfAudioChannels: 1,
        sampleRate: 44100,
        desiredSampRate: 16000,
        bufferSize: 4096,
      })
      recorder.startRecording()
      isRecording.value = true
    } catch (e: any) {
      error.value = '麦克风权限失败: ' + e.message
    }
  }

  function stopRecording() {
    if (!isRecording.value || !recorder) return
    recorder.stopRecording(async () => {
      const blob = recorder.getBlob()
      isRecording.value = false
      cleanupStream()

      try {
        const response = await speechToText(blob)
        if (response.code === 0 && response.data) {
          // 使用流式对话，保持一致性
          await getChatStore().sendMessageStream(response.data.text)
        } else {
          error.value = response.msg || '识别失败'
        }
      } catch (e: any) {
        error.value = '识别请求失败: ' + e.message
      }
    })
  }

  return { isRecording, isPlaying, audioLevel, error, startRecording, stopRecording, playTTS }
}

// ---- Internal helpers ----

async function playTTS(text: string) {
  stopAudioAnalyzer()
  isPlaying.value = true

  const url = ttsUrl(
    text,
    getSettingsStore().speaker,
    getSettingsStore().volume,
    getSettingsStore().speed
  )

  return new Promise<void>((resolve) => {
    audioEl = new Audio(url)
    audioEl.onended = () => {
      isPlaying.value = false
      stopAudioAnalyzer()
      resolve()
    }
    audioEl.onerror = () => {
      isPlaying.value = false
      stopAudioAnalyzer()
      resolve()
    }
    audioEl.play().then(() => {
      startAudioAnalyzer(audioEl!)
    }).catch(() => {
      isPlaying.value = false
      resolve()
    })
  })
}

function startAudioAnalyzer(el: HTMLAudioElement) {
  try {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    const source = audioCtx.createMediaElementSource(el)
    source.connect(analyser)
    analyser.connect(audioCtx.destination)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    function tick() {
      if (!analyser) return
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      audioLevel.value = Math.min(avg / 128, 1)
      animFrameId = requestAnimationFrame(tick)
    }
    tick()
  } catch {}
}

function stopAudioAnalyzer() {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  if (audioCtx) audioCtx.close().catch(() => {})
  audioCtx = null
  analyser = null
  audioLevel.value = 0
}

function cleanupStream() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  recorder = null
}
