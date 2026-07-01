<template>
  <div class="message" :class="role">
    <div class="bubble" :class="role">
      <span class="text">{{ content }}</span>
      <span class="time">{{ formatTime(timestamp) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ role: 'user' | 'ai'; content: string; timestamp: number }>()

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.message {
  display: flex;
  margin-bottom: 14px;
  animation: msgIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.message.user { justify-content: flex-end; }
.message.ai { justify-content: flex-start; }

@keyframes msgIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bubble {
  max-width: 80%;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.65;
  position: relative;
  transition: box-shadow var(--transition-normal);
}

.bubble.user {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  border-bottom-right-radius: var(--radius-sm);
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.25);
}

.bubble.ai {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  border-bottom-left-radius: var(--radius-sm);
}

.text { display: block; word-break: break-word; }

.time {
  display: block;
  font-size: 10px;
  margin-top: 6px;
  opacity: 0.45;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
