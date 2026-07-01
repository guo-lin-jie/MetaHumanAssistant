<template>
  <div class="danmaku-layer">
    <TransitionGroup name="dm" tag="div" class="dm-track">
      <div
        v-for="dm in danmakus"
        :key="dm.id"
        class="danmaku-item"
        :style="{ top: dm.top + '%', animationDuration: dm.duration + 's' }"
      >
        <span class="dm-text">{{ dm.text }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChatStore } from '@/stores/chat'

interface Danmaku {
  id: string
  text: string
  top: number
  duration: number
}

const danmakus = ref<Danmaku[]>([])
const chatStore = useChatStore()
let lastProcessedId = ''

// Watch isThinking: when it flips from true → false, AI just finished → emit danmaku
watch(
  () => chatStore.isThinking,
  (thinking, wasThinking) => {
    if (thinking || !wasThinking) return // only on true→false transition
    const last = chatStore.lastAiMessage
    if (!last || !last.content || last.id === lastProcessedId) return
    lastProcessedId = last.id

    const text = last.content.slice(0, 60) + (last.content.length > 60 ? '…' : '')
    const dm: Danmaku = {
      id: last.id + '-dm',
      text,
      top: 15 + Math.random() * 65,
      duration: 8 + Math.random() * 5,
    }
    danmakus.value.push(dm)

    setTimeout(() => {
      const idx = danmakus.value.findIndex(d => d.id === dm.id)
      if (idx >= 0) danmakus.value.splice(idx, 1)
    }, dm.duration * 1000 + 500)
  }
)
</script>

<style scoped>
.danmaku-layer {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  overflow: hidden;
}

.dm-track {
  position: relative;
  width: 100%;
  height: 100%;
}

.danmaku-item {
  position: absolute;
  left: 100%;
  white-space: nowrap;
  animation: dmScroll linear forwards;
}

.dm-text {
  display: inline-block;
  padding: 5px 16px;
  border-radius: var(--radius-full);
  background: rgba(124, 58, 237, 0.2);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(124, 58, 237, 0.25);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.02em;
}

@keyframes dmScroll {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100vw - 100%)); }
}

.dm-enter-active { transition: opacity 0.4s ease; }
.dm-leave-active { transition: opacity 0.6s ease; }
.dm-enter-from,
.dm-leave-to { opacity: 0; }
</style>
