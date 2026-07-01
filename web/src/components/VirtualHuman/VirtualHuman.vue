<template>
  <div class="virtual-human" ref="containerRef">
    <canvas ref="canvasRef"></canvas>

    <!-- Enhanced holographic overlay -->
    <div class="holo-overlay"></div>
    <div class="holo-grid"></div>

    <!-- Status indicator - redesigned -->
    <div class="status-indicator" :class="{ speaking: isSpeaking }">
      <div class="status-icon">
        <span class="icon-dot"></span>
        <span class="icon-ring"></span>
      </div>
      <span class="status-text">{{ isSpeaking ? '正在说话...' : '在线' }}</span>
    </div>

    <!-- Decorative corners with glow -->
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>
    
    <!-- Side accent lines -->
    <div class="accent-line left"></div>
    <div class="accent-line right"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useThreeScene } from './useThreeScene'
import { useAvatar } from './useAvatar'
import { useAudio } from '@/composables/useAudio'

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const { isPlaying, audioLevel } = useAudio()

const isSpeaking = ref(false)
let avatar: ReturnType<typeof useAvatar> | null = null
let mouseX = 0, mouseY = 0

// Rotation control state
let isDragging = false
let lastMouseX = 0
let targetRotationY = 0
let currentRotationY = 0

watch(isPlaying, (v) => { isSpeaking.value = v })

// Must be called at setup top-level so inner onMounted fires correctly
const { scene: sceneRef, isReady, animate } = useThreeScene(canvasRef as any)

const unwatch = watch(isReady, (ready) => {
  if (!ready) return
  const s = sceneRef.value  // Get the actual scene from ref
  if (!s) return
  
  avatar = useAvatar(s)
  avatar.build()

  animate([
    (_dt: number, elapsed: number) => {
      avatar?.breathe(elapsed)
      if (isPlaying.value) {
        avatar?.animateMouth(audioLevel.value)
      } else {
        avatar?.animateMouth(0)
      }
      avatar?.lookAtMouse(mouseX, mouseY)
      
      // Smooth rotation interpolation
      currentRotationY += (targetRotationY - currentRotationY) * 0.1
      if (avatar && avatar.group) {
        avatar.group.rotation.y = currentRotationY
      }
    },
  ])
  unwatch()
})

// Mouse tracking for eye gaze and rotation
watch(containerRef, (el) => {
  if (!el) return
  
  // Eye tracking on mouse move
  el.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = el.getBoundingClientRect()
    mouseX = (e.clientX / rect.width) * 2 - 1
    mouseY = -(e.clientY / rect.height) * 2 + 1
    
    // Rotation control when dragging
    if (isDragging) {
      const deltaX = e.clientX - lastMouseX
      targetRotationY += deltaX * 0.005
      lastMouseX = e.clientX
    }
  })
  
  // Start drag on mousedown
  el.addEventListener('mousedown', (e: MouseEvent) => {
    isDragging = true
    lastMouseX = e.clientX
    el.style.cursor = 'grabbing'
  })
  
  // Stop drag on mouseup or mouseleave
  const stopDrag = () => {
    isDragging = false
    el.style.cursor = 'default'
  }
  
  el.addEventListener('mouseup', stopDrag)
  el.addEventListener('mouseleave', stopDrag)
}, { immediate: true })
</script>

<style scoped>
.virtual-human {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Enhanced holographic scan line effect */
.holo-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(139, 92, 246, 0.02) 3px,
    rgba(139, 92, 246, 0.02) 6px
  );
  animation: scanDown 10s linear infinite;
}

@keyframes scanDown {
  from { background-position: 0 0; }
  to { background-position: 0 120px; }
}

/* Subtle grid pattern */
.holo-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background-image: 
    linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

/* Redesigned status indicator */
.status-indicator {
  position: absolute;
  top: 28px;
  left: 28px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  font-size: 13px;
  color: var(--text-secondary);
  transition: all var(--transition-normal);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
}

.status-indicator.speaking {
  border-color: rgba(20, 184, 166, 0.4);
  box-shadow: 0 0 30px rgba(20, 184, 166, 0.15), 0 4px 20px rgba(139, 92, 246, 0.1);
}

.status-icon {
  position: relative;
  width: 12px;
  height: 12px;
}

.icon-dot {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 12px var(--accent-teal-glow);
  transition: all var(--transition-normal);
}

.icon-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--success);
  opacity: 0;
  animation: ringPulse 2s ease-in-out infinite;
}

.status-indicator.speaking .icon-dot {
  background: var(--accent-amber);
  box-shadow: 0 0 15px var(--accent-amber-glow);
  animation: dotPulse 0.6s ease infinite;
}

.status-indicator.speaking .icon-ring {
  border-color: var(--accent-amber);
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.7; }
}

@keyframes ringPulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

/* Enhanced decorative corners */
.corner-tl, .corner-tr, .corner-bl, .corner-br {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  width: 40px;
  height: 40px;
  opacity: 0.25;
  transition: all var(--transition-normal);
}

.corner-tl {
  top: 24px; left: 24px;
  border-top: 2px solid var(--accent-light);
  border-left: 2px solid var(--accent-light);
  box-shadow: -2px -2px 8px rgba(139, 92, 246, 0.3);
}
.corner-tr {
  top: 24px; right: 24px;
  border-top: 2px solid var(--accent-light);
  border-right: 2px solid var(--accent-light);
  box-shadow: 2px -2px 8px rgba(139, 92, 246, 0.3);
}
.corner-bl {
  bottom: 24px; left: 24px;
  border-bottom: 2px solid var(--accent-light);
  border-left: 2px solid var(--accent-light);
  box-shadow: -2px 2px 8px rgba(139, 92, 246, 0.3);
}
.corner-br {
  bottom: 24px; right: 24px;
  border-bottom: 2px solid var(--accent-light);
  border-right: 2px solid var(--accent-light);
  box-shadow: 2px 2px 8px rgba(139, 92, 246, 0.3);
}

/* Side accent lines */
.accent-line {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 120px;
  background: linear-gradient(to bottom, transparent, var(--accent-light), transparent);
  opacity: 0.15;
  z-index: 2;
  pointer-events: none;
}

.accent-line.left {
  left: 20px;
}

.accent-line.right {
  right: 20px;
}

</style>