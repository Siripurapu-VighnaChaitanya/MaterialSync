"""
Unit and Adversarial Tests for Semantic & Attribute Matching Engine (Module 3 & 4).

Validates:
1. True Duplicates across CPSEs (IOCL, ONGC, BPCL) -> likely_duplicate
2. Adversarial Near-Miss: Same description, DIFFERENT GRADE (304 vs 316) -> not_duplicate (GRADE_MISMATCH)
3. Adversarial Near-Miss: Same grade, DIFFERENT PRESSURE (CLASS 150 vs CLASS 300) -> not_duplicate (PRESSURE_MISMATCH)
4. Adversarial Near-Miss: Same grade, DIFFERENT DIMENSION (50mm vs 100mm) -> not_duplicate (DIMENSION_MISMATCH)
5. Adversarial Near-Miss: Similar text, DIFFERENT MATERIAL TYPE (Pipe vs Elbow) -> not_duplicate (TYPE_MISMATCH)
6. Missing Attribute Case: Drops confidence to possible_duplicate rather than guessing.
"""

import unittest
from backend.app.schemas.canonical import CanonicalMaterial
from backend.app.nlp.extract import extract_attributes
from backend.app.matching.engine import match_pair


def make_record(code: str, cpse: str, raw_desc: str) -> CanonicalMaterial:
    extracted = extract_attributes(raw_desc)
    return CanonicalMaterial(
        material_code=code,
        source_cpse=cpse,
        raw_description=raw_desc,
        material_type=extracted["material_type"],
        sub_type=extracted["sub_type"],
        dimension_value=extracted["dimension_value"],
        dimension_unit=extracted["dimension_unit"],
        schedule=extracted["schedule"],
        standard=extracted["standard"],
        grade=extracted["grade"],
        pressure_rating=extracted["pressure_rating"],
        extraction_confidence=extracted["extraction_confidence"],
        raw_dimension_text=extracted["raw_dimension_text"],
    )


class TestMatchingEngine(unittest.TestCase):

    def test_true_duplicate_cross_cpse(self):
        """Cross-CPSE representations of identical 2\" CS Pipe must match with high confidence."""
        rec_iocl = make_record("IOCL-PIP-1001", "IOCL", "CS PIPE ASTM A106 GR B 2 INCH SCH 40")
        rec_ongc = make_record("ONGC-PIP-1002", "ONGC", "PIPE, CS, 2\" NOMINAL, ASTM A106 GR B, SCH 40, MR-8402")
        rec_bpcl = make_record("BPCL-PIP-1003", "BPCL", "50MM CARBON STEEL PIPE ASTM-A106 GRADE B SCH 40")

        # Test IOCL vs ONGC
        res1 = match_pair(rec_iocl, rec_ongc, embedding_similarity=0.92)
        self.assertEqual(res1.verdict, "likely_duplicate")
        self.assertGreaterEqual(res1.confidence_score, 0.80)
        self.assertEqual(len(res1.safety_flags), 0)

        # Test ONGC vs BPCL
        res2 = match_pair(rec_ongc, rec_bpcl, embedding_similarity=0.88)
        self.assertEqual(res2.verdict, "likely_duplicate")
        self.assertGreaterEqual(res2.confidence_score, 0.80)

    def test_adversarial_grade_mismatch(self):
        """CRITICAL: SS 304 vs SS 316 has high lexical similarity but MUST NEVER merge."""
        rec_304 = make_record("IOCL-PIP-2001", "IOCL", "SS PIPE 304 50MM SCH 40S")
        rec_316 = make_record("BPCL-PIP-2002", "BPCL", "SS PIPE 316 50MM SCH 40S")

        res = match_pair(rec_304, rec_316, embedding_similarity=0.95)
        self.assertEqual(res.verdict, "not_duplicate")
        self.assertIn("GRADE_MISMATCH", res.safety_flags)
        self.assertLess(res.confidence_score, 0.30)
        self.assertTrue("Grade" in res.explanation and "mismatch" in res.explanation)

    def test_adversarial_pressure_mismatch(self):
        """CRITICAL: CLASS 150 vs CLASS 300 Valve must NEVER merge (catastrophic safety hazard)."""
        rec_cl150 = make_record("IOCL-VAL-3001", "IOCL", "GATE VALVE WCB 2 INCH CLASS 150")
        rec_cl300 = make_record("ONGC-VAL-3002", "ONGC", "GATE VALVE WCB 2 INCH CLASS 300")

        res = match_pair(rec_cl150, rec_cl300, embedding_similarity=0.94)
        self.assertEqual(res.verdict, "not_duplicate")
        self.assertIn("PRESSURE_MISMATCH", res.safety_flags)
        self.assertLess(res.confidence_score, 0.30)

    def test_adversarial_dimension_mismatch(self):
        """CRITICAL: 50mm vs 100mm identical pipe must NOT merge."""
        rec_50 = make_record("IOCL-PIP-4001", "IOCL", "CS PIPE ASTM A106 GR B 50 MM SCH 40")
        rec_100 = make_record("IOCL-PIP-4002", "IOCL", "CS PIPE ASTM A106 GR B 100 MM SCH 40")

        res = match_pair(rec_50, rec_100, embedding_similarity=0.92)
        self.assertEqual(res.verdict, "not_duplicate")
        self.assertIn("DIMENSION_MISMATCH", res.safety_flags)
        self.assertLess(res.confidence_score, 0.30)

    def test_adversarial_material_type_mismatch(self):
        """Pipe vs Fitting Elbow with high token overlap must NOT merge."""
        rec_pipe = make_record("IOCL-PIP-5001", "IOCL", "CS PIPE ASTM A106 GR B 2 INCH")
        rec_elbow = make_record("IOCL-FIT-5002", "IOCL", "CS ELBOW 90 LR ASTM A234 WPB 2 INCH")

        res = match_pair(rec_pipe, rec_elbow, embedding_similarity=0.85)
        self.assertEqual(res.verdict, "not_duplicate")
        self.assertIn("TYPE_MISMATCH", res.safety_flags)

    def test_missing_attribute_penalty(self):
        """When grade is omitted, system must reduce confidence to possible_duplicate."""
        rec_full = make_record("IOCL-PIP-6001", "IOCL", "CS PIPE 2 INCH ASTM A106 GR B")
        rec_missing_grade = make_record("ONGC-PIP-6002", "ONGC", "CS PIPE 2 INCH ASTM A106")

        res = match_pair(rec_full, rec_missing_grade, embedding_similarity=0.88)
        self.assertEqual(res.verdict, "possible_duplicate")
        self.assertLess(res.confidence_score, 0.80)
        self.assertIn("Grade not explicitly specified", res.explanation)


if __name__ == "__main__":
    unittest.main()
