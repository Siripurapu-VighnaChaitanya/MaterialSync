"""
FastAPI Endpoints for SIH26099 Material Harmonization Platform.
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.models.db import get_db, AuditLog, Material
from backend.app.schemas.canonical import (
    MaterialCheckRequest,
    LiveCheckResult,
    CandidateMatchResponse,
    CanonicalMaterial,
)
from backend.app.services.material_service import material_service
from backend.app.taxonomy.unspsc import map_to_unspsc, UNSPSCResult
from backend.app.nlp.extract import extract_attributes

router = APIRouter()


class ReviewDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, CREATE_NEW
    reviewer_notes: Optional[str] = None


class UNSPSCMapRequest(BaseModel):
    raw_description: str


@router.get("/health", tags=["System"])
def health_check():
    """Health check endpoint confirming API status and model indexing state."""
    return {
        "status": "healthy",
        "service": "SIH26099-CPSE-Material-Harmonizer",
        "is_indexed": material_service.is_indexed,
        "indexed_materials": len(material_service.canonical_cache),
        "version": "2.3.1-prod",
    }


@router.post("/materials/check", response_model=LiveCheckResult, tags=["Live Material Checker"])
def check_material(payload: MaterialCheckRequest):
    """
    PRIMARY SIH DEMO ENDPOINT:
    Live verification of newly entered procurement descriptions before code creation.
    Returns extracted attributes, top candidates, match confidence, explanation, and action recommendation.
    """
    if not payload.raw_description or len(payload.raw_description.strip()) < 3:
        raise HTTPException(status_code=400, detail="Material description must be at least 3 characters.")

    result = material_service.check_live_material(
        raw_description=payload.raw_description,
        source_cpse=payload.source_cpse or "GENERIC"
    )
    return result


@router.get("/materials/clusters", tags=["Cluster Explorer"])
def get_clusters(db: Session = Depends(get_db)):
    """
    Returns full duplicate cluster graph across CPSEs with nodes and cross-enterprise links
    for the 2D/3D Cluster Explorer.
    """
    return material_service.get_clusters_data(db)


@router.get("/materials/stats", tags=["Analytics"])
def get_statistics(db: Session = Depends(get_db)):
    """Returns platform KPIs, catalogue redundancy rate, and annual savings estimates."""
    return material_service.get_kpi_stats(db)


@router.get("/materials/review-queue", tags=["Procurement Officer Review"])
def get_review_queue(limit: int = 50):
    """
    Returns pending ambiguous matches (possible_duplicate) requiring human officer verification.
    """
    # Query final_verdicts.csv for possible_duplicate records
    import os
    import pandas as pd
    verdicts_path = "data/processed/final_verdicts.csv"
    if not os.path.exists(verdicts_path):
        return {"total_pending": 0, "items": []}

    df = pd.read_csv(verdicts_path)
    pending = df[df["verdict"] == "possible_duplicate"].head(limit)
    
    items = []
    for _, r in pending.iterrows():
        rec_a = material_service.code_to_canonical.get(r["code_a"])
        rec_b = material_service.code_to_canonical.get(r["code_b"])
        items.append({
            "match_id": r["match_id"],
            "code_a": r["code_a"],
            "code_b": r["code_b"],
            "desc_a": rec_a.raw_description if rec_a else "",
            "desc_b": rec_b.raw_description if rec_b else "",
            "cpse_a": rec_a.source_cpse if rec_a else "",
            "cpse_b": rec_b.source_cpse if rec_b else "",
            "confidence_score": r["confidence_score"],
            "verdict": r["verdict"],
            "explanation": r["explanation"],
            "safety_flags": r["safety_flags"] if pd.notna(r["safety_flags"]) else ""
        })

    return {"total_pending": len(items), "items": items}


@router.post("/materials/{match_id}/decision", tags=["Procurement Officer Review"])
def submit_officer_decision(
    match_id: str,
    payload: ReviewDecisionRequest,
    db: Session = Depends(get_db)
):
    """Record human procurement officer decision with audit trail."""
    res = material_service.record_officer_decision(
        db=db,
        match_id=match_id,
        decision=payload.decision,
        reviewer_notes=payload.reviewer_notes
    )
    return res


@router.post("/materials/unspsc-map", response_model=UNSPSCResult, tags=["Standardization"])
def map_unspsc(payload: UNSPSCMapRequest):
    """Maps raw procurement description to standard UNSPSC commodity taxonomy."""
    ext = extract_attributes(payload.raw_description)
    can = CanonicalMaterial(
        material_code="QUERY",
        source_cpse="GENERIC",
        raw_description=payload.raw_description,
        material_type=ext["material_type"],
        sub_type=ext["sub_type"],
        dimension_value=ext["dimension_value"],
        dimension_unit=ext["dimension_unit"],
        schedule=ext["schedule"],
        standard=ext["standard"],
        grade=ext["grade"],
        pressure_rating=ext["pressure_rating"],
    )
    return map_to_unspsc(can)


@router.get("/materials/evaluation", tags=["Analytics"])
def get_evaluation_benchmark():
    """Returns ground-truth validation metrics (Precision, Recall, F1, FPR, safety gate interventions)."""
    import os
    eval_path = "data/processed/evaluation_metrics.json"
    if os.path.exists(eval_path):
        with open(eval_path, "r") as f:
            return json.load(f)
    return {"status": "Evaluation metrics not yet computed. Run evaluation/evaluate.py."}


@router.get("/materials/audit", tags=["Audit"])
def get_audit_trail(limit: int = 50, db: Session = Depends(get_db)):
    """Returns tamper-evident log of procurement officer decisions and system events."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": json.loads(l.details) if l.details else {},
            "officer_id": l.officer_id,
        }
        for l in logs
    ]
