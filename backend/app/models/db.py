"""
Module 14: SQLite Database Layer & SQLAlchemy Entities.

Entities:
- Material
- MaterialMatch
- MaterialCluster
- ReviewDecision
- AuditLog
- UNSPSCMapping
"""

import os
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sih26099.db"))
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MaterialText(Base):
    __tablename__ = "materials_text"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(64), unique=True, index=True, nullable=False)
    source_cpse = Column(String(32), index=True, nullable=False)  # IOCL, ONGC, BPCL, GAIL
    raw_description = Column(Text, nullable=False)
    
    # Canonical attributes
    material_type = Column(String(64), index=True, nullable=True)
    sub_type = Column(String(64), index=True, nullable=True)
    dimension_value = Column(Float, nullable=True)
    dimension_unit = Column(String(16), default="mm")
    schedule = Column(String(32), nullable=True)
    standard = Column(String(64), index=True, nullable=True)
    grade = Column(String(64), index=True, nullable=True)
    pressure_rating = Column(String(32), index=True, nullable=True)
    
    cluster_id = Column(Integer, index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MaterialEmbedding(Base):
    __tablename__ = "materials_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(64), unique=True, index=True, nullable=False)
    embedding_vector = Column(Text, nullable=False) # JSON or byte string
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MaterialMatch(Base):
    __tablename__ = "material_matches"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(String(128), unique=True, index=True, nullable=False)
    code_a = Column(String(64), index=True, nullable=False)
    code_b = Column(String(64), index=True, nullable=False)
    embedding_similarity = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    verdict = Column(String(32), index=True, nullable=False)  # likely_duplicate, possible_duplicate, not_duplicate
    explanation = Column(Text, nullable=False)
    safety_flags = Column(String(256), default="")
    
    # Human Review & Reconciliation
    officer_decision = Column(String(32), nullable=True)  # APPROVED, REJECTED, MODIFIED
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    action = Column(String(64), nullable=False)  # BATCH_PROCESSED, MATCH_REVIEWED, CODE_REUSED, NEW_CODE_CREATED
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(128), nullable=False)
    details = Column(Text, nullable=True)
    officer_id = Column(String(64), default="PROCUREMENT_OFFICER_1")


class ScoringAdjustment(Base):
    __tablename__ = "scoring_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    old_high_threshold = Column(Float, nullable=False)
    new_high_threshold = Column(Float, nullable=False)
    old_medium_threshold = Column(Float, nullable=False)
    new_medium_threshold = Column(Float, nullable=False)
    rationale = Column(Text, nullable=False)


class UNSPSCEntity(Base):
    __tablename__ = "unspsc_mappings"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String(64), index=True, nullable=False)
    unspsc_code = Column(String(32), index=True, nullable=False)
    unspsc_title = Column(String(256), nullable=False)
    commodity_category = Column(String(128), nullable=False)
    confidence = Column(Float, nullable=False)
    human_review_required = Column(Boolean, default=False)
    mapping_rationale = Column(Text, nullable=True)


class NationalMaterial(Base):
    __tablename__ = "national_materials"

    id = Column(Integer, primary_key=True, index=True)
    cnmc_code = Column(String(32), unique=True, index=True, nullable=False) # e.g. CNMC-0000001
    representative_description = Column(Text, nullable=False)
    unspsc_code = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CPSECodeLink(Base):
    __tablename__ = "cpse_code_links"

    id = Column(Integer, primary_key=True, index=True)
    national_material_id = Column(Integer, ForeignKey("national_materials.id"), index=True, nullable=False)
    material_code = Column(String(64), ForeignKey("materials_text.material_code"), index=True, nullable=False)
    source_cpse = Column(String(32), nullable=False)
    linked_by_match_id = Column(String(128), nullable=True) # The match_id that triggered this link
    linked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    """Create tables if they do not exist."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
