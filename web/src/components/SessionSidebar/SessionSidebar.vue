<template>
  <aside class="session-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <h3 v-if="!isCollapsed">💬 历史对话</h3>
      <button class="collapse-btn" @click="toggleCollapse" title="折叠/展开">
        {{ isCollapsed ? '☰' : '◀' }}
      </button>
    </div>

    <!-- 新建对话按钮 -->
    <button class="new-chat-btn" @click="createNewSession" v-if="!isCollapsed">
      <span class="icon">+</span>
      <span>新建对话</span>
    </button>

    <!-- 会话列表 -->
    <div class="session-list" v-if="!isCollapsed">
      <div v-if="isLoading" class="loading">加载中...</div>
      
      <div
        v-for="session in sessions"
        :key="session.id"
        class="session-item"
        :class="{ active: session.id === currentSessionId }"
        @click="handleSwitchSession(session.id)"
      >
        <div class="session-info">
          <div class="session-title">{{ session.title || '新对话' }}</div>
          <div class="session-meta">
            <span class="time">{{ formatTime(session.updated_at) }}</span>
            <span class="count">{{ session.message_count }}条</span>
          </div>
        </div>
        
        <button
          class="delete-btn"
          @click.stop="handleDeleteSession(session.id)"
          title="删除会话"
        >
          ×
        </button>
      </div>

      <div v-if="sessions.length === 0 && !isLoading" class="empty-state">
        <p>暂无历史对话</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'

const chatStore = useChatStore()
const { sessions, currentSessionId, isLoadingSessions } = storeToRefs(chatStore)
const { loadSessions, switchSession, deleteSession, initSession } = chatStore

const isCollapsed = ref(false)
const isLoading = computed(() => isLoadingSessions.value)

// 切换折叠状态
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 创建新会话
async function createNewSession() {
  await initSession()
  await loadSessions()
}

// 切换会话
async function handleSwitchSession(sessionId: string) {
  if (sessionId === currentSessionId.value) return
  await switchSession(sessionId)
}

// 删除会话
async function handleDeleteSession(sessionId: string) {
  if (!confirm('确定要删除这个会话吗？')) return
  await deleteSession(sessionId)
}

// 格式化时间
function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 昨天
  if (diff < 2 * 24 * 60 * 60 * 1000) {
    return '昨天'
  }
  
  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days[date.getDay()]
  }
  
  // 更早
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

// 组件挂载时加载会话列表
onMounted(async () => {
  await loadSessions()
  
  // 恢复上次会话
  const savedSessionId = localStorage.getItem('current_session_id')
  if (savedSessionId) {
    const session = sessions.value.find(s => s.id === savedSessionId)
    if (session) {
      await switchSession(savedSessionId)
    } else {
      await initSession()
    }
  } else {
    await initSession()
  }
})
</script>

<style scoped>
.session-sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-right: 1px solid rgba(0, 245, 255, 0.2);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.session-sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 245, 255, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  color: #00f5ff;
  font-size: 16px;
  font-weight: 600;
}

.collapse-btn {
  background: transparent;
  border: 1px solid rgba(0, 245, 255, 0.3);
  color: #00f5ff;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(0, 245, 255, 0.1);
  border-color: #00f5ff;
}

.new-chat-btn {
  margin: 15px 20px;
  padding: 12px;
  background: linear-gradient(135deg, #00f5ff 0%, #00d4ff 100%);
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.new-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 245, 255, 0.4);
}

.new-chat-btn .icon {
  font-size: 20px;
  font-weight: bold;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.loading {
  text-align: center;
  color: #888;
  padding: 20px;
}

.session-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 245, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  position: relative;
}

.session-item:hover {
  background: rgba(0, 245, 255, 0.1);
  border-color: rgba(0, 245, 255, 0.3);
}

.session-item.active {
  background: rgba(0, 245, 255, 0.15);
  border-color: #00f5ff;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
}

.session-info {
  flex: 1;
  overflow: hidden;
}

.session-title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.session-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #888;
}

.session-meta .time {
  color: #00f5ff;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #ff4757;
  font-size: 20px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 71, 87, 0.2);
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  color: #666;
  padding: 40px 20px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 滚动条样式 */
.session-list::-webkit-scrollbar {
  width: 6px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar-thumb {
  background: rgba(0, 245, 255, 0.3);
  border-radius: 3px;
}

.session-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 245, 255, 0.5);
}
</style>
