"""
Synthetic Multi-CPSE Material Dataset Generator
Simulates procurement material master catalogs across 4 Indian CPSEs:
- IOCL (Indian Oil Corporation Limited)
- ONGC (Oil and Natural Gas Corporation)
- BPCL (Bharat Petroleum Corporation Limited)
- GAIL (Gas Authority of India Limited)

Generates:
1. data/raw/material_master_raw.csv (the catalog with variations, noise, typos, abbreviations)
2. data/processed/answer_key.csv (ground truth clusters, withheld from matching engine)
"""

import os
import random
import re
from typing import List, Dict, Any, Tuple
import pandas as pd

# Set fixed seed for 100% reproducibility
RANDOM_SEED = 26099
random.seed(RANDOM_SEED)

CPSE_LIST = ["IOCL", "ONGC", "BPCL", "GAIL"]

# Base Technical Materials Catalogue (120 underlying physical materials)
# Categories: PIPE, VALVE, FLANGE, GASKET, FASTENER, FITTING
BASE_CATALOG: List[Dict[str, Any]] = [
    # -------------------------------------------------------------
    # 1. PIPES (25 base items)
    # -------------------------------------------------------------
    {"id": 1, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 15.0, "dim_orig": '1/2"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 2, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 3, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 4, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "SCH 80", "press": None},
    {"id": 5, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 6, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 7, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sched": "SCH 80", "press": None},
    {"id": 8, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 9, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 10, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 250.0, "dim_orig": '10"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 11, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 300.0, "dim_orig": '12"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 12, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "304", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sched": "SCH 10S", "press": None},
    {"id": 13, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "304", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 14, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "304", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 15, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 16, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 17, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 18, "type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sched": "SCH 40S", "press": None},
    {"id": 19, "type": "PIPE", "mat": "LTCS", "std": "ASTM A333", "grade": "GR 6", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "SCH 40", "press": None},
    {"id": 20, "type": "PIPE", "mat": "LTCS", "std": "ASTM A333", "grade": "GR 6", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sched": "SCH 80", "press": None},
    {"id": 21, "type": "PIPE", "mat": "CS", "std": "API 5L", "grade": "X52", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sched": "PSL2", "press": None},
    {"id": 22, "type": "PIPE", "mat": "CS", "std": "API 5L", "grade": "X65", "dim_val": 300.0, "dim_orig": '12"', "unit": "inch", "sched": "PSL2", "press": None},
    {"id": 23, "type": "PIPE", "mat": "GI", "std": "IS 1239", "grade": "HEAVY", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sched": "HEAVY", "press": None},
    {"id": 24, "type": "PIPE", "mat": "GI", "std": "IS 1239", "grade": "HEAVY", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sched": "HEAVY", "press": None},
    {"id": 25, "type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 400.0, "dim_orig": '16"', "unit": "inch", "sched": "SCH 40", "press": None},

    # -------------------------------------------------------------
    # 2. VALVES (25 base items)
    # -------------------------------------------------------------
    {"id": 26, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},
    {"id": 27, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "GATE", "press": "CLASS 300"},
    {"id": 28, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},
    {"id": 29, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},
    {"id": 30, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "GATE", "press": "CLASS 300"},
    {"id": 31, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},
    {"id": 32, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},
    {"id": 33, "type": "VALVE", "mat": "A105", "std": "API 602", "grade": "A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "GATE", "press": "CLASS 800"},
    {"id": 34, "type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 35, "type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 36, "type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "BALL", "press": "CLASS 300"},
    {"id": 37, "type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 38, "type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 39, "type": "VALVE", "mat": "SS", "std": "API 608", "grade": "CF8M", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 40, "type": "VALVE", "mat": "SS", "std": "API 608", "grade": "CF8M", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "BALL", "press": "CLASS 150"},
    {"id": 41, "type": "VALVE", "mat": "WCB", "std": "BS 1873", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "GLOBE", "press": "CLASS 150"},
    {"id": 42, "type": "VALVE", "mat": "WCB", "std": "BS 1873", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "GLOBE", "press": "CLASS 150"},
    {"id": 43, "type": "VALVE", "mat": "A105", "std": "API 602", "grade": "A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "GLOBE", "press": "CLASS 800"},
    {"id": 44, "type": "VALVE", "mat": "WCB", "std": "API 594", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "CHECK", "press": "CLASS 150"},
    {"id": 45, "type": "VALVE", "mat": "WCB", "std": "API 594", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "CHECK", "press": "CLASS 150"},
    {"id": 46, "type": "VALVE", "mat": "WCB", "std": "API 594", "grade": "A216 WCB", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "CHECK", "press": "CLASS 150"},
    {"id": 47, "type": "VALVE", "mat": "CI", "std": "API 609", "grade": "IS 210", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "BUTTERFLY", "press": "PN16"},
    {"id": 48, "type": "VALVE", "mat": "CI", "std": "API 609", "grade": "IS 210", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "BUTTERFLY", "press": "PN16"},
    {"id": 49, "type": "VALVE", "mat": "SS", "std": "ASME B16.34", "grade": "316", "dim_val": 12.7, "dim_orig": '1/2"', "unit": "inch", "sub": "NEEDLE", "press": "6000#"},
    {"id": 50, "type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 300.0, "dim_orig": '12"', "unit": "inch", "sub": "GATE", "press": "CLASS 150"},

    # -------------------------------------------------------------
    # 3. FLANGES (20 base items)
    # -------------------------------------------------------------
    {"id": 51, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 52, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 53, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "WNRF", "press": "CLASS 300"},
    {"id": 54, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 55, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 56, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "WNRF", "press": "CLASS 300"},
    {"id": 57, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 58, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 59, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "BLRF", "press": "CLASS 150"},
    {"id": 60, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "BLRF", "press": "CLASS 150"},
    {"id": 61, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "BLRF", "press": "CLASS 150"},
    {"id": 62, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SORF", "press": "CLASS 150"},
    {"id": 63, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "SORF", "press": "CLASS 150"},
    {"id": 64, "type": "FLANGE", "mat": "SS", "std": "ASME B16.5", "grade": "ASTM A182 F304", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 65, "type": "FLANGE", "mat": "SS", "std": "ASME B16.5", "grade": "ASTM A182 F304", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 66, "type": "FLANGE", "mat": "SS", "std": "ASME B16.5", "grade": "ASTM A182 F316", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 67, "type": "FLANGE", "mat": "SS", "std": "ASME B16.5", "grade": "ASTM A182 F316", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},
    {"id": 68, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "SWRF", "press": "CLASS 300"},
    {"id": 69, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SWRF", "press": "CLASS 300"},
    {"id": 70, "type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 250.0, "dim_orig": '10"', "unit": "inch", "sub": "WNRF", "press": "CLASS 150"},

    # -------------------------------------------------------------
    # 4. GASKETS (15 base items)
    # -------------------------------------------------------------
    {"id": 71, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 72, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SWG", "press": "CLASS 300"},
    {"id": 73, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 74, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 75, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 76, "type": "GASKET", "mat": "SS316/GRAPHITE", "std": "ASME B16.20", "grade": "SS316", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 77, "type": "GASKET", "mat": "SS316/GRAPHITE", "std": "ASME B16.20", "grade": "SS316", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 78, "type": "GASKET", "mat": "SS316/PTFE", "std": "ASME B16.20", "grade": "SS316", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 79, "type": "GASKET", "mat": "CNAF", "std": "BS 7531", "grade": "NON-ASBESTOS", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "CNAF 1.5MM", "press": "CLASS 150"},
    {"id": 80, "type": "GASKET", "mat": "CNAF", "std": "BS 7531", "grade": "NON-ASBESTOS", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "CNAF 1.5MM", "press": "CLASS 150"},
    {"id": 81, "type": "GASKET", "mat": "CNAF", "std": "BS 7531", "grade": "NON-ASBESTOS", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "CNAF 3MM", "press": "CLASS 150"},
    {"id": 82, "type": "GASKET", "mat": "SOFT IRON", "std": "ASME B16.20", "grade": "ARMCO", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "RTJ R24", "press": "CLASS 600"},
    {"id": 83, "type": "GASKET", "mat": "SS316", "std": "ASME B16.20", "grade": "SS316", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "RTJ R37", "press": "CLASS 600"},
    {"id": 84, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sub": "SWG", "press": "CLASS 150"},
    {"id": 85, "type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "SWG", "press": "CLASS 300"},

    # -------------------------------------------------------------
    # 5. FASTENERS (18 base items)
    # -------------------------------------------------------------
    {"id": 86, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 12.7, "dim_orig": '1/2" X 70MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 87, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 15.8, "dim_orig": '5/8" X 90MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 88, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 19.0, "dim_orig": '3/4" X 110MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 89, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 19.0, "dim_orig": '3/4" X 130MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 90, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 22.2, "dim_orig": '7/8" X 140MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 91, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 25.4, "dim_orig": '1" X 150MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 92, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 28.5, "dim_orig": '1-1/8" X 175MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 93, "type": "FASTENER", "mat": "SS", "std": "ASTM A193", "grade": "B8", "dim_val": 15.8, "dim_orig": '5/8" X 90MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 94, "type": "FASTENER", "mat": "SS", "std": "ASTM A193", "grade": "B8", "dim_val": 19.0, "dim_orig": '3/4" X 110MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 95, "type": "FASTENER", "mat": "SS", "std": "ASTM A193", "grade": "B8M", "dim_val": 19.0, "dim_orig": '3/4" X 110MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 96, "type": "FASTENER", "mat": "SS", "std": "ASTM A193", "grade": "B8M", "dim_val": 25.4, "dim_orig": '1" X 150MM', "unit": "inch", "sub": "STUD BOLT", "press": None},
    {"id": 97, "type": "FASTENER", "mat": "CS", "std": "ASTM A194", "grade": "GR 2H", "dim_val": 19.0, "dim_orig": '3/4"', "unit": "inch", "sub": "HEX NUT", "press": None},
    {"id": 98, "type": "FASTENER", "mat": "CS", "std": "ASTM A194", "grade": "GR 2H", "dim_val": 22.2, "dim_orig": '7/8"', "unit": "inch", "sub": "HEX NUT", "press": None},
    {"id": 99, "type": "FASTENER", "mat": "CS", "std": "ASTM A194", "grade": "GR 2H", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "HEX NUT", "press": None},
    {"id": 100, "type": "FASTENER", "mat": "CS", "std": "IS 1367", "grade": "8.8", "dim_val": 16.0, "dim_orig": "M16 X 60MM", "unit": "mm", "sub": "HEX BOLT", "press": None},
    {"id": 101, "type": "FASTENER", "mat": "CS", "std": "IS 1367", "grade": "8.8", "dim_val": 20.0, "dim_orig": "M20 X 80MM", "unit": "mm", "sub": "HEX BOLT", "press": None},
    {"id": 102, "type": "FASTENER", "mat": "CS", "std": "IS 1367", "grade": "4.6", "dim_val": 12.0, "dim_orig": "M12 X 50MM", "unit": "mm", "sub": "HEX BOLT", "press": None},
    {"id": 103, "type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B16", "dim_val": 25.4, "dim_orig": '1" X 160MM', "unit": "inch", "sub": "STUD BOLT", "press": None},

    # -------------------------------------------------------------
    # 6. FITTINGS (17 base items)
    # -------------------------------------------------------------
    {"id": 104, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 105, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 106, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 80.0, "dim_orig": '3"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 107, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 108, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 150.0, "dim_orig": '6"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 109, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "TEE EQUAL", "sched": "SCH 40", "press": None},
    {"id": 110, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "TEE EQUAL", "sched": "SCH 40", "press": None},
    {"id": 111, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 150.0, "dim_orig": '6" X 4"', "unit": "inch", "sub": "REDUCING TEE", "sched": "SCH 40", "press": None},
    {"id": 112, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 100.0, "dim_orig": '4" X 2"', "unit": "inch", "sub": "CONCENTRIC REDUCER", "sched": "SCH 40", "press": None},
    {"id": 113, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 150.0, "dim_orig": '6" X 4"', "unit": "inch", "sub": "CONCENTRIC REDUCER", "sched": "SCH 40", "press": None},
    {"id": 114, "type": "FITTING", "mat": "SS", "std": "ASTM A403", "grade": "WP304", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40S", "press": None},
    {"id": 115, "type": "FITTING", "mat": "SS", "std": "ASTM A403", "grade": "WP316", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40S", "press": None},
    {"id": 116, "type": "FITTING", "mat": "CS", "std": "ASME B16.11", "grade": "ASTM A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "COUPLING FULL", "press": "3000#"},
    {"id": 117, "type": "FITTING", "mat": "CS", "std": "ASME B16.11", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "unit": "inch", "sub": "COUPLING FULL", "press": "3000#"},
    {"id": 118, "type": "FITTING", "mat": "CS", "std": "ASME B16.11", "grade": "ASTM A105", "dim_val": 25.4, "dim_orig": '1"', "unit": "inch", "sub": "UNION", "press": "3000#"},
    {"id": 119, "type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 200.0, "dim_orig": '8"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40", "press": None},
    {"id": 120, "type": "FITTING", "mat": "SS", "std": "ASTM A403", "grade": "WP316", "dim_val": 100.0, "dim_orig": '4"', "unit": "inch", "sub": "ELBOW 90 LR", "sched": "SCH 40S", "press": None},
]


def _format_dimension(dim_val: float, dim_orig: str, cpse: str, variation_idx: int) -> str:
    """Produce realistic variations in dimension formatting (inch, mm, NB, DN)."""
    # Standard metric equivalents
    nb_equiv = int(round(dim_val))
    if nb_equiv in [13, 15]:
        nb_val = "15"
    elif nb_equiv in [25, 26]:
        nb_val = "25"
    elif nb_equiv in [50, 51]:
        nb_val = "50"
    elif nb_equiv in [80]:
        nb_val = "80"
    elif nb_equiv in [100, 102]:
        nb_val = "100"
    elif nb_equiv in [150, 152]:
        nb_val = "150"
    elif nb_equiv in [200, 203]:
        nb_val = "200"
    elif nb_equiv in [250, 254]:
        nb_val = "250"
    elif nb_equiv in [300, 305]:
        nb_val = "300"
    elif nb_equiv in [400]:
        nb_val = "400"
    else:
        nb_val = str(nb_equiv)

    # Format options
    clean_dim_orig = dim_orig.replace('"', '').strip()
    
    if cpse == "IOCL":
        options = [
            f"{nb_val} NB",
            f"{nb_val}NB",
            f"{clean_dim_orig} INCH",
            f"{dim_orig}",
            f"{nb_val} MM",
        ]
    elif cpse == "ONGC":
        options = [
            f"{dim_orig} NOMINAL",
            f"{dim_orig}",
            f"{clean_dim_orig} IN",
            f"{nb_val}MM NB",
            f"{nb_val} MM",
        ]
    elif cpse == "BPCL":
        options = [
            f"{nb_val} MM",
            f"{nb_val}MM",
            f"DN{nb_val}",
            f"DN {nb_val}",
            f"{dim_orig}",
        ]
    else:  # GAIL
        options = [
            f"{dim_orig}",
            f"{clean_dim_orig}\"",
            f"{nb_val} NB",
            f"DN{nb_val}",
            f"{clean_dim_orig} INCH",
        ]
    return options[variation_idx % len(options)]


def _format_material(mat: str, cpse: str, variation_idx: int) -> str:
    """Synonyms and formatting variations for material metallurgy."""
    mapping = {
        "CS": ["CS", "CARBON STEEL", "C.S.", "CARBON-STL", "CS"],
        "SS": ["SS", "STAINLESS STEEL", "S.S.", "STN STL", "SS"],
        "LTCS": ["LTCS", "LOW TEMP CARBON STEEL", "L.T.C.S.", "LTCS", "LOW TEMPERATURE CS"],
        "GI": ["GI", "GALVANIZED IRON", "G.I.", "GALV IRON", "GI"],
        "WCB": ["CAST STEEL A216 WCB", "WCB", "CS WCB", "ASTM A216 WCB", "CAST CARBON STEEL WCB"],
        "A105": ["FORGED CS A105", "ASTM A105", "FORGED CARBON STEEL", "A105", "CS A105"],
        "CI": ["CAST IRON", "CI", "C.I.", "CAST-IRON", "CI"],
        "ALLOY STEEL": ["ALLOY STEEL", "ALLOY STL", "AS", "ALLOY STEEL", "ALLOY-STEEL"],
        "SS304": ["SS304", "SS 304", "STAINLESS STEEL 304", "TP304", "SS-304"],
        "SS316": ["SS316", "SS 316", "STAINLESS STEEL 316", "TP316", "SS-316"],
        "SS304/GRAPHITE": ["SS304/GRAPHITE", "SS 304 W/ GRAPHITE", "SPW SS304 GRAPHITE", "SS304 GRPH"],
        "SS316/GRAPHITE": ["SS316/GRAPHITE", "SS 316 W/ GRAPHITE", "SPW SS316 GRAPHITE", "SS316 GRPH"],
        "SS316/PTFE": ["SS316/PTFE", "SS316 W/ TEFLON", "SPW SS316 PTFE", "SS 316 PTFE"],
        "CNAF": ["CNAF", "NON-ASBESTOS", "COMPRESSED NON ASBESTOS", "CAF SUBSTITUTE CNAF"],
        "SOFT IRON": ["SOFT IRON", "ARMCO IRON", "SOFT-IRON", "LOW CARBON SOFT IRON"],
    }
    opts = mapping.get(mat, [mat])
    return opts[variation_idx % len(opts)]


def _format_pressure(press: str, cpse: str, variation_idx: int) -> str:
    """Variations in pressure class formatting."""
    if not press:
        return ""
    if "CLASS" in press:
        num = press.replace("CLASS", "").strip()
        opts = [f"CLASS {num}", f"{num}#", f"{num} LBS", f"CL {num}", f"CL.{num}", f"RATING {num}#"]
    elif "#" in press:
        num = press.replace("#", "").strip()
        opts = [f"{num}#", f"CLASS {num}", f"{num} LBS", f"RATING {num}#", f"CL {num}"]
    elif "PN" in press:
        opts = [press, f"{press} RATING", f"PRESSURE {press}"]
    else:
        opts = [press]
    return opts[variation_idx % len(opts)]


def _format_standard_grade(std: str, grade: str, variation_idx: int, drop_std: bool = False, drop_grade: bool = False) -> str:
    """Format standard specification and grade combinations."""
    if drop_std and drop_grade:
        return ""
    
    std_part = ""
    if not drop_std and std:
        std_opts = [
            std,
            std.replace(" ", "-"),
            std.replace("ASTM ", "A"),
            std,
        ]
        std_part = std_opts[variation_idx % len(std_opts)]
    
    grade_part = ""
    if not drop_grade and grade:
        grade_opts = [
            grade,
            grade.replace("GR ", "GRADE "),
            grade.replace("GR ", "GR."),
            grade,
        ]
        grade_part = grade_opts[variation_idx % len(grade_opts)]
    
    parts = [p for p in [std_part, grade_part] if p]
    return " ".join(parts)


def _apply_typo(text: str) -> str:
    """Controlled OCR/Data entry typos seen in real CPSE purchase records."""
    common_typos = {
        "PIPE": "PIEP",
        "FLANGE": "FLNAGE",
        "VALVE": "VAVLE",
        "GASKET": "GASEKT",
        "STAINLESS": "STIANLESS",
        "CARBON": "CRABON",
        "STEEL": "STELE",
        "BLIND": "BLINDD",
        "FITTING": "FITITNG",
    }
    words = text.split()
    new_words = []
    applied = False
    for w in words:
        if not applied and w in common_typos and random.random() < 0.4:
            new_words.append(common_typos[w])
            applied = True
        else:
            new_words.append(w)
    return " ".join(new_words)


def _generate_cpse_description(item: Dict[str, Any], cpse: str, cluster_id: int, var_idx: int) -> str:
    """Construct authentic CPSE purchase order / inventory description."""
    mtype = item["type"]
    mat_str = _format_material(item.get("mat", ""), cpse, var_idx)
    dim_str = _format_dimension(item["dim_val"], item["dim_orig"], cpse, var_idx)
    press_str = _format_pressure(item.get("press", ""), cpse, var_idx)
    
    # Missing attribute simulation (realistic CPSE omissions in ~10% of records)
    drop_std = (var_idx == 2 and random.random() < 0.3)
    drop_grade = (var_idx == 3 and random.random() < 0.25)
    std_gr_str = _format_standard_grade(item.get("std", ""), item.get("grade", ""), var_idx, drop_std, drop_grade)
    
    sub = item.get("sub", "")
    sched = item.get("sched", "")

    # CPSE Specific Style Templates
    if cpse == "IOCL":
        tokens = [mat_str, mtype]
        if sub: tokens.append(sub)
        if dim_str: tokens.append(dim_str)
        if sched: tokens.append(sched)
        if std_gr_str: tokens.append(std_gr_str)
        if press_str: tokens.append(press_str)
        # IOCL internal noise
        noise = random.choice([
            "", "COMMODITY: PIP-CS", "PR-REF: 8402", "SEC-4 GUJ REFY", "STK-CAT: A", "TAG# 1024"
        ])
        if noise and random.random() < 0.5:
            tokens.append(noise)
        raw = " ".join([t for t in tokens if t])

    elif cpse == "ONGC":
        # Formal procurement catalog style
        tokens = [mtype]
        if sub: tokens.append(sub)
        tokens.append(mat_str)
        tokens.append(dim_str)
        if std_gr_str: tokens.append(std_gr_str)
        if sched: tokens.append(sched)
        if press_str: tokens.append(press_str)
        noise = random.choice([
            "", "OFFSHORE HAZIRA", "MR-NO: 99120", "DRILLING OP", "BOMBAY HIGH STK", "API CERT"
        ])
        if noise and random.random() < 0.5:
            tokens.append(noise)
        raw = ", ".join([t for t in tokens if t])

    elif cpse == "BPCL":
        # Metric refinery style
        tokens = [dim_str, mat_str, mtype]
        if sub: tokens.append(sub)
        if std_gr_str: tokens.append(std_gr_str)
        if sched: tokens.append(sched)
        if press_str: tokens.append(press_str)
        noise = random.choice([
            "", "KOCHI REFY STK", "MUMBAI REFY", "PO# 450091", "INSP REQD", "BIN: 44-A"
        ])
        if noise and random.random() < 0.5:
            tokens.append(noise)
        raw = " ".join([t for t in tokens if t])

    else:  # GAIL
        # Gas transmission pipeline style
        tokens = [mtype, mat_str]
        if sub: tokens.append(sub)
        if std_gr_str: tokens.append(std_gr_str)
        tokens.append(dim_str)
        if sched: tokens.append(sched)
        if press_str: tokens.append(press_str)
        noise = random.choice([
            "", "GAS TRANS HV", "PIPELINE PROJ", "HVJ LINE", "NCR REGION", "COMPRESSOR STN"
        ])
        if noise and random.random() < 0.5:
            tokens.append(noise)
        raw = " - ".join([t for t in tokens if t])

    # Clean whitespace and punctuation artifacts
    raw = re.sub(r'\s+', ' ', raw).strip()
    
    # Inject typos occasionally (in ~6% of records)
    if random.random() < 0.08:
        raw = _apply_typo(raw)
        
    return raw.upper()


def generate_dataset() -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Generate the complete Multi-CPSE synthetic dataset.
    Returns:
    - raw_df: Material catalog containing raw_description, cpse, material_code
    - answer_key_df: Mapping of material_code to ground_truth_cluster_id
    - stats: Comprehensive validation metrics
    """
    records = []
    answer_keys = []
    
    code_counter = 1000
    
    # -------------------------------------------------------------
    # 1. POSITIVE CLUSTERS: 120 base items * 3 to 4 CPSE variations
    # -------------------------------------------------------------
    for item in BASE_CATALOG:
        cluster_id = item["id"]
        # Pick 3 or 4 CPSEs to have duplicate records for this item
        num_cpses = random.choice([3, 4])
        selected_cpses = random.sample(CPSE_LIST, num_cpses)
        
        for var_idx, cpse in enumerate(selected_cpses):
            code_counter += 1
            mat_code = f"{cpse}-{item['type'][:3]}-{code_counter}"
            
            raw_desc = _generate_cpse_description(item, cpse, cluster_id, var_idx)
            
            records.append({
                "material_code": mat_code,
                "source_cpse": cpse,
                "raw_description": raw_desc,
            })
            answer_keys.append({
                "material_code": mat_code,
                "ground_truth_cluster_id": cluster_id,
                "category": item["type"],
                "is_deliberate_negative": False,
            })

    # -------------------------------------------------------------
    # 2. DELIBERATE HARD NEGATIVES (~15% of records)
    # Critical near-misses that must NOT be falsely clustered:
    # - Same material & dimension, DIFFERENT GRADE (e.g. 304 vs 316)
    # - Same material & grade, DIFFERENT PRESSURE (e.g. 150# vs 300#)
    # - Same material & grade, DIFFERENT DIMENSION (e.g. 50mm vs 100mm)
    # -------------------------------------------------------------
    negative_traps = [
        # Grade traps (different metallurgy, identical size & type)
        {"type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316", "dim_val": 50.8, "dim_orig": '2"', "sched": "SCH 40S", "press": None, "base_cluster_ref": 13},
        {"type": "PIPE", "mat": "SS", "std": "ASTM A312", "grade": "316L", "dim_val": 100.0, "dim_orig": '4"', "sched": "SCH 40S", "press": None, "base_cluster_ref": 14},
        {"type": "FASTENER", "mat": "SS", "std": "ASTM A193", "grade": "B8M", "dim_val": 19.0, "dim_orig": '3/4" X 110MM', "sub": "STUD BOLT", "base_cluster_ref": 88},
        {"type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B16", "dim_val": 19.0, "dim_orig": '3/4" X 110MM', "sub": "STUD BOLT", "base_cluster_ref": 88},
        {"type": "FITTING", "mat": "SS", "std": "ASTM A403", "grade": "WP316", "dim_val": 50.8, "dim_orig": '2"', "sub": "ELBOW 90 LR", "sched": "SCH 40S", "base_cluster_ref": 114},
        
        # Pressure rating traps (catastrophic if merged in procurement)
        {"type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "sub": "GATE", "press": "CLASS 600", "base_cluster_ref": 26},
        {"type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 50.8, "dim_orig": '2"', "sub": "BALL", "press": "CLASS 600", "base_cluster_ref": 35},
        {"type": "VALVE", "mat": "WCB", "std": "API 608", "grade": "A216 WCB", "dim_val": 100.0, "dim_orig": '4"', "sub": "BALL", "press": "CLASS 300", "base_cluster_ref": 38},
        {"type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "sub": "WNRF", "press": "CLASS 600", "base_cluster_ref": 52},
        {"type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 100.0, "dim_orig": '4"', "sub": "WNRF", "press": "CLASS 600", "base_cluster_ref": 55},
        {"type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "sub": "WNRF", "press": "CLASS 900", "base_cluster_ref": 52},
        {"type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 50.8, "dim_orig": '2"', "sub": "SWG", "press": "CLASS 600", "base_cluster_ref": 71},
        {"type": "GASKET", "mat": "SS304/GRAPHITE", "std": "ASME B16.20", "grade": "SS304", "dim_val": 100.0, "dim_orig": '4"', "sub": "SWG", "press": "CLASS 300", "base_cluster_ref": 74},

        # Dimension traps (identical description & grade, different size)
        {"type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 65.0, "dim_orig": '2.5"', "sched": "SCH 40", "press": None, "base_cluster_ref": 3},
        {"type": "PIPE", "mat": "CS", "std": "ASTM A106", "grade": "GR B", "dim_val": 125.0, "dim_orig": '5"', "sched": "SCH 40", "press": None, "base_cluster_ref": 6},
        {"type": "VALVE", "mat": "WCB", "std": "API 600", "grade": "A216 WCB", "dim_val": 65.0, "dim_orig": '2.5"', "sub": "GATE", "press": "CLASS 150", "base_cluster_ref": 26},
        {"type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 65.0, "dim_orig": '2.5"', "sub": "WNRF", "press": "CLASS 150", "base_cluster_ref": 52},
        {"type": "FASTENER", "mat": "ALLOY STEEL", "std": "ASTM A193", "grade": "B7", "dim_val": 19.0, "dim_orig": '3/4" X 160MM', "sub": "STUD BOLT", "base_cluster_ref": 88},
        {"type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 65.0, "dim_orig": '2.5"', "sub": "ELBOW 90 LR", "sched": "SCH 40", "base_cluster_ref": 105},

        # Material Type mismatch trap with high lexical overlap
        {"type": "FITTING", "mat": "CS", "std": "ASTM A234", "grade": "WPB", "dim_val": 50.8, "dim_orig": '2"', "sub": "ELBOW 90 LR", "sched": "SCH 40", "base_cluster_ref": 3}, # Pipe vs Elbow
        {"type": "FLANGE", "mat": "CS", "std": "ASME B16.5", "grade": "ASTM A105", "dim_val": 50.8, "dim_orig": '2"', "sub": "SORF", "press": "CLASS 150", "base_cluster_ref": 52}, # WNRF vs SORF
    ]

    neg_cluster_id = 9000
    for neg_item in negative_traps:
        neg_cluster_id += 1
        # Generate 2 CPSE variations for this distinct negative cluster
        sample_cpses = random.sample(CPSE_LIST, 2)
        for var_idx, cpse in enumerate(sample_cpses):
            code_counter += 1
            mat_code = f"{cpse}-{neg_item['type'][:3]}-{code_counter}"
            raw_desc = _generate_cpse_description(neg_item, cpse, neg_cluster_id, var_idx)
            
            records.append({
                "material_code": mat_code,
                "source_cpse": cpse,
                "raw_description": raw_desc,
            })
            answer_keys.append({
                "material_code": mat_code,
                "ground_truth_cluster_id": neg_cluster_id,
                "category": neg_item["type"],
                "is_deliberate_negative": True,
            })

    raw_df = pd.DataFrame(records)
    answer_key_df = pd.DataFrame(answer_keys)
    
    # Shuffle catalog so CPSEs and clusters are randomly interleaved
    combined = raw_df.merge(answer_key_df, on="material_code")
    combined = combined.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    
    raw_df = combined[["material_code", "source_cpse", "raw_description"]].copy()
    answer_key_df = combined[["material_code", "ground_truth_cluster_id", "category", "is_deliberate_negative"]].copy()

    # Calculate dataset statistics
    total_rows = len(raw_df)
    unique_clusters = answer_key_df["ground_truth_cluster_id"].nunique()
    cluster_counts = answer_key_df["ground_truth_cluster_id"].value_counts()
    avg_cluster_size = cluster_counts.mean()
    
    # Pairwise ground truth statistics
    # Positive pairs = sum of (k * (k-1) / 2) for each cluster of size k
    pos_pairs = sum(k * (k - 1) // 2 for k in cluster_counts.values if k > 1)
    # Total possible pairs = total_rows * (total_rows - 1) / 2
    total_pairs = total_rows * (total_rows - 1) // 2
    neg_pairs = total_pairs - pos_pairs

    stats = {
        "total_rows": total_rows,
        "number_of_clusters": unique_clusters,
        "average_cluster_size": round(avg_cluster_size, 2),
        "positive_pairs": pos_pairs,
        "negative_pairs": neg_pairs,
        "deliberate_negative_items": int(answer_key_df["is_deliberate_negative"].sum()),
        "cpse_distribution": raw_df["source_cpse"].value_counts().to_dict(),
        "category_distribution": answer_key_df["category"].value_counts().to_dict(),
    }

    return raw_df, answer_key_df, stats


def save_dataset(output_dir: str = "data"):
    """Generate and save both material_master_raw.csv and answer_key.csv."""
    raw_dir = os.path.join(output_dir, "raw")
    proc_dir = os.path.join(output_dir, "processed")
    demo_dir = os.path.join(output_dir, "demo")
    
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(proc_dir, exist_ok=True)
    os.makedirs(demo_dir, exist_ok=True)

    raw_df, answer_key_df, stats = generate_dataset()

    raw_path = os.path.join(raw_dir, "material_master_raw.csv")
    answer_path = os.path.join(proc_dir, "answer_key.csv")
    
    # Also save in root data/ for top-level convenience as requested
    top_raw_path = os.path.join(output_dir, "material_master_raw.csv")
    top_answer_path = os.path.join(output_dir, "answer_key.csv")

    raw_df.to_csv(raw_path, index=False)
    answer_key_df.to_csv(answer_path, index=False)
    
    raw_df.to_csv(top_raw_path, index=False)
    answer_key_df.to_csv(top_answer_path, index=False)

    return raw_path, answer_path, stats
