import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { TtsSettings } from '@/types'
import { DEFAULT_TTS_SETTINGS } from '@/types'

const STORAGE_KEY = 'virtual-human-settings'

function loadSettings(): TtsSettings & { muted: boolean; danmaku: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { muted: false, danmaku: true, ...DEFAULT_TTS_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return { muted: false, danmaku: true, ...DEFAULT_TTS_SETTINGS }
}

export const useSettingsStore = defineStore('settings', () => {
  const speaker = ref(DEFAULT_TTS_SETTINGS.speaker)
  const volume = ref(DEFAULT_TTS_SETTINGS.volume)
  const speed = ref(DEFAULT_TTS_SETTINGS.speed)
  const pitch = ref(DEFAULT_TTS_SETTINGS.pitch)
  const muted = ref(false)
  const danmaku = ref(true)

  // Load from localStorage
  const saved = loadSettings()
  speaker.value = saved.speaker
  volume.value = saved.volume
  speed.value = saved.speed
  pitch.value = saved.pitch
  muted.value = saved.muted ?? false
  danmaku.value = saved.danmaku ?? true

  const ttsParams = computed(() => ({
    speaker: speaker.value,
    volume: volume.value,
    speed: speed.value,
    pitch: pitch.value,
  }))

  // Watch changes and persist to localStorage
  watch([speaker, volume, speed, pitch, muted, danmaku], () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      speaker: speaker.value,
      volume: volume.value,
      speed: speed.value,
      pitch: pitch.value,
      muted: muted.value,
      danmaku: danmaku.value,
    }))
  })

  function updateSpeaker(v: number) { speaker.value = v }
  function updateVolume(v: number) { volume.value = v }
  function updateSpeed(v: number) { speed.value = v }
  function toggleMuted() { muted.value = !muted.value }
  function toggleDanmaku() { danmaku.value = !danmaku.value }

  return {
    speaker, volume, speed, pitch, muted, danmaku, ttsParams,
    updateSpeaker, updateVolume, updateSpeed, toggleMuted, toggleDanmaku,
  }
})
