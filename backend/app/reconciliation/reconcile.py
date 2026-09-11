"""
Module 4: Confidence Scoring, Reconciler, and Audit Trail.

Converts multi-modal signals (dense vector similarity + structured technical attributes)
into a legally defensible and explainable procurement decision.
"""

from typing import Dict, Any, List, Tuple
from backend.app.schemas.canonical import MatchResult, CanonicalMaterial

MODULE_VERSION = "2.3.1-prod"

CONFIDENCE_HIGH_THRESHOLD = 0.80
CONFIDENCE_MEDIUM_THRESHOLD = 0.52


def reconcile_match(
    code_a: str,
    code_b: str,
    record_a: CanonicalMaterial,
    record_b: CanonicalMaterial,
    embedding_similarity: float,
    attribute_comparison: Dict[str, Any]
) -> MatchResult:
    """
    Produce final reconciled MatchResult with audit explanation and safety flags.
    Uses category-adaptive weighting to handle variation between pipes, valves, flanges, etc.
    """
    safety_flags: List[str] = attribute_comparison.get("safety_violations", [])
    explanation_parts: List[str] = []

    # -------------------------------------------------------------
    # 1. HARD SAFETY GATE EVALUATION
    # -------------------------------------------------------------
    if safety_flags:
        verdict = "not_duplicate"
        confidence_score = round(min(0.20, embedding_similarity * 0.20), 4)
        
        gate_reasons = []
        if "TYPE_MISMATCH" in safety_flags:
            gate_reasons.append(f"Incompatible material types: '{record_a.material_type}' vs '{record_b.material_type}'")
        if "SUBTYPE_MISMATCH" in safety_flags:
            gate_reasons.append(f"Incompatible sub-types: '{record_a.sub_type}' vs '{record_b.sub_type}'")
        if "GRADE_MISMATCH" in safety_flags:
            gate_reasons.append(f"Grade/metallurgy mismatch: '{record_a.grade}' vs '{record_b.grade}'")
        if "DIMENSION_MISMATCH" in safety_flags:
            gate_reasons.append(f"Dimension variance exceeds safety threshold: {record_a.dimension_value}mm vs {record_b.dimension_value}mm")
        if "SCHEDULE_MISMATCH" in safety_flags:
            gate_reasons.append(f"Wall thickness / schedule conflict: '{record_a.schedule}' vs '{record_b.schedule}'")
        if "PRESSURE_MISMATCH" in safety_flags:
            gate_reasons.append(f"Pressure rating conflict: '{record_a.pressure_rating}' vs '{record_b.pressure_rating}'")
        if "STANDARD_MISMATCH" in safety_flags:
            gate_reasons.append(f"Different governing standards: '{record_a.standard}' vs '{record_b.standard}'")

        explanation = (
            f"Not duplicate. Safety Gate Triggered: {'; '.join(gate_reasons)}. "
            f"Semantic text similarity was {round(embedding_similarity * 100, 1)}%, "
            f"but technical specifications strictly prohibit merging."
        )

        match_id = f"MATCH-{code_a}-{code_b}"
        return MatchResult(
            match_id=match_id,
            code_a=code_a,
            code_b=code_b,
            embedding_similarity=round(embedding_similarity, 4),
            attribute_match=attribute_comparison,
            confidence_score=confidence_score,
            verdict=verdict,
            explanation=explanation,
            safety_flags=safety_flags,
        )

    # -------------------------------------------------------------
    # 2. CATEGORY-ADAPTIVE CONFIDENCE SCORING
    # -------------------------------------------------------------
    total_weights = 0.0
    matched_score = 0.0

    # (a) Embedding Similarity (weight: 0.35)
    w_emb = 0.35
    total_weights += w_emb
    matched_score += embedding_similarity * w_emb

    # (b) Material Type (weight: 0.25)
    w_type = 0.25
    total_weights += w_type
    type_status = attribute_comparison.get("material_type_status")
    if type_status == "MATCH":
        matched_score += w_type
        explanation_parts.append(f"Material type matches ({record_a.material_type})")
    elif type_status in ["MISSING_A", "MISSING_B"]:
        matched_score += w_type * 0.3
        explanation_parts.append("Material type missing in one record")

    # (c) Dimension (weight: 0.25)
    w_dim = 0.25
    total_weights += w_dim
    dim_status = attribute_comparison.get("dimension_status")
    if dim_status in ["MATCH", "TOLERANCE_MATCH"]:
        matched_score += w_dim
        explanation_parts.append(f"Dimension matches ({record_a.dimension_value} mm)")
    elif dim_status in ["MISSING_A", "MISSING_B"]:
        matched_score -= 0.10
        explanation_parts.append("Dimension missing in one record")

    # (d) Grade & Metallurgy (weight: 0.15)
    w_grade = 0.15
    total_weights += w_grade
    grade_status = attribute_comparison.get("grade_status")
    if grade_status == "MATCH":
        matched_score += w_grade
        explanation_parts.append(f"Grade matches ({record_a.grade})")
    elif grade_status in ["MISSING_A", "MISSING_B", "BOTH_MISSING"]:
        matched_score -= 0.08
        explanation_parts.append("Grade not explicitly specified in one or both records")

    # (e) Sub-Type (applicable for valves, flanges, gaskets, fasteners, fittings)
    is_sub_applicable = (
        (record_a.material_type in ["VALVE", "FLANGE", "GASKET", "FASTENER", "FITTING"]) or
        (record_b.material_type in ["VALVE", "FLANGE", "GASKET", "FASTENER", "FITTING"]) or
        bool(record_a.sub_type or record_b.sub_type)
    )
    if is_sub_applicable:
        w_sub = 0.15
        total_weights += w_sub
        sub_status = attribute_comparison.get("sub_type_status")
        if sub_status == "MATCH":
            matched_score += w_sub
            explanation_parts.append(f"Sub-type matches ({record_a.sub_type})")
        elif sub_status in ["MISSING_A", "MISSING_B"]:
            matched_score -= 0.05
            explanation_parts.append("Sub-type missing in one record")

    # (f) Schedule (applicable for pipes and pipe fittings)
    is_sch_applicable = (
        (record_a.material_type in ["PIPE", "FITTING"]) or
        (record_b.material_type in ["PIPE", "FITTING"]) or
        bool(record_a.schedule or record_b.schedule)
    )
    if is_sch_applicable and (record_a.schedule or record_b.schedule):
        w_sch = 0.08
        total_weights += w_sch
        sch_status = attribute_comparison.get("schedule_status")
        if sch_status == "MATCH":
            matched_score += w_sch
            explanation_parts.append(f"Schedule matches ({record_a.schedule})")

    # (g) Pressure Rating (applicable for valves, flanges, gaskets, fittings)
    is_press_applicable = (
        (record_a.material_type in ["VALVE", "FLANGE", "GASKET", "FITTING"]) or
        (record_b.material_type in ["VALVE", "FLANGE", "GASKET", "FITTING"]) or
        bool(record_a.pressure_rating or record_b.pressure_rating)
    )
    if is_press_applicable and (record_a.pressure_rating or record_b.pressure_rating):
        w_press = 0.08
        total_weights += w_press
        press_status = attribute_comparison.get("pressure_status")
        if press_status == "MATCH":
            matched_score += w_press
            explanation_parts.append(f"Pressure class matches ({record_a.pressure_rating})")

    # (h) Standard (applicable if either specifies standard)
    if record_a.standard or record_b.standard:
        w_std = 0.08
        total_weights += w_std
        std_status = attribute_comparison.get("standard_status")
        if std_status == "MATCH":
            matched_score += w_std
            explanation_parts.append(f"Standard matches ({record_a.standard})")

    final_confidence = matched_score / total_weights if total_weights > 0 else 0.0
    final_confidence = max(0.0, min(0.99, round(final_confidence, 4)))

    # -------------------------------------------------------------
    # 3. VERDICT ASSIGNMENT BASED ON THRESHOLDS
    # -------------------------------------------------------------
    has_missing_grade = grade_status in ["MISSING_A", "MISSING_B"]
    has_missing_dim = dim_status in ["MISSING_A", "MISSING_B"]

    if final_confidence >= CONFIDENCE_HIGH_THRESHOLD and not has_missing_dim and not has_missing_grade:
        verdict = "likely_duplicate"
        explanation = (
            f"Likely duplicate ({round(final_confidence * 100, 1)}% confidence). "
            f"{'; '.join(explanation_parts)}."
        )
    elif final_confidence >= CONFIDENCE_MEDIUM_THRESHOLD or (final_confidence >= CONFIDENCE_HIGH_THRESHOLD and (has_missing_grade or has_missing_dim)):
        verdict = "possible_duplicate"
        explanation = (
            f"Possible duplicate ({round(final_confidence * 100, 1)}% confidence). "
            f"{'; '.join(explanation_parts)}. Procurement officer verification recommended."
        )
    else:
        verdict = "not_duplicate"
        explanation = (
            f"Not duplicate ({round(final_confidence * 100, 1)}% confidence). "
            f"Insufficient technical attribute correspondence to justify consolidation."
        )

    match_id = f"MATCH-{code_a}-{code_b}"
    return MatchResult(
        match_id=match_id,
        code_a=code_a,
        code_b=code_b,
        embedding_similarity=round(embedding_similarity, 4),
        attribute_match=attribute_comparison,
        confidence_score=final_confidence,
        verdict=verdict,
        explanation=explanation,
        safety_flags=safety_flags,
    )
