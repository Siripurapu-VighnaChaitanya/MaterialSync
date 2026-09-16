"""
Feature 8: Adaptive Scoring

Implements adaptive adjustment of thresholds based on officer review behaviors.
Reads from MaterialMatch officer_decision to tweak CONFIDENCE_HIGH_THRESHOLD 
and CONFIDENCE_MEDIUM_THRESHOLD.
"""

from typing import Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
import logging

from backend.app.models.db import MaterialMatch, ScoringAdjustment
import backend.app.reconciliation.reconcile as reconcile

logger = logging.getLogger(__name__)

LEARNING_RATE = 0.01  # How much to adjust per batch
MIN_SAMPLES = 10      # Minimum number of reviews needed to trigger adjustment

def recompute_thresholds(db: Session) -> Tuple[float, float]:
    """
    Reads recent officer decisions and adjusts global thresholds dynamically.
    Returns (new_high, new_medium).
    """
    
    # 1. Analyze False Positives (System said high match, officer rejected)
    false_positives = db.query(func.count(MaterialMatch.id)).filter(
        MaterialMatch.verdict == "likely_duplicate",
        MaterialMatch.officer_decision == "REJECTED"
    ).scalar() or 0
    
    # 2. Analyze False Negatives (System said medium/low match, officer approved as duplicate)
    false_negatives = db.query(func.count(MaterialMatch.id)).filter(
        MaterialMatch.verdict != "likely_duplicate",
        MaterialMatch.officer_decision == "APPROVED"
    ).scalar() or 0
    
    total_reviews = db.query(func.count(MaterialMatch.id)).filter(
        MaterialMatch.officer_decision.isnot(None)
    ).scalar() or 0
    
    old_high = reconcile.CONFIDENCE_HIGH_THRESHOLD
    old_medium = reconcile.CONFIDENCE_MEDIUM_THRESHOLD
    
    if total_reviews < MIN_SAMPLES:
        logger.info(f"Not enough reviews ({total_reviews} < {MIN_SAMPLES}) to trigger adaptive scoring.")
        return old_high, old_medium
        
    new_high = old_high
    new_medium = old_medium
    rationale = f"Analyzed {total_reviews} reviews. FPs: {false_positives}, FNs: {false_negatives}."
    
    # Simple heuristic
    if false_positives > false_negatives:
        # Too loose, tighten thresholds
        new_high = min(0.95, old_high + LEARNING_RATE)
        new_medium = min(0.70, old_medium + LEARNING_RATE)
        rationale += " Tightened thresholds due to high False Positives."
    elif false_negatives > false_positives:
        # Too strict, loosen thresholds
        new_high = max(0.65, old_high - LEARNING_RATE)
        new_medium = max(0.40, old_medium - LEARNING_RATE)
        rationale += " Loosened thresholds due to high False Negatives."
    else:
        rationale += " Thresholds stable."
        
    if new_high != old_high or new_medium != old_medium:
        # Log the adjustment
        adj = ScoringAdjustment(
            old_high_threshold=old_high,
            new_high_threshold=new_high,
            old_medium_threshold=old_medium,
            new_medium_threshold=new_medium,
            rationale=rationale
        )
        db.add(adj)
        db.commit()
        
        # Apply in memory
        reconcile.CONFIDENCE_HIGH_THRESHOLD = new_high
        reconcile.CONFIDENCE_MEDIUM_THRESHOLD = new_medium
        
        logger.info(f"Adaptive scoring updated: {rationale}")
        
    return new_high, new_medium
