"""Schema validation tests for Ronda."""
import json
import pytest
from schemas import ShiftRecommendation, Recommendation, Confidence

VALID_RESPONSE = {
    "recommendation": "work",
    "shift_windows": [
        {"start": "11:00", "end": "14:00", "zones": ["PJ", "Damansara"]},
        {"start": "18:00", "end": "22:00", "zones": ["Bangsar"]},
    ],
    "projected_net_rm": 105.0,
    "projected_gross_rm": 136.5,
    "projected_petrol_rm": 15.75,
    "confidence": "high",
    "reasoning_narrative": "Good day to ride. Clear weather, event in Bukit Jalil evening.",
    "key_factors": [
        {"factor": "Clear weather", "impact": "positive", "weight": "high"},
        {"factor": "KL Grand Prix", "impact": "positive", "weight": "medium"},
    ],
    "caveats": ["Rain possible after 5 PM."],
    "source": "glm",
}


def test_valid_recommendation_parses():
    rec = ShiftRecommendation.model_validate(VALID_RESPONSE)
    assert rec.recommendation == Recommendation.WORK
    assert rec.confidence == Confidence.HIGH
    assert len(rec.shift_windows) == 2
    assert rec.projected_net_rm == 105.0
    assert rec.source == "glm"


def test_partial_recommendation():
    data = VALID_RESPONSE.copy()
    data["recommendation"] = "partial"
    data["confidence"] = "medium"
    rec = ShiftRecommendation.model_validate(data)
    assert rec.recommendation == Recommendation.PARTIAL


def test_rest_recommendation():
    data = VALID_RESPONSE.copy()
    data["recommendation"] = "rest"
    data["confidence"] = "low"
    rec = ShiftRecommendation.model_validate(data)
    assert rec.recommendation == Recommendation.REST


def test_invalid_recommendation_rejected():
    data = VALID_RESPONSE.copy()
    data["recommendation"] = "invalid_value"
    with pytest.raises(Exception):
        ShiftRecommendation.model_validate(data)


def test_missing_required_field_rejected():
    data = VALID_RESPONSE.copy()
    del data["reasoning_narrative"]
    with pytest.raises(Exception):
        ShiftRecommendation.model_validate(data)


def test_json_roundtrip():
    rec = ShiftRecommendation.model_validate(VALID_RESPONSE)
    json_str = rec.model_dump_json()
    parsed = json.loads(json_str)
    rec2 = ShiftRecommendation.model_validate(parsed)
    assert rec2.recommendation == rec.recommendation
    assert rec2.projected_net_rm == rec.projected_net_rm