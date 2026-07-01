<template>
  <div class="chat-panel" ref="panelRef">
    <div class="chat-header">
      <div class="header-left">
        <span class="header-dot"></span>
        <h2>对话</h2>
      </div>
      <button class="clear-btn" @click="chatStore.clearHistory()" title="清空对话">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
      </button>
    </div>

    <div class="messages" v-if="chatStore.messages.length > 0">
      <ChatBubble
        v-for="msg in chatStore.messages"
        :key="msg.id"
        :role="msg.role"
        :content="msg.content"
        :timestamp="msg.timestamp"
      />
      <div v-if="chatStore.isThinking" class="thinking">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      </div>
      <p class="empty-title">开始对话</p>
      <p class="hint">按住麦克风说话，或输入文字发送</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatBubble from './ChatBubble.vue'

const chatStore = useChatStore()
const panelRef = ref<HTMLDivElement>()

watch(() => chatStore.messages.length, async () => {
  await nextTick()
  if (panelRef.value) {
    const el = panelRef.value.querySelector('.messages')
    if (el) el.scrollTop = el.scrollHeight
  }
})
</script>

<style scoped>
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-teal);
  box-shadow: 0 0 8px var(--accent-teal-glow);
}

.chat-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.clear-btn {
  background: none;
  color: var(--text-muted);
  padding: 6px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.clear-btn:hover {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.08);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-muted);
  gap: 10px;
}
.empty-icon { margin-bottom: 4px; }
.empty-title {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
}
.empty-state .hint {
  font-size: 12px;
  opacity: 0.5;
}

.thinking {
  display: flex;
  gap: 5px;
  padding: 10px 16px;
}
.thinking .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-teal);
  animation: bounce 1.4s ease infinite both;
}
.thinking .dot:nth-child(1) { animation-delay: -0.32s; }
.thinking .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
