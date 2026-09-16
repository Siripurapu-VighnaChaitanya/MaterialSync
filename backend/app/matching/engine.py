"""
Module 3: Core Semantic & Attribute Matching Engine.

Coordinates:
- Vector similarity via EmbeddingEngine
- Technical attribute safety gating (type, subtype, dimension, grade, schedule, pressure, standard)
- Reconciled confidence scoring via reconcile_match
"""

import re
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from backend.app.schemas.canonical import CanonicalMaterial, MatchResult
from backend.app.matching.embeddings import EmbeddingEngine
from backend.app.reconciliation.reconcile import reconcile_match


def normalize_grade_for_comparison(grade: Optional[str]) -> Optional[str]:
    """Normalize grade aliases (e.g. TP304 -> 304, F304 -> 304, GRADE B -> GR B, WCB -> A216 WCB)."""
    if not grade:
        return None
    g = grade.upper().strip()
    g = g.replace("GRADE", "GR").replace("GR.", "GR")
    if g in ["TP304", "F304", "WP304", "SS304", "SS 304", "304"]:
        return "304"
    if g in ["TP316", "F316", "WP316", "SS316", "SS 316", "316"]:
        return "316"
    if g in ["TP316L", "SS316L", "F316L", "WP316L", "316L"]:
        return "316L"
    if g in ["WCB", "A216 WCB", "CAST WCB"]:
        return "A216 WCB"
    if g in ["A105", "A105N"]:
        return "A105"
    if g in ["B7", "GR B7"]:
        return "GR B7"
    if g in ["B8", "GR B8"]:
        return "GR B8"
    if g in ["B8M", "GR B8M"]:
        return "GR B8M"
    if g in ["2H", "GR 2H"]:
        return "GR 2H"
    if g in ["B16", "GR B16"]:
        return "GR B16"
    return g


def normalize_pressure_for_comparison(pressure: Optional[str]) -> Optional[str]:
    """Normalize pressure rating aliases (e.g. 150# -> CLASS 150, PN 16 -> PN16)."""
    if not pressure:
        return None
    p = pressure.upper().strip()
    # Normalize pound/LBS notation to CLASS
    m = re.match(r'^(\d+)\s*(?:#|LBS?|POUND)$', p)
    if m:
        rating = m.group(1)
        if rating in ("150", "300", "600", "800", "900", "1500", "2500"):
            return f"CLASS {rating}"
        return f"{rating}#"
    # Normalize CLASS/CL variants
    m = re.match(r'^(?:CLASS|CL\.?)\s*(\d+)$', p)
    if m:
        return f"CLASS {m.group(1)}"
    # Normalize PN spacing
    m = re.match(r'^PN\s*(\d+)$', p)
    if m:
        return f"PN{m.group(1)}"
    return p


