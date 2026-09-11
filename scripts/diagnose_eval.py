import pandas as pd

raw_df = pd.read_csv('data/raw/material_master_raw.csv').set_index('material_code')
ans_df = pd.read_csv('data/processed/answer_key.csv').set_index('material_code')
df = pd.read_csv('data/processed/final_verdicts.csv')

fp = df[(df['verdict'] == 'likely_duplicate') & (df['is_ground_truth_match'] == False)]
print(f"Total False Positives: {len(fp)}")

print("\n--- SAMPLE FALSE POSITIVES ---")
for _, r in fp.head(5).iterrows():
    ca, cb = r['code_a'], r['code_b']
    desc_a = raw_df.loc[ca, 'raw_description']
    desc_b = raw_df.loc[cb, 'raw_description']
    cl_a = ans_df.loc[ca, 'ground_truth_cluster_id']
    cl_b = ans_df.loc[cb, 'ground_truth_cluster_id']
    print(f"\nPair: {ca} (Cluster {cl_a}) vs {cb} (Cluster {cl_b})")
    print(f"  A: {desc_a}")
    print(f"  B: {desc_b}")
    print(f"  Conf: {r['confidence_score']}, Expl: {r['explanation']}")
