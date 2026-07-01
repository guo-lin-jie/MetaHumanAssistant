"""
数据库模型定义
使用SQLite存储用户、会话和消息历史
"""
import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
import os

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chat_history.db")


def init_db():
    """初始化数据库，创建必要的表"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            settings TEXT DEFAULT '{}'
        )
    ''')
    
    # 会话表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT DEFAULT '新对话',
            summary TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            message_count INTEGER DEFAULT 0,
            token_estimate INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # 消息表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'ai', 'system')),
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            token_count INTEGER DEFAULT 0,
            metadata TEXT DEFAULT '{}',
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        )
    ''')
    
    # 会话摘要表（用于压缩链）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS session_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            summary TEXT NOT NULL,
            start_message_id INTEGER,
            end_message_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (start_message_id) REFERENCES messages(id),
            FOREIGN KEY (end_message_id) REFERENCES messages(id)
        )
    ''')
    
    # 创建索引
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON session_summaries(session_id)')
    
    conn.commit()
    conn.close()


@contextmanager
def get_db_connection():
    """获取数据库连接的上下文管理器"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


class UserManager:
    """用户管理"""
    
    @staticmethod
    def create_user(username: str, password_hash: str) -> int:
        """创建新用户"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                (username, password_hash)
            )
            return cursor.lastrowid
    
    @staticmethod
    def get_user_by_username(username: str) -> Optional[Dict]:
        """根据用户名获取用户信息"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    @staticmethod
    def update_last_login(user_id: int):
        """更新最后登录时间"""
        with get_db_connection() as conn:
            conn.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                (user_id,)
            )
    
    @staticmethod
    def update_settings(user_id: int, settings: Dict):
        """更新用户设置"""
        with get_db_connection() as conn:
            conn.execute(
                'UPDATE users SET settings = ? WHERE id = ?',
                (json.dumps(settings), user_id)
            )
    
    @staticmethod
    def get_settings(user_id: int) -> Dict:
        """获取用户设置"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT settings FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            if row and row['settings']:
                return json.loads(row['settings'])
            return {}


class SessionManager:
    """会话管理"""
    
    @staticmethod
    def create_session(user_id: int, session_id: str, title: str = "新对话") -> bool:
        """创建新会话"""
        with get_db_connection() as conn:
            conn.execute(
                'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
                (session_id, user_id, title)
            )
            return True
    
    @staticmethod
    def get_session(session_id: str) -> Optional[Dict]:
        """获取会话信息"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM sessions WHERE id = ?', (session_id,))
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    @staticmethod
    def get_user_sessions(user_id: int, limit: int = 50) -> List[Dict]:
        """获取用户的会话列表"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT * FROM sessions 
                   WHERE user_id = ? 
                   ORDER BY updated_at DESC 
                   LIMIT ?''',
                (user_id, limit)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def update_session_title(session_id: str, title: str):
        """更新会话标题"""
        with get_db_connection() as conn:
            conn.execute(
                'UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (title, session_id)
            )
    
    @staticmethod
    def update_session_summary(session_id: str, summary: str, token_estimate: int):
        """更新会话摘要和token估算"""
        with get_db_connection() as conn:
            conn.execute(
                '''UPDATE sessions 
                   SET summary = ?, token_estimate = ?, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?''',
                (summary, token_estimate, session_id)
            )
    
    @staticmethod
    def increment_message_count(session_id: str):
        """增加会话消息计数"""
        with get_db_connection() as conn:
            conn.execute(
                '''UPDATE sessions 
                   SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?''',
                (session_id,)
            )
    
    @staticmethod
    def delete_session(session_id: str):
        """删除会话及其所有消息"""
        with get_db_connection() as conn:
            conn.execute('DELETE FROM sessions WHERE id = ?', (session_id,))


class MessageManager:
    """消息管理"""
    
    @staticmethod
    def add_message(session_id: str, role: str, content: str, token_count: int = 0, metadata: Dict = None) -> int:
        """添加消息"""
        print("加入消息")
        with get_db_connection() as conn:
            cursor = conn.cursor()
            print("连接成功")
            cursor.execute(
                '''INSERT INTO messages (session_id, role, content, token_count, metadata) 
                   VALUES (?, ?, ?, ?, ?)''',
                (session_id, role, content, token_count, json.dumps(metadata or {}))
            )
            print("执行成功")
            # 更新会话的消息计数
            # SessionManager.increment_message_count(session_id)
            conn.execute(
                '''UPDATE sessions 
                   SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?''',
                (session_id,)
            )
            print("操作结束")
            return cursor.lastrowid
    
    @staticmethod
    def get_session_messages(session_id: str, limit: int = None) -> List[Dict]:
        """获取会话的所有消息"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            if limit:
                cursor.execute(
                    '''SELECT * FROM messages 
                       WHERE session_id = ? 
                       ORDER BY timestamp ASC 
                       LIMIT ?''',
                    (session_id, limit)
                )
            else:
                cursor.execute(
                    '''SELECT * FROM messages 
                       WHERE session_id = ? 
                       ORDER BY timestamp ASC''',
                    (session_id,)
                )
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_recent_messages(session_id: str, count: int = 20) -> List[Dict]:
        """获取最近的消息（用于上下文）"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT * FROM messages 
                   WHERE session_id = ? 
                   ORDER BY timestamp DESC 
                   LIMIT ?''',
                (session_id, count)
            )
            messages = [dict(row) for row in cursor.fetchall()]
            return list(reversed(messages))  # 按时间正序返回
    
    @staticmethod
    def delete_session_messages(session_id: str):
        """删除会话的所有消息"""
        with get_db_connection() as conn:
            conn.execute('DELETE FROM messages WHERE session_id = ?', (session_id,))


class SummaryManager:
    """会话摘要管理（压缩链）"""
    
    @staticmethod
    def add_summary(session_id: str, summary: str, start_msg_id: int, end_msg_id: int):
        """添加会话摘要"""
        with get_db_connection() as conn:
            conn.execute(
                '''INSERT INTO session_summaries (session_id, summary, start_message_id, end_message_id) 
                   VALUES (?, ?, ?, ?)''',
                (session_id, summary, start_msg_id, end_msg_id)
            )
    
    @staticmethod
    def get_session_summaries(session_id: str) -> List[Dict]:
        """获取会话的所有摘要"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT * FROM session_summaries 
                   WHERE session_id = ? 
                   ORDER BY created_at ASC''',
                (session_id,)
            )
            return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_latest_summary(session_id: str) -> Optional[Dict]:
        """获取最新的摘要"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''SELECT * FROM session_summaries 
                   WHERE session_id = ? 
                   ORDER BY created_at DESC 
                   LIMIT 1''',
                (session_id,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    
    @staticmethod
    def compress_old_messages(session_id: str, summary: str, keep_recent_count: int = 10):
        """
        压缩旧消息：保留最近的N条消息，其余的用摘要替代
        :param session_id: 会话ID
        :param summary: 生成的摘要
        :param keep_recent_count: 保留的最近消息数量
        """
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 获取所有消息
            cursor.execute(
                'SELECT id FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
                (session_id,)
            )
            all_messages = [row['id'] for row in cursor.fetchall()]
            
            if len(all_messages) <= keep_recent_count:
                return
            
            # 确定要压缩的消息范围
            messages_to_compress = all_messages[:-keep_recent_count]
            start_msg_id = messages_to_compress[0]
            end_msg_id = messages_to_compress[-1]
            
            # 保存摘要
            SummaryManager.add_summary(session_id, summary, start_msg_id, end_msg_id)
            
            # 删除已压缩的消息
            cursor.execute(
                'DELETE FROM messages WHERE id IN ({})'.format(','.join(['?'] * len(messages_to_compress))),
                messages_to_compress
            )


# 初始化数据库
init_db()