def compare_attributes(
    record_a: CanonicalMaterial,
    record_b: CanonicalMaterial
) -> Dict[str, Any]:
    """
    Field-by-field technical specification comparison with safety gate enforcement.
    Returns comparison status and any triggered safety violations.
    """
    safety_violations: List[str] = []

    # 1. Material Type (Primary Category)
    if record_a.material_type and record_b.material_type:
        if record_a.material_type == record_b.material_type:
            type_status = "MATCH"
        else:
            type_status = "MISMATCH"
            safety_violations.append("TYPE_MISMATCH")
    elif not record_a.material_type and not record_b.material_type:
        type_status = "BOTH_MISSING"
    else:
        type_status = "MISSING_A" if not record_a.material_type else "MISSING_B"

    # 2. Sub-Type (e.g. GATE vs BALL valve, WNRF vs SORF flange, ELBOW vs TEE)
    if record_a.sub_type and record_b.sub_type:
        if record_a.sub_type == record_b.sub_type:
            subtype_status = "MATCH"
        else:
            subtype_status = "MISMATCH"
            safety_violations.append("SUBTYPE_MISMATCH")
    elif not record_a.sub_type and not record_b.sub_type:
        subtype_status = "BOTH_MISSING"
    else:
        subtype_status = "MISSING_A" if not record_a.sub_type else "MISSING_B"

    # 3. Dimension Value & Tolerance Gate
    if record_a.dimension_value is not None and record_b.dimension_value is not None:
        dim_a = float(record_a.dimension_value)
        dim_b = float(record_b.dimension_value)
        diff = abs(dim_a - dim_b)
        rel_diff = diff / max(dim_a, dim_b) if max(dim_a, dim_b) > 0 else 0

        if diff <= 0.05:
            dim_status = "MATCH"
        elif diff <= 1.5 or rel_diff <= 0.025:
            dim_status = "TOLERANCE_MATCH"
        else:
            dim_status = "MISMATCH"
            safety_violations.append("DIMENSION_MISMATCH")
    elif record_a.dimension_value is None and record_b.dimension_value is None:
        dim_status = "BOTH_MISSING"
    else:
        dim_status = "MISSING_A" if record_a.dimension_value is None else "MISSING_B"

    # 4. Schedule / Wall Thickness Gate
    if record_a.schedule and record_b.schedule:
        sch_a = record_a.schedule.replace(" ", "")
        sch_b = record_b.schedule.replace(" ", "")
        if sch_a == sch_b:
            sch_status = "MATCH"
        else:
            sch_status = "MISMATCH"
            safety_violations.append("SCHEDULE_MISMATCH")
    elif not record_a.schedule and not record_b.schedule:
        sch_status = "BOTH_MISSING"
    else:
        sch_status = "MISSING_A" if not record_a.schedule else "MISSING_B"

    # 5. Grade & Metallurgy Safety Gate
    grade_a = normalize_grade_for_comparison(record_a.grade)
    grade_b = normalize_grade_for_comparison(record_b.grade)

    if grade_a and grade_b:
        if grade_a == grade_b:
            grade_status = "MATCH"
        else:
            grade_status = "MISMATCH"
            safety_violations.append("GRADE_MISMATCH")
    elif not grade_a and not grade_b:
        grade_status = "BOTH_MISSING"
    else:
        grade_status = "MISSING_A" if not grade_a else "MISSING_B"

    # 6. Pressure Rating Safety Gate (with normalization)
    press_a = normalize_pressure_for_comparison(record_a.pressure_rating)
    press_b = normalize_pressure_for_comparison(record_b.pressure_rating)

    if press_a and press_b:
        if press_a == press_b:
            press_status = "MATCH"
        else:
            press_status = "MISMATCH"
            safety_violations.append("PRESSURE_MISMATCH")
    elif not press_a and not press_b:
        press_status = "BOTH_MISSING"
    else:
        press_status = "MISSING_A" if not press_a else "MISSING_B"

    # 7. Standard Specification
    std_a = record_a.standard
    std_b = record_b.standard

    if std_a and std_b:
        if std_a == std_b:
            std_status = "MATCH"
        else:
            std_status = "MISMATCH"
            safety_violations.append("STANDARD_MISMATCH")
    elif not std_a and not std_b:
        std_status = "BOTH_MISSING"
    else:
        std_status = "MISSING_A" if not std_a else "MISSING_B"

    return {
        "material_type_status": type_status,
        "sub_type_status": subtype_status,
        "dimension_status": dim_status,
        "schedule_status": sch_status,
        "grade_status": grade_status,
        "pressure_status": press_status,
        "standard_status": std_status,
        "safety_violations": safety_violations,
    }


def match_pair(
    record_a: CanonicalMaterial,
    record_b: CanonicalMaterial,
    embedding_similarity: float = 0.85
) -> MatchResult:
    """Evaluate a single pair of material records."""
    comparison = compare_attributes(record_a, record_b)
    return reconcile_match(
        code_a=record_a.material_code,
        code_b=record_b.material_code,
        record_a=record_a,
        record_b=record_b,
        embedding_similarity=embedding_similarity,
        attribute_comparison=comparison
    )


