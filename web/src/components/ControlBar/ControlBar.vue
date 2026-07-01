<template>
  <div class="control-bar">
    <div class="input-row">
      <button
        class="mic-btn"
        :class="{ recording: isRecording }"
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="onMicLeave"
        :disabled="isPlaying"
        :title="isRecording ? '松开发送语音' : '按住录音'"
      >
        <svg v-if="!isRecording" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <span v-else class="rec-icon"></span>
        <span class="mic-label">{{ isRecording ? '松开发送' : '按住' }}</span>
      </button>

      <input
        ref="inputRef"
        v-model="text"
        type="text"
        class="text-input"
        placeholder="输入消息..."
        @keydown.enter="sendText"
        :disabled="isPlaying || chatStore.isThinking"
      />

      <button
        class="send-btn"
        @click="sendText"
        :disabled="!text.trim() || chatStore.isThinking"
        title="发送"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAudio } from '@/composables/useAudio'
import { useChatStore } from '@/stores/chat'

const { isRecording, isPlaying, startRecording, stopRecording } = useAudio()
const chatStore = useChatStore()
const text = ref('')
const inputRef = ref<HTMLInputElement>()

function sendText() {
  if (!text.value.trim() || chatStore.isThinking) return
  chatStore.sendMessageStream(text.value.trim())
  text.value = ''
}

function onMicLeave() {
  if (isRecording.value) stopRecording()
}
</script>

<style scoped>
.control-bar {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-tertiary);
  flex-shrink: 0;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Mic button */
.mic-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid transparent;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  gap: 2px;
  flex-shrink: 0;
  position: relative;
}

.mic-btn:hover {
  background: var(--bg-card-hover);
  color: var(--accent-teal);
  border-color: rgba(20, 184, 166, 0.2);
}

.mic-btn.recording {
  background: var(--danger);
  color: #fff;
  border-color: transparent;
  animation: micPulse 1.2s ease infinite;
}

.mic-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mic-label {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
}

.rec-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  animation: recBlink 0.6s ease infinite;
}

@keyframes recBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes micPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
}

/* Text input */
.text-input {
  flex: 1;
  min-width: 0;
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-size: 14px;
  transition: all var(--transition-fast);
}
.text-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}
.text-input:disabled { opacity: 0.35; }
.text-input::placeholder { color: var(--text-muted); }

/* Send button */
.send-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent), #6366f1);
  color: #fff;
  transition: all var(--transition-spring);
  flex-shrink: 0;
}
.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent-light), #818cf8);
  box-shadow: 0 0 24px var(--accent-glow);
  transform: scale(1.05);
}
.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}
.send-btn:disabled {
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
}
</style>
