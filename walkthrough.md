# MatCode Feature Kit - Walkthrough

The MatCode Feature Addition Kit implementation is now complete. The following features were added across the full stack (backend Python/FastAPI, SQLAlchemy Database, and React Frontend).

## Phase 1: Core Identity, Search Scalability & Cold-Start
- **Feature 1 (CNMC Central Registry):** 
  - Added new `NationalMaterial` and `CPSECodeLink` tables to the database.
  - Implemented auto-generation of unique CNMC codes upon procurement officer approval.
  - Added `GET /materials/{material_code}/national` endpoint to expose these links.
  - Documented schema nuances in `SCHEMA.md`.
- **Feature 2 (Optimized Blocking Layer):**
  - Updated `MatchingEngine` to use a `blocking_key` based on `unspsc_code` or `material_type` to drastically prune the vector search space (O(1) pre-filtering).
- **Feature 3 (Cold-Start Extraction):**
  - Built `nlp/seed_standards.py` to seed the NLP attribute extractor with standardized technical abbreviations (e.g. ASTM, ASME, API, IS).
  - Dynamically merged into the NLP extraction engine to improve robustness against missing or messy text data.

## Phase 2: Architecture, Governance & Roadmap
- **Feature 7 (Federated Deployment Architecture):**
  - Split the monolith `materials` table into `materials_text` (for sensitive textual descriptions) and `materials_embeddings` (for mathematically irreversible vector embeddings).
  - Updated relationships and schema, and documented the hub-and-spoke security model in `ARCHITECTURE_NOTE.md`.
- **Feature 8 (Adaptive Confidence Scoring):**
  - Implemented `recompute_thresholds()` inside `backend/app/reconciliation/adaptive.py`. 
  - The engine learns from `AuditLog` officer decisions (False Positives vs False Negatives) to slightly tighten or loosen matching confidence thresholds over time.
  - Added the `scoring_adjustments` audit table and documented mechanics in `SCORING.md`.
- **Feature 6 (Phase 2 Intelligence Stub):**
  - Created a mock endpoint `GET /materials/procurement-intelligence` that returns simulated JSON analytics for vendor overlap and price variances across clusters.

## Phase 3: Frontend Enhancements
- **Feature 4 (Executive ROI):**
  - Updated the backend `/materials/stats` endpoint to compute `estimated_annual_savings_inr`.
  - Added a highly visible, dynamic green metric card in the **Executive ROI Dashboard** (`AnalyticsView.tsx`) to showcase potential capital unlocked.
- **Feature 5 (Explain-Match Comparison):**
  - Upgraded the `LiveChecker.tsx` UI to dynamically render a 2-column comparison table when a duplicate is found. It now maps the newly entered material attributes against the matched database attributes, highlighting matching attributes in green and mismatches in red.
- **Feature 9 (3D Embedding Projection):**
  - Created a backend mock API `GET /materials/embedding-projection` to return [x,y,z] scatter-plot coordinates.
  - Integrated a toggle in `ClusterExplorer.tsx` to flip the physics force-graph layout into a direct 3D scatter plot to visualize AI embedding space clustering.

> [!TIP]
> **Next Steps:** Start the frontend server (`npm run dev`) and backend API (`uvicorn backend.app.main:app`) to test the new analytics, 3D toggles, and live check visual comparisons.
