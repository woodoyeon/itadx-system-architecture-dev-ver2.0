"""공통 유틸리티"""
import numpy as np

def safe_divide(a: float, b: float, default: float = 0) -> float:
    """0으로 나누기 방지"""
    return a / b if b != 0 else default

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    """값을 범위 내로 제한"""
    return max(min_val, min(max_val, value))