class MatchingEngine:
    def __init__(self, embedding_engine: Optional[EmbeddingEngine] = None):
        self.embedding_engine = embedding_engine or EmbeddingEngine()
        self.records: List[CanonicalMaterial] = []
        self.code_to_record: Dict[str, CanonicalMaterial] = {}
        self.embeddings_matrix: Optional[np.ndarray] = None
        
        # FEATURE 2: Blocking Layer Index
        self.blocking_index: Dict[str, List[int]] = {}

    def get_blocking_key(self, record: CanonicalMaterial) -> Optional[str]:
        if getattr(record, "unspsc_code", None):
            return record.unspsc_code
        if record.material_type:
            return record.material_type
        return None

    def build_index(self, records: List[CanonicalMaterial]):
        """Index canonical material records and precompute dense embeddings with Blocking Layer."""
        self.records = records
        self.code_to_record = {r.material_code: r for r in records}
        texts = [r.raw_description for r in records]
        self.embeddings_matrix = self.embedding_engine.encode(texts)
        
        self.blocking_index = {}
        for i, rec in enumerate(self.records):
            bkey = self.get_blocking_key(rec)
            if bkey:
                self.blocking_index.setdefault(bkey, []).append(i)

    def find_candidates_for_record(
        self,
        query: CanonicalMaterial,
        top_k: int = 5
    ) -> List[MatchResult]:
        """
        Find top-k duplicate candidates for a single query material.
        Combines fast vector search with technical safety gates, using category blocking if available.
        """
        if self.embeddings_matrix is None or len(self.records) == 0:
            return []

        query_vec = self.embedding_engine.encode([query.raw_description])[0]
        
        bkey = self.get_blocking_key(query)
        # Fallback to full index if blocking key missing or not in index
        if bkey and bkey in self.blocking_index and len(self.blocking_index[bkey]) > 0:
            subset_indices = self.blocking_index[bkey]
            subset_matrix = self.embeddings_matrix[subset_indices]
            search_k = min(len(subset_indices), max(50, top_k * 10))
            
            # search within subset
            top_subset_hits = self.embedding_engine.search_top_k(
                query_vec,
                subset_matrix,
                top_k=search_k
            )
            # map subset indices back to global indices
            top_hits = [(subset_indices[sub_idx], sim) for sub_idx, sim in top_subset_hits]
        else:
            search_k = min(len(self.records), max(50, top_k * 10))
            top_hits = self.embedding_engine.search_top_k(
                query_vec,
                self.embeddings_matrix,
                top_k=search_k
            )

        results = []
        for idx, sim in top_hits:
            candidate = self.records[idx]
            if candidate.material_code == query.material_code:
                continue

            match_res = match_pair(query, candidate, embedding_similarity=sim)
            results.append(match_res)

        # Sort primarily by confidence score descending, then by embedding similarity
        results.sort(key=lambda m: (m.confidence_score, m.embedding_similarity), reverse=True)
        return results[:top_k]

    def run_batch_matching(
        self,
        candidate_k: int = 30
    ) -> List[MatchResult]:
        """
        Run batch pairwise matching across all indexed records, accelerated by blocking layer.
        """
        if self.embeddings_matrix is None or len(self.records) == 0:
            return []

        all_matches = []
        seen_pairs = set()

        # Phase 1: Blocked Search
        for bkey, subset_indices in self.blocking_index.items():
            if len(subset_indices) < 2:
                continue
            
            subset_matrix = self.embeddings_matrix[subset_indices]
            for local_idx, global_idx in enumerate(subset_indices):
                rec_a = self.records[global_idx]
                vec_a = subset_matrix[local_idx]
                
                search_k = min(len(subset_indices), candidate_k)
                top_subset_hits = self.embedding_engine.search_top_k(
                    vec_a,
                    subset_matrix,
                    top_k=search_k
                )
                
                for hit_local_idx, sim in top_subset_hits:
                    if local_idx >= hit_local_idx:
                        continue
                    
                    hit_global_idx = subset_indices[hit_local_idx]
                    pair_key = tuple(sorted([rec_a.material_code, self.records[hit_global_idx].material_code]))
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)
                    
                    match_res = match_pair(rec_a, self.records[hit_global_idx], embedding_similarity=sim)
                    all_matches.append(match_res)

        # Phase 2: Fallback for records with no blocking key
        unblocked_indices = [i for i, r in enumerate(self.records) if not self.get_blocking_key(r)]
        for global_idx in unblocked_indices:
            rec_a = self.records[global_idx]
            vec_a = self.embeddings_matrix[global_idx]
            
            top_hits = self.embedding_engine.search_top_k(
                vec_a,
                self.embeddings_matrix,
                top_k=candidate_k
            )
            for hit_global_idx, sim in top_hits:
                if global_idx == hit_global_idx:
                    continue
                
                pair_key = tuple(sorted([rec_a.material_code, self.records[hit_global_idx].material_code]))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                
                match_res = match_pair(rec_a, self.records[hit_global_idx], embedding_similarity=sim)
                all_matches.append(match_res)

        return all_matches
