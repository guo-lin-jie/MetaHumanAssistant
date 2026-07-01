<template>
  <div class="app-layout">
    <!-- Session Sidebar -->
    <SessionSidebar />
    
    <!-- Left: 3D Virtual Human -->
    <div class="avatar-zone">
      <div class="avatar-gradient"></div>
      <div class="avatar-gradient-teal"></div>
      <VirtualHuman />
      <DanmakuLayer v-if="settings.danmaku" />
    </div>

    <!-- Right: Chat Panel -->
    <div class="chat-zone">
      <ChatPanel />
      <ControlBar />
      <SettingsPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import SessionSidebar from '@/components/SessionSidebar/SessionSidebar.vue'
import VirtualHuman from '@/components/VirtualHuman/VirtualHuman.vue'
import ChatPanel from '@/components/ChatPanel/ChatPanel.vue'
import ControlBar from '@/components/ControlBar/ControlBar.vue'
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel.vue'
import DanmakuLayer from '@/components/DanmakuLayer/DanmakuLayer.vue'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<style>
/* Global - not scoped */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-primary);
}
</style>

<style scoped>
.avatar-zone {
  flex: 1;
  min-width: 0;
  position: relative;
}

/* Dual gradient layers for cosmic depth */
.avatar-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 50% at 50% 45%, rgba(124, 58, 237, 0.1) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.avatar-gradient-teal {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 40% 35% at 30% 55%, rgba(20, 184, 166, 0.06) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

.avatar-zone :deep(canvas) {
  position: relative;
  z-index: 1;
}

.chat-zone {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: var(--bg-secondary);
  height: 100vh;
  box-shadow: -4px 0 40px rgba(0, 0, 0, 0.3);
}
</style>
