<template>
  <div class="settings-panel" :class="{ open: isOpen }">
    <button class="toggle-btn" @click="isOpen = !isOpen">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="gear-icon" :class="{ spinning: isOpen }">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
      <span>声音设置</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron" :class="{ flipped: isOpen }">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <transition name="expand">
      <div class="settings-body" v-show="isOpen">
        <!-- Quick toggles row -->
        <div class="toggles-row">
          <!-- Mute -->
          <button class="toggle-chip" :class="{ off: settingsStore.muted }" @click="settingsStore.toggleMuted()">
            <span class="chip-icon">{{ settingsStore.muted ? '🔇' : '🔊' }}</span>
            <span class="chip-label">{{ settingsStore.muted ? '已静音' : '声音' }}</span>
          </button>
          <!-- Danmaku -->
          <button class="toggle-chip" :class="{ off: !settingsStore.danmaku }" @click="settingsStore.toggleDanmaku()">
            <span class="chip-icon">{{ settingsStore.danmaku ? '💬' : '🚫' }}</span>
            <span class="chip-label">{{ settingsStore.danmaku ? '弹幕开' : '弹幕关' }}</span>
          </button>
        </div>

        <!-- Timbre -->
        <div class="setting-group">
          <label class="setting-label">音色</label>
          <div class="speaker-grid">
            <button
              v-for="s in TTS_SPEAKERS"
              :key="s.id"
              class="speaker-card"
              :class="{ active: settingsStore.speaker === s.id }"
              @click="settingsStore.updateSpeaker(s.id)"
            >
              <span class="speaker-icon">{{ s.icon }}</span>
              <span class="speaker-name">{{ s.label }}</span>
            </button>
          </div>
        </div>

        <!-- Volume -->
        <div class="setting-group">
          <label class="setting-label">
            音量
            <span class="val">{{ settingsStore.volume }}</span>
          </label>
          <div class="slider-track">
            <div class="slider-fill" :style="{ width: (settingsStore.volume / 9) * 100 + '%' }"></div>
            <input
              type="range"
              min="0" max="9" step="1"
              :value="settingsStore.volume"
              @input="settingsStore.updateVolume(Number(($event.target as HTMLInputElement).value))"
              class="slider"
            />
          </div>
        </div>

        <!-- Speed -->
        <div class="setting-group">
          <label class="setting-label">
            语速
            <span class="val">{{ settingsStore.speed }}</span>
          </label>
          <div class="slider-track">
            <div class="slider-fill" :style="{ width: (settingsStore.speed / 9) * 100 + '%' }"></div>
            <input
              type="range"
              min="0" max="9" step="1"
              :value="settingsStore.speed"
              @input="settingsStore.updateSpeed(Number(($event.target as HTMLInputElement).value))"
              class="slider"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { TTS_SPEAKERS } from '@/types'

const settingsStore = useSettingsStore()
const isOpen = ref(false)
</script>

<style scoped>
.settings-panel {
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  transition: all var(--transition-fast);
}
.toggle-btn:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.gear-icon { transition: transform var(--transition-slow); }
.gear-icon.spinning { transform: rotate(90deg); }

.chevron {
  margin-left: auto;
  transition: transform var(--transition-normal);
  opacity: 0.5;
}
.chevron.flipped { transform: rotate(180deg); }

.settings-body {
  padding: 0 20px 16px;
  overflow: hidden;
}

/* Expand transition */
.expand-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.expand-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 500;
}

.val {
  color: var(--accent-teal);
  font-weight: 700;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.speaker-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.speaker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: all var(--transition-spring);
  cursor: pointer;
}
.speaker-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.speaker-card.active {
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.12);
  color: var(--accent-light);
  box-shadow: 0 0 16px var(--accent-glow);
  transform: translateY(-1px);
}

/* Toggle chips row */
.toggles-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.toggle-chip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 13px;
  transition: all var(--transition-fast);
}
.toggle-chip:hover {
  border-color: var(--accent);
}
.toggle-chip.off {
  opacity: 0.5;
  border-color: var(--border);
}
.chip-icon { font-size: 15px; }
.chip-label { font-weight: 500; }

.speaker-icon { font-size: 24px; transition: transform var(--transition-spring); }
.speaker-card.active .speaker-icon { transform: scale(1.1); }
.speaker-name { font-size: 12px; font-weight: 500; }

/* Custom slider with fill track */
.slider-track {
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-teal));
  pointer-events: none;
  transition: width var(--transition-fast);
}

.slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  position: relative;
  z-index: 1;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 0 12px var(--accent-glow), 0 2px 4px rgba(0,0,0,0.4);
  transition: all var(--transition-fast);
}
.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 20px var(--accent-glow), 0 2px 8px rgba(0,0,0,0.5);
}
</style>
