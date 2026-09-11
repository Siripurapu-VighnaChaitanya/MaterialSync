"""
Ground Truth Evaluation Benchmark for SIH26099.

Evaluates matching accuracy against answer_key.csv.
Measures:
- Precision (critical for safety in procurement: false duplicates lead to wrong parts delivered!)
- Recall (retrieval of true duplicates across CPSEs)
- F1 Score
- False Positive Rate (FPR)
- False Negative Rate (FNR)
- Safety Gate Rejections count (verifying adversarial near-misses are stopped)

Saves:
- data/processed/final_verdicts.csv
- data/processed/evaluation_metrics.json
"""

import os
import sys
import json
import time
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Set, Tuple

# Add root directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.schemas.canonical import CanonicalMaterial
from backend.app.nlp.extract import extract_attributes
from backend.app.matching.engine import MatchingEngine, match_pair


def load_data(raw_path: str = "data/raw/material_master_raw.csv", answer_path: str = "data/processed/answer_key.csv"):
    raw_df = pd.read_csv(raw_path)
    ans_df = pd.read_csv(answer_path)
    return raw_df, ans_df


def run_evaluation(
    raw_path: str = "data/raw/material_master_raw.csv",
    answer_path: str = "data/processed/answer_key.csv",
    candidate_k: int = 15
) -> Dict[str, Any]:
    print("==================================================")
    print("SIH26099: RUNNING GROUND TRUTH EVALUATION PIPELINE")
    print("==================================================")

    start_time = time.time()

    raw_df, ans_df = load_data(raw_path, answer_path)
    print(f"Loaded {len(raw_df)} material records and {len(ans_df)} ground truth labels.")

    # 1. Attribute Extraction & Canonical Representation
    print("\nPhase 1: Extracting technical attributes...")
    canonical_records: List[CanonicalMaterial] = []
    for _, row in raw_df.iterrows():
        ext = extract_attributes(row["raw_description"])
        can = CanonicalMaterial(
            material_code=row["material_code"],
            source_cpse=row["source_cpse"],
            raw_description=row["raw_description"],
            material_type=ext["material_type"],
            dimension_value=ext["dimension_value"],
            dimension_unit=ext["dimension_unit"],
            standard=ext["standard"],
            grade=ext["grade"],
            pressure_rating=ext["pressure_rating"],
            extraction_confidence=ext["extraction_confidence"],
            raw_dimension_text=ext["raw_dimension_text"],
        )
        canonical_records.append(can)

    # 2. Build Vector & Attribute Index
    print("Phase 2: Indexing corpus with semantic vectors & attribute gates...")
    engine = MatchingEngine()
    engine.build_index(canonical_records)

    # 3. Ground truth ground truth cluster mapping
    code_to_cluster = dict(zip(ans_df["material_code"], ans_df["ground_truth_cluster_id"]))

    # Ground truth positive pairs set
    ground_truth_positives: Set[Tuple[str, str]] = set()
    clusters = {}
    for code, cid in code_to_cluster.items():
        clusters.setdefault(cid, []).append(code)

    for cid, members in clusters.items():
        if len(members) > 1:
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    pair = tuple(sorted([members[i], members[j]]))
                    ground_truth_positives.add(pair)

    total_gt_positives = len(ground_truth_positives)
    print(f"Ground-truth positive duplicate pairs: {total_gt_positives}")

    # 4. Batch candidate search & reconciliation
    print(f"Phase 3: Performing candidate retrieval (top-{candidate_k}) & attribute reconciliation...")
    all_match_results = engine.run_batch_matching(candidate_k=candidate_k)
    print(f"Evaluated {len(all_match_results)} candidate pairs.")

    # 5. Measure Metrics
    tp = 0  # Likely duplicate and truly in same cluster
    fp = 0  # Likely duplicate but in different cluster (DANGEROUS FALSE MERGE)
    fn = 0  # In same cluster but predicted not_duplicate or not retrieved
    safety_trips = 0

    verdicts_data = []

    predicted_positives: Set[Tuple[str, str]] = set()

    for m in all_match_results:
        pair = tuple(sorted([m.code_a, m.code_b]))
        is_gt_positive = pair in ground_truth_positives

        if m.safety_flags:
            safety_trips += 1

        if m.verdict == "likely_duplicate":
            predicted_positives.add(pair)
            if is_gt_positive:
                tp += 1
            else:
                fp += 1

        verdicts_data.append({
            "match_id": m.match_id,
            "code_a": m.code_a,
            "code_b": m.code_b,
            "embedding_similarity": m.embedding_similarity,
            "confidence_score": m.confidence_score,
            "verdict": m.verdict,
            "safety_flags": ";".join(m.safety_flags),
            "is_ground_truth_match": is_gt_positive,
            "explanation": m.explanation
        })

    # False negatives: GT positives that were not classified as likely_duplicate
    fn = total_gt_positives - tp

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / total_gt_positives, 4) if total_gt_positives > 0 else 0.0
    f1 = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0

    # Total negative pairs in ground truth
    total_items = len(raw_df)
    total_pairs = total_items * (total_items - 1) // 2
    total_negatives = total_pairs - total_gt_positives
    fpr = round(fp / total_negatives, 6) if total_negatives > 0 else 0.0
    fnr = round(fn / total_gt_positives, 4) if total_gt_positives > 0 else 0.0

    elapsed_time = round(time.time() - start_time, 2)

    metrics = {
        "total_materials": total_items,
        "ground_truth_clusters": len(clusters),
        "ground_truth_positive_pairs": total_gt_positives,
        "predicted_positive_pairs": len(predicted_positives),
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "false_positive_rate": fpr,
        "false_negative_rate": fnr,
        "safety_gate_rejections": safety_trips,
        "evaluation_time_seconds": elapsed_time,
    }

    # Save final verdicts and metrics
    out_verdicts_path = "data/processed/final_verdicts.csv"
    out_metrics_path = "data/processed/evaluation_metrics.json"

    verdicts_df = pd.DataFrame(verdicts_data)
    verdicts_df.to_csv(out_verdicts_path, index=False)

    with open(out_metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n---------------- EVALUATION BENCHMARK RESULTS ----------------")
    print(f"Total Materials:             {metrics['total_materials']}")
    print(f"Ground-Truth Clusters:       {metrics['ground_truth_clusters']}")
    print(f"Precision:                   {round(metrics['precision'] * 100, 2)}%")
    print(f"Recall:                      {round(metrics['recall'] * 100, 2)}%")
    print(f"F1 Score:                    {round(metrics['f1_score'] * 100, 2)}%")
    print(f"False Positives (Dangerous): {metrics['false_positives']}")
    print(f"False Positive Rate (FPR):   {metrics['false_positive_rate']}")
    print(f"Safety Gate Interventions:   {metrics['safety_gate_rejections']} near-misses blocked")
    print(f"Evaluation Pipeline Runtime: {metrics['evaluation_time_seconds']}s")
    print(f"\nOutputs saved:")
    print(f"-> {out_verdicts_path}")
    print(f"-> {out_metrics_path}")
    print("==================================================")

    return metrics


if __name__ == "__main__":
    run_evaluation()
