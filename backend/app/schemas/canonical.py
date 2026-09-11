from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CanonicalMaterial(BaseModel):
    """
    Canonical representation of a procurement material item across CPSEs.
    Standardized attributes extracted from raw description text.
    """
    material_code: str = Field(..., description="Unique material code (e.g., IOCL-PIP-004821)")
    source_cpse: str = Field(..., description="CPSE Source: IOCL, ONGC, BPCL, GAIL")
    raw_description: str = Field(..., description="Original raw purchase/inventory description")
    
    # Core canonical fields
    material_type: Optional[str] = Field(None, description="Standardized material category (e.g. PIPE, VALVE, FLANGE, GASKET, FASTENER, FITTING)")
    sub_type: Optional[str] = Field(None, description="Specific sub-item type (e.g. GATE, BALL, WNRF, BLRF, SORF, SWG, CNAF, STUD BOLT, ELBOW)")
    dimension_value: Optional[float] = Field(None, description="Normalized primary dimension in millimetres (mm)")
    dimension_unit: str = Field("mm", description="Standardized unit of dimension (default: mm)")
    schedule: Optional[str] = Field(None, description="Pipe schedule or wall thickness (e.g. SCH 40, SCH 80, SCH 10S, SCH 40S)")
    standard: Optional[str] = Field(None, description="Governing standard specification (e.g. ASTM A106, ASME B16.5, IS 1239)")
    grade: Optional[str] = Field(None, description="Material grade or metallurgy (e.g. GR B, 304, 316, B7, WPB)")
    pressure_rating: Optional[str] = Field(None, description="Standardized pressure rating/class (e.g. CLASS 150, CLASS 300, PN16, 3000#)")
    
    # Extraction metadata & traceability
    extraction_confidence: Dict[str, str] = Field(
        default_factory=dict, 
        description="Confidence level per attribute: high, medium, low"
    )
    raw_dimension_text: Optional[str] = Field(None, description="Original dimension text prior to normalization")


class AttributeMatchDetails(BaseModel):
    """
    Detailed attribute-by-attribute comparison results between two records.
    """
    material_type_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    sub_type_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    dimension_status: str = Field(..., description="MATCH, MISMATCH, TOLERANCE_MATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    schedule_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    standard_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    grade_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    pressure_status: str = Field(..., description="MATCH, MISMATCH, MISSING_A, MISSING_B, BOTH_MISSING")
    safety_violations: List[str] = Field(default_factory=list, description="Any hard safety gate trip reasons")


class MatchResult(BaseModel):
    """
    Standardized match result between two material records.
    """
    match_id: str = Field(..., description="Unique identifier for the pair comparison")
    code_a: str = Field(..., description="Material code of candidate A")
    code_b: str = Field(..., description="Material code of candidate B")
    embedding_similarity: float = Field(..., description="Cosine similarity of dense text embeddings (0.0 - 1.0)")
    attribute_match: Dict[str, Any] = Field(..., description="Detailed breakdown of attribute alignments")
    confidence_score: float = Field(..., description="Reconciled confidence score (0.0 - 1.0)")
    verdict: str = Field(..., description="likely_duplicate | possible_duplicate | not_duplicate")
    explanation: str = Field(..., description="Human-readable procurement justification for the verdict")
    safety_flags: List[str] = Field(default_factory=list, description="Safety gates triggered")


class MaterialCheckRequest(BaseModel):
    """
    Payload for live single material check.
    """
    raw_description: str = Field(..., min_length=3, max_length=1000, description="Material description entered by procurement officer")
    source_cpse: Optional[str] = Field("GENERIC", description="CPSE submitting the request")


class CandidateMatchResponse(BaseModel):
    """
    Response schema for candidates returned in live check.
    """
    material_code: str
    source_cpse: str
    raw_description: str
    canonical_attributes: Dict[str, Any]
    embedding_similarity: float
    confidence_score: float
    verdict: str
    explanation: str
    matched_attributes: Dict[str, str]
    safety_flags: List[str]


class LiveCheckResult(BaseModel):
    query: str
    extracted_attributes: CanonicalMaterial
    candidates: List[CandidateMatchResponse]
    top_verdict: str
    recommendation: str
