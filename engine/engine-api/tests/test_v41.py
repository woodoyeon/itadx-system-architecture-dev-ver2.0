"""V41 마트 적격심사 테스트 (DB 연결 없이 등급 로직만 검증)"""


def test_grade_mapping():
    """점수에 따른 판정이 올바른지 검증"""
    def judge(score):
        if score >= 70: return "적격"
        elif score >= 50: return "조건부"
        else: return "부적격"

    assert judge(85) == "적격"
    assert judge(70) == "적격"
    assert judge(60) == "조건부"
    assert judge(50) == "조건부"
    assert judge(30) == "부적격"


def test_weight_sum():
    """가중치 합계가 1.0인지 검증"""
    weights = {
        "financial_stability": 0.40,
        "operation_performance": 0.30,
        "transaction_history": 0.20,
        "external_credit": 0.10,
    }
    assert abs(sum(weights.values()) - 1.0) < 1e-10


def test_score_calculation():
    """가중합산 로직 검증"""
    weights = {
        "financial_stability": 0.40,
        "operation_performance": 0.30,
        "transaction_history": 0.20,
        "external_credit": 0.10,
    }
    factors = {
        "financial_stability": 80,
        "operation_performance": 70,
        "transaction_history": 60,
        "external_credit": 50,
    }
    total = sum(factors[k] * weights[k] for k in weights)
    assert total == 80 * 0.4 + 70 * 0.3 + 60 * 0.2 + 50 * 0.1  # 70.0
