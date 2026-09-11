"""
CLI Script to generate and validate the Multi-CPSE synthetic material dataset for SIH26099.
"""

import sys
import os

# Add root directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.data_gen.generator import save_dataset


def main():
    print("==================================================")
    print("SIH26099: GENERATING SYNTHETIC MULTI-CPSE DATASET")
    print("==================================================")
    
    raw_path, answer_path, stats = save_dataset(output_dir="data")
    
    print("\n[SUCCESS] Dataset generated successfully!")
    print(f"-> Raw Catalog Saved:     {raw_path}")
    print(f"-> Answer Key Saved:      {answer_path}")
    print("\n---------------- DATASET VALIDATION ----------------")
    print(f"Total Rows:                {stats['total_rows']}")
    print(f"Number of Clusters:        {stats['number_of_clusters']}")
    print(f"Average Cluster Size:      {stats['average_cluster_size']}")
    print(f"Ground-Truth Positive Pairs: {stats['positive_pairs']}")
    print(f"Ground-Truth Negative Pairs: {stats['negative_pairs']}")
    print(f"Deliberate Negative Traps: {stats['deliberate_negative_items']} items (~{round(stats['deliberate_negative_items'] / stats['total_rows'] * 100, 1)}%)")
    
    print("\nDistribution across CPSEs:")
    for cpse, count in stats['cpse_distribution'].items():
        print(f"  - {cpse}: {count} records")
        
    print("\nDistribution across Material Categories:")
    for cat, count in stats['category_distribution'].items():
        print(f"  - {cat}: {count} records")

    print("\n---------------- SAMPLE POSITIVE CLUSTER (CLUSTER 3: CS PIPE 2\" SCH 40) ----------------")
    import pandas as pd
    raw_df = pd.read_csv(raw_path)
    ans_df = pd.read_csv(answer_path)
    merged = raw_df.merge(ans_df, on="material_code")
    
    cluster_3 = merged[merged["ground_truth_cluster_id"] == 3]
    for _, row in cluster_3.iterrows():
        print(f"[{row['source_cpse']}] {row['material_code']}: {row['raw_description']}")

    print("\n---------------- SAMPLE DELIBERATE HARD NEGATIVES (NEAR-MISSES) ----------------")
    delib_negs = merged[merged["is_deliberate_negative"] == True].head(6)
    for _, row in delib_negs.iterrows():
        print(f"[CLUSTER {row['ground_truth_cluster_id']}] [{row['source_cpse']}] {row['material_code']}: {row['raw_description']}")

    print("\n==================================================")
    print("MODULE 1 VALIDATION COMPLETE")
    print("==================================================")


if __name__ == "__main__":
    main()
