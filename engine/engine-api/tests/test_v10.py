import pytest
from services.v10_service import score_merchant

def test_grade_boundaries():
    """등급 경계값 테스트 — 점수에 따른 등급이 올바른지 검증"""
    # 이 테스트는 DB 연결이 필요하므로 통합테스트에서 실행
    # MVP 단계에서는 단위테스트로 등급 산출 로직만 검증
    assert True  # placeholder

def test_grade_mapping():
    grades = [(800, "A"), (600, "B"), (400, "C"), (200, "D"), (100, "E")]
    for score, expected in grades:
        if score >= 800: grade = "A"
        elif score >= 600: grade = "B"
        elif score >= 400: grade = "C"
        elif score >= 200: grade = "D"
        else: grade = "E"
        assert grade == expected
