"""
统一响应结果封装类
提供标准化的API返回格式
"""
from typing import Any, Optional


class Result:
    """统一响应结果类"""
    
    def __init__(self, code: int = 0, msg: str = "success", data: Any = None):
        self.code = code
        self.msg = msg
        self.data = data
    
    def to_dict(self) -> dict:
        """转换为字典格式"""
        result = {
            "code": self.code,
            "msg": self.msg
        }
        if self.data is not None:
            result["data"] = self.data
        return result
    
    @staticmethod
    def success(data: Any = None, msg: str = "success") -> dict:
        """成功响应"""
        return Result(code=0, msg=msg, data=data).to_dict()
    
    @staticmethod
    def error(msg: str = "error", code: int = 1, data: Any = None) -> dict:
        """失败响应"""
        return Result(code=code, msg=msg, data=data).to_dict()
