"""
Unit tests for Attribute Extraction Engine (Module 2).
Verifies:
- Abbreviations
- Typos (PIEP, FLNAGE, VAVLE)
- Missing standard
- Missing grade
- Inch to mm conversion
- DN / NB conversion
- Ambiguous descriptions (must NOT silently guess)
- Pressure classes (150#, CLASS 300, PN16, 3000#)
"""

import unittest
from backend.app.nlp.extract import extract_attributes


class TestAttributeExtraction(unittest.TestCase):

    def test_standard_pipe_extraction(self):
        desc = "CS PIPE ASTM A106 GR B 2 INCH SCH 40"
        attrs = extract_attributes(desc)
        self.assertEqual(attrs["material_type"], "PIPE")
        self.assertEqual(attrs["standard"], "ASTM A106")
        self.assertEqual(attrs["grade"], "GR B")
        self.assertAlmostEqual(attrs["dimension_value"], 50.8, delta=0.1)
        self.assertEqual(attrs["dimension_unit"], "mm")
        self.assertIn("material_type", attrs["extraction_confidence"])
        self.assertEqual(attrs["extraction_confidence"]["material_type"], "high")

    def test_dn_and_nb_conversion(self):
        desc_dn = "CARBON STEEL PIPE DN50 SCH 40 ASTM A106"
        attrs_dn = extract_attributes(desc_dn)
        self.assertEqual(attrs_dn["dimension_value"], 50.0)

        desc_nb = "CS PIP 100 NB A106 GRADE B"
        attrs_nb = extract_attributes(desc_nb)
        self.assertEqual(attrs_nb["dimension_value"], 100.0)

    def test_inch_fractions(self):
        desc_half = 'STUD BOLT ASTM A193 B7 1/2" X 70MM'
        attrs = extract_attributes(desc_half)
        self.assertEqual(attrs["material_type"], "FASTENER")
        self.assertAlmostEqual(attrs["dimension_value"], 12.7, delta=0.05)
        self.assertEqual(attrs["grade"], "GR B7")

        desc_three_quarter = 'HEX NUT ASTM A194 GR 2H 3/4"'
        attrs_nut = extract_attributes(desc_three_quarter)
        self.assertEqual(attrs_nut["material_type"], "FASTENER")
        self.assertAlmostEqual(attrs_nut["dimension_value"], 19.05, delta=0.05)
        self.assertEqual(attrs_nut["grade"], "GR 2H")

    def test_typo_handling(self):
        desc_pipe_typo = "CS PIEP ASTM A106 GR B 50 MM"
        attrs = extract_attributes(desc_pipe_typo)
        self.assertEqual(attrs["material_type"], "PIPE")

        desc_flange_typo = "CS FLNAGE WNRF 2 INCH 150#"
        attrs_flange = extract_attributes(desc_flange_typo)
        self.assertEqual(attrs_flange["material_type"], "FLANGE")

        desc_valve_typo = "WCB VAVLE GATE 4 INCH CLASS 150"
        attrs_valve = extract_attributes(desc_valve_typo)
        self.assertEqual(attrs_valve["material_type"], "VALVE")

    def test_missing_standard_never_guessed(self):
        desc = "CS PIPE 50MM GR B SCH 40"
        attrs = extract_attributes(desc)
        self.assertEqual(attrs["material_type"], "PIPE")
        self.assertEqual(attrs["grade"], "GR B")
        self.assertIsNone(attrs["standard"])  # MUST NOT guess ASTM A106

    def test_missing_grade_never_guessed(self):
        desc = "CS PIPE 2 INCH ASTM A106 SCH 40"
        attrs = extract_attributes(desc)
        self.assertEqual(attrs["material_type"], "PIPE")
        self.assertEqual(attrs["standard"], "ASTM A106")
        self.assertIsNone(attrs["grade"])  # MUST NOT guess Grade B

    def test_pressure_classes(self):
        # Class 150
        attrs1 = extract_attributes("GATE VALVE WCB 2 INCH CLASS 150")
        self.assertEqual(attrs1["pressure_rating"], "CLASS 150")

        # 300#
        attrs2 = extract_attributes("FLANGE WNRF ASTM A105 4 INCH 300#")
        self.assertEqual(attrs2["pressure_rating"], "CLASS 300")

        # PN16
        attrs3 = extract_attributes("BUTTERFLY VALVE CI 100MM PN16")
        self.assertEqual(attrs3["pressure_rating"], "PN16")

        # 3000# forged fitting
        attrs4 = extract_attributes("COUPLING FULL ASTM A105 1 INCH 3000#")
        self.assertEqual(attrs4["pressure_rating"], "3000#")

    def test_stainless_steel_grade_discrimination(self):
        desc304 = "SS PIPE 304 50MM SCH 40S"
        attrs304 = extract_attributes(desc304)
        self.assertEqual(attrs304["grade"], "304")

        desc316 = "SS PIPE 316 50MM SCH 40S"
        attrs316 = extract_attributes(desc316)
        self.assertEqual(attrs316["grade"], "316")

    def test_ambiguous_and_empty_input(self):
        # Empty string
        empty_attrs = extract_attributes("")
        self.assertIsNone(empty_attrs["material_type"])
        self.assertIsNone(empty_attrs["dimension_value"])

        # Ambiguous noise text
        noise_desc = "STORE REPLENISHMENT BATCH 2024 QA APPROVED SEC-4"
        noise_attrs = extract_attributes(noise_desc)
        self.assertIsNone(noise_attrs["material_type"])
        self.assertIsNone(noise_attrs["dimension_value"])
        self.assertIsNone(noise_attrs["standard"])
        self.assertIsNone(noise_attrs["grade"])
        self.assertIsNone(noise_attrs["pressure_rating"])


if __name__ == "__main__":
    unittest.main()
