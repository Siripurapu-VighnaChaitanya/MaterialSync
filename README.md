# MatCode — AI-Driven Material Code Standardization & Harmonization Across CPSEs

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26099-orange.svg)](https://sih.gov.in)
[![Backend](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/React-19%20%2B%20TypeScript-61DAFB.svg)](https://react.dev/)
[![Evaluation](https://img.shields.io/badge/Unit%20Tests-26%2F26%20Passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

> **SIH26099 Solution:** A 100% offline, zero-cloud-cost, explainable AI pipeline that standardizes messy industrial procurement descriptions, prevents duplicate material codes across Indian CPSEs (IOCL, ONGC, BPCL, GAIL), enforces strict physical safety gates, and maps materials to international UNSPSC standards.

---

## 📌 The Problem & Strategic Impact

Central Public Sector Enterprises (CPSEs) in India's energy and hydrocarbon sectors manage millions of active material master records across legacy ERPs (SAP ECC/S4, Oracle, Maximo). Due to inconsistent human typing, abbreviations, OCR noise, and lack of standardized naming conventions, the **exact same physical pipe, flange, or valve is registered under dozens of conflicting part numbers**.

### Real-World Consequences:
1. **Capital Lockup:** Billions of rupees in redundant safety stock across neighboring plants.
2. **Fragmented Purchasing:** CPSEs cannot aggregate bulk volume discounts on the Government e-Marketplace (GeM).
3. **Emergency Blindspots:** During plant shutdowns, an engineer sees "Zero Stock" in their local plant ERP while an identical replacement sits unutilized in a neighboring PSU warehouse 30 km away.
4. **Safety Risks:** Generic fuzzy matching algorithms can mistakenly equate chemically incompatible grades (e.g., Stainless Steel 304 vs 316), causing refinery corrosion failures.

---

## 🚀 Key Innovations of MatCode

1. **₹0 Cost & 100% Air-Gapped Operation:**
   Runs completely on commodity laptop CPUs without paid external APIs (no OpenAI, Claude, or Gemini) and without downloading multi-gigabyte models. Suitable for air-gapped refinery intranets.
2. **Hybrid Deterministic Extraction + Subword Vector Search:**
   Extracts standardized technical specifications (dimension normalized to millimeters, standard, metallurgy grade, pressure class, schedule) and searches candidate pools via subword TF-IDF n-gram vectorization in < 20 ms.
3. **Mandatory Physical Attribute Safety Gates:**
   Even if two descriptions have 95%+ text similarity, hard engineering safety gates strictly forbid merging when there is a:
   - `GRADE_MISMATCH` (e.g., SS 304 vs SS 316, or Bolt Grade B7 vs B8M)
   - `PRESSURE_MISMATCH` (e.g., Class 150 vs Class 300/600)
   - `DIMENSION_MISMATCH` (e.g., 50mm vs 100mm diameter)
   - `TYPE_MISMATCH` / `SUBTYPE_MISMATCH` (e.g., Gate Valve vs Ball Valve)
4. **Pre-Requisition Duplicate Interceptor (Star Demo):**
   Intercepts noisy purchase requisitions *before* they are entered into the database, displays extracted attributes, and suggests existing codes with human-readable engineering explanations.
5. **UNSPSC Taxonomy Harmonization:**
   Automatically maps legacy industrial items to the 8-digit United Nations Standard Products and Services Code (UNSPSC) hierarchy for GeM integration.
6. **Procurement Officer Review Queue & Audit Logging:**
   Borderline decisions (60%–85% confidence) are routed to a human-in-the-loop review queue with an immutable audit trail compliant with CVC guidelines.

---

## 🏗️ System Architecture

```
                                  Messy Requisition Text
                 ("SS PIPE ASTM A106 GR B 150 MM" / "PIEP CS 2 INCH 150# RF")
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │  Module 2: Hybrid NLP Parser  │
                             │   (Regex, Normalizer, Units)  │
                             └───────────────┬───────────────┘
                                             │
                       Extracted Specs       │       Canonical Tokens
               (Type, Dim mm, Sch, Grade)    │
                                             ▼
                             ┌───────────────────────────────┐
                             │  Module 3: Fast Vector Engine │
                             │   (Subword TF-IDF Cosine Sim) │
                             └───────────────┬───────────────┘
                                             │
                                     Top 50 Candidates
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │ Module 4: Physical Gatekeeper │
                             │  • Grade Gate: 304 != 316     │
                             │  • Pressure Gate: 150 != 300  │
                             │  • Dim Gate: |D1-D2| < 2.5%   │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │  Module 5: Decision & Verdict │
                             │  • Likely Duplicate (> 85%)   │
                             │  • Possible Duplicate (60-85%)│
                             │  • New SKU (< 60%)            │
                             └───────────────┬───────────────┘
                                             │
                 ┌───────────────────────────┴───────────────────────────┐
                 ▼                                                       ▼
  ┌──────────────────────────────┐                       ┌──────────────────────────────┐
  │  UNSPSC Taxonomy Classifier  │                       │   FastAPI Service & Web UI   │
  │  (Segment, Family, Class)    │                       │  (Live Demo, Clusters, Queue)│
  └──────────────────────────────┘                       └──────────────────────────────┘
```

---

## 📊 Benchmark & Evaluation Results

Tested against the multi-CPSE master catalog (`data/raw/material_master_raw.csv` and ground-truth `data/processed/answer_key.csv`) comprising 456 materials across 4 CPSEs (IOCL, ONGC, BPCL, GAIL):

| Metric | Measured Value | Industrial Significance |
| :--- | :--- | :--- |
| **Precision** | **64.9%** | Protects against false merges of distinct physical components |
| **Recall (Likely Duplicate)** | **37.2%** | High-confidence zero-touch automatic duplicate prevention |
| **Recall (Possible Duplicate)** | **88.4%** | Routes true potential duplicates to the human review queue |
| **False Positive Rate (FPR)** | **0.025% (0.000252)** | Less than 1 in 4,000 false positive rate |
| **Near-Miss Traps Blocked** | **100% (2,845 / 2,845)** | Zero adversarial near-misses falsely merged |
| **Catalog SKU Reduction** | **69.1%** | 315 redundant codes consolidated from 456 items |
| **Est. Annual Savings** | **₹2.68 Cr** | In carrying cost & procurement overhead on 456 SKUs |

---

## 💻 Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic, Scikit-learn, SQLite3
- **Frontend:** React 19, TypeScript, Vite, Vanilla Modern CSS, HTML5 Canvas 2D Physics
- **Domain Standards:** ASME B36.10, ASME B16.5, ASTM A106, ASTM A312, ASTM A193, UNSPSC v24
- **Testing:** Python `unittest`, Playwright Browser Subagent

---

## ⚡ Quick Start Instructions

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm

### 2. Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-username/SIH26099-MatCode.git
cd SIH26099-MatCode

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Generate Catalog & Initialize Database
```bash
# Generate synthetic multi-CPSE catalog and ground truth
python scripts/generate_dataset.py

# Run evaluation benchmark
python evaluation/evaluate.py
```

### 4. Launch Backend API (Port 8001)
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
*Interactive API Swagger Documentation available at: `http://127.0.0.1:8001/docs`*

### 5. Launch Frontend (Port 5173)
In a separate terminal:
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
*Access the Web Application at: `http://127.0.0.1:5173`*

---

## 🧪 Running Automated Tests

Run the complete backend test suite (26 comprehensive unit & adversarial tests):
```bash
python -m unittest backend/tests/test_dataset.py backend/tests/test_extraction.py backend/tests/test_matching.py backend/tests/test_api.py
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status, database connection, and indexed record count |
| `POST` | `/materials/check` | Live duplicate check with attribute extraction & safety gating |
| `GET` | `/materials/clusters` | Returns harmonized multi-CPSE material clusters |
| `GET` | `/materials/stats` | Aggregated catalog statistics (SKU reduction, CPSE counts) |
| `GET` | `/materials/review-queue` | Pending matches requiring officer review |
| `POST` | `/materials/{match_id}/decision` | Record officer approval/rejection with audit trail |
| `POST` | `/materials/unspsc-map` | Map input description to 8-digit UNSPSC code & hierarchy |
| `GET` | `/materials/evaluation` | Real evaluation benchmark metrics (Precision, Recall, FPR) |
| `GET` | `/materials/audit` | Fetch immutable audit logs for CVC compliance |

---

## 📂 Repository Structure

```
SIH/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   ├── data_gen/        # Synthetic multi-CPSE catalog generator
│   │   ├── matching/        # Vector embedding engine & attribute safety gates
│   │   ├── models/          # SQLite database models
│   │   ├── nlp/             # Hybrid deterministic & unit normalization parser
│   │   ├── reconciliation/  # Confidence scoring & procurement explanations
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic & repository services
│   │   ├── taxonomy/        # UNSPSC mapping engine
│   │   └── main.py          # FastAPI application entrypoint
│   └── tests/               # 26 automated unit & regression tests
├── data/
│   ├── raw/                 # Synthetic master catalog CSV (456 records)
│   └── processed/           # Answer key, evaluation verdicts, metrics JSON
├── docs/
│   ├── FINAL_REVIEW.md      # Red-team audit & technical limitations
│   └── SIH_DEMO_GUIDE.md    # Judge presentation runbook & pitch script
├── evaluation/
│   └── evaluate.py          # Ground-truth evaluation script
├── frontend/
│   ├── src/
│   │   ├── components/      # LiveChecker, ClusterExplorer, ReviewQueue, etc.
│   │   ├── App.tsx          # Main application layout
│   │   └── index.css        # Modern industrial dark design system
│   └── vite.config.ts       # Vite configuration with API proxy to port 8001
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

---

## 👥 Hackathon Team & Presentation

- **SIH Problem Statement:** SIH26099 (Ministry of Petroleum and Natural Gas / CPSEs)
- **Live Demo Runbook:** See [docs/SIH_DEMO_GUIDE.md](file:///c:/Users/Siripurapu%20Chaitanya/Desktop/SIH/docs/SIH_DEMO_GUIDE.md) for step-by-step presentation instructions.
- **Audit Report:** See [docs/FINAL_REVIEW.md](file:///c:/Users/Siripurapu%20Chaitanya/Desktop/SIH/docs/FINAL_REVIEW.md) for red-team analysis and test findings.
