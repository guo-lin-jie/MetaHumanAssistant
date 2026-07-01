"""
用户认证和管理接口路由
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import hashlib
import time
from models.database import UserManager
from utils.result import Result

router = APIRouter(prefix="/auth", tags=["用户认证"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


def hash_password(password: str) -> str:
    """简单的密码哈希（生产环境应使用bcrypt）"""
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register")
async def register(req: RegisterRequest):
    """用户注册"""
    try:
        # 检查用户是否已存在
        existing_user = UserManager.get_user_by_username(req.username)
        if existing_user:
            return Result.error(msg="用户名已存在", code=1)
        
        # 创建新用户
        password_hash = hash_password(req.password)
        user_id = UserManager.create_user(req.username, password_hash)
        
        return Result.success(
            data={"user_id": user_id, "username": req.username},
            msg="注册成功"
        )
    except Exception as e:
        return Result.error(msg=f"注册失败: {str(e)}")


@router.post("/login")
async def login(req: LoginRequest):
    """用户登录"""
    try:
        user = UserManager.get_user_by_username(req.username)
        if not user:
            return Result.error(msg="用户名或密码错误", code=1)
        
        password_hash = hash_password(req.password)
        if user['password_hash'] != password_hash:
            return Result.error(msg="用户名或密码错误", code=1)
        
        # 更新最后登录时间
        UserManager.update_last_login(user['id'])
        
        # 生成简单的token（实际项目应使用JWT）
        token = f"{user['id']}_{int(time.time())}"
        
        return Result.success(
            data={
                "user_id": user['id'],
                "username": user['username'],
                "token": token,
                "settings": user.get('settings', {})
            },
            msg="登录成功"
        )
    except Exception as e:
        return Result.error(msg=f"登录失败: {str(e)}")


@router.get("/profile")
async def get_profile(x_user_id: Optional[str] = Header(None)):
    """获取用户信息"""
    if not x_user_id:
        return Result.error(msg="未授权", code=401)
    
    try:
        user_id = int(x_user_id)
        user = UserManager.get_user_by_username(str(user_id))  # 简化处理
        if not user:
            return Result.error(msg="用户不存在", code=404)
        
        return Result.success(
            data={
                "user_id": user['id'],
                "username": user['username'],
                "created_at": user['created_at'],
                "settings": user.get('settings', {})
            }
        )
    except Exception as e:
        return Result.error(msg=f"获取用户信息失败: {str(e)}")


@router.put("/settings")
async def update_settings(settings: dict, x_user_id: Optional[str] = Header(None)):
    """更新用户设置"""
    if not x_user_id:
        return Result.error(msg="未授权", code=401)
    
    try:
        user_id = int(x_user_id)
        UserManager.update_settings(user_id, settings)
        return Result.success(msg="设置更新成功")
    except Exception as e:
        return Result.error(msg=f"更新设置失败: {str(e)}")
