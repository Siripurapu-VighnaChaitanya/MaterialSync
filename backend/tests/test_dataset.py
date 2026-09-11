import unittest
import pandas as pd
from backend.app.data_gen.generator import generate_dataset


class TestDatasetGeneration(unittest.TestCase):
    def test_dataset_generation_structure(self):
        raw_df, answer_key_df, stats = generate_dataset()
        
        # Verify row counts match
        self.assertEqual(len(raw_df), len(answer_key_df))
        self.assertGreaterEqual(len(raw_df), 400)
        
        # Verify columns
        self.assertIn("material_code", raw_df.columns)
        self.assertIn("source_cpse", raw_df.columns)
        self.assertIn("raw_description", raw_df.columns)
        
        self.assertIn("material_code", answer_key_df.columns)
        self.assertIn("ground_truth_cluster_id", answer_key_df.columns)
        self.assertIn("is_deliberate_negative", answer_key_df.columns)

        # Verify CPSE coverage
        cpses = set(raw_df["source_cpse"].unique())
        self.assertEqual(cpses, {"IOCL", "ONGC", "BPCL", "GAIL"})

        # Verify categories
        categories = set(answer_key_df["category"].unique())
        self.assertTrue({"PIPE", "VALVE", "FLANGE", "GASKET", "FASTENER", "FITTING"}.issubset(categories))

        # Verify deliberate negatives exist
        self.assertGreater(stats["deliberate_negative_items"], 30)
        self.assertGreater(stats["positive_pairs"], 400)
        self.assertGreater(stats["negative_pairs"], 50000)

    def test_no_empty_or_null_descriptions(self):
        raw_df, _, _ = generate_dataset()
        self.assertEqual(raw_df["raw_description"].isnull().sum(), 0)
        self.assertEqual((raw_df["raw_description"].str.strip() == "").sum(), 0)


if __name__ == "__main__":
    unittest.main()
