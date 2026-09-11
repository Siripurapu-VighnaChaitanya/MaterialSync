"""
Integration API Tests for FastAPI Backend (Module 5).
Verifies all public endpoints, schemas, and live check behavior.
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app


class TestAPIEndpoints(unittest.TestCase):

    def setUp(self):
        # Using context manager to trigger lifespan startup (DB init + Indexing)
        self.client_cm = TestClient(app)
        self.client = self.client_cm.__enter__()

    def tearDown(self):
        self.client_cm.__exit__(None, None, None)

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["is_indexed"])
        self.assertGreater(data["indexed_materials"], 100)

    def test_live_material_check_duplicate_found(self):
        """Primary Demo test: Query standard 2\" CS Pipe, expect match found."""
        payload = {
            "raw_description": "CS PIPE ASTM A106 GR B 2 INCH SCH 40",
            "source_cpse": "IOCL"
        }
        response = self.client.post("/materials/check", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["top_verdict"], "likely_duplicate")
        self.assertGreater(len(data["candidates"]), 0)
        self.assertIn("MATCH FOUND", data["recommendation"])

        top_cand = data["candidates"][0]
        self.assertGreaterEqual(top_cand["confidence_score"], 0.80)
        self.assertIn("PIPE", top_cand["explanation"])

    def test_live_material_check_no_match(self):
        """Completely novel/synthetic material should indicate safe to create new code."""
        payload = {
            "raw_description": "SPECIAL TITANIUM AEROSPACE TURBINE BLADE 500MM OD",
            "source_cpse": "ONGC"
        }
        response = self.client.post("/materials/check", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["top_verdict"], "not_duplicate")
        self.assertIn("Safe to create", data["recommendation"])

    def test_live_material_check_adversarial_rejected(self):
        """Testing query for high-pressure valve when only low-pressure exists."""
        payload = {
            "raw_description": "WCB VALVE GATE 2 INCH CLASS 2500",
            "source_cpse": "BPCL"
        }
        response = self.client.post("/materials/check", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotEqual(data["top_verdict"], "likely_duplicate")

    def test_live_material_check_invalid_input(self):
        response = self.client.post("/materials/check", json={"raw_description": "A"})
        # Pydantic validation returns 422
        self.assertIn(response.status_code, [400, 422])

    def test_get_clusters_graph(self):
        response = self.client.get("/materials/clusters")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_clusters", data)
        self.assertGreater(data["total_clusters"], 50)
        self.assertIn("graph", data)
        self.assertIn("nodes", data["graph"])
        self.assertIn("links", data["graph"])

    def test_get_statistics_kpis(self):
        response = self.client.get("/materials/stats")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_materials", data)
        self.assertIn("redundant_codes_detected", data)
        self.assertIn("estimated_annual_savings_inr", data)
        self.assertGreater(data["estimated_annual_savings_inr"], 1000000)

    def test_unspsc_mapping_endpoint(self):
        payload = {"raw_description": "STAINLESS STEEL SEAMLESS PIPE ASTM A312 TP316 50MM SCH 40S"}
        response = self.client.post("/materials/unspsc-map", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["unspsc_code"], "40141612")
        self.assertEqual(data["unspsc_title"], "Stainless steel pipe")

    def test_record_officer_decision(self):
        match_id = "TEST-MATCH-001"
        payload = {
            "decision": "APPROVED",
            "reviewer_notes": "Verified identical item across IOCL and BPCL."
        }
        response = self.client.post(f"/materials/{match_id}/decision", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["decision"], "APPROVED")


if __name__ == "__main__":
    unittest.main()
