# Match Confidence Scoring & Thresholds

## Threshold Definitions
- **`CONFIDENCE_HIGH_THRESHOLD`**: Determines if a match is flagged as a `likely_duplicate` and can be auto-approved or strongly recommended to the officer.
- **`CONFIDENCE_MEDIUM_THRESHOLD`**: Determines if a match is flagged as a `possible_duplicate` requiring human review.

## Feature 8: Adaptive Scoring (Self-Learning)
The system now features an **Adaptive Scoring Engine** (`backend/app/reconciliation/adaptive.py`).

### How it works:
- It tracks the history of `MaterialMatch` reviewer decisions (`APPROVED` vs `REJECTED`).
- If the system experiences a high rate of **False Positives** (high confidence matches that reviewers reject), the system will automatically *tighten* (increase) the thresholds.
- If the system experiences a high rate of **False Negatives** (low/medium confidence matches that reviewers end up approving as duplicates), the system will automatically *loosen* (decrease) the thresholds.
- All threshold adjustments and their mathematical rationale are transparently logged in the `scoring_adjustments` database table for auditability.
