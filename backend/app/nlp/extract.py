"""
Module 2: Technical Attribute Extraction Engine for Procurement Descriptions.

Extracts canonical attributes:
- material_type (PIPE, VALVE, FLANGE, GASKET, FASTENER, FITTING)
- sub_type (GATE, BALL, GLOBE, CHECK, BUTTERFLY, NEEDLE, WNRF, BLRF, SORF, SWRF, SWG, CNAF, RTJ, STUD BOLT, HEX BOLT, HEX NUT, ELBOW, TEE, REDUCER, COUPLING, UNION)
- dimension_value (normalized to mm float)
- dimension_unit ("mm")
- schedule (SCH 40, SCH 80, SCH 10S, SCH 40S, etc.)
- standard (e.g. ASTM A106, ASME B16.5, IS 1239, API 5L, API 600)
- grade (e.g. GR B, 304, 316, B7, WPB, CF8M)
- pressure_rating (e.g. CLASS 150, CLASS 300, CLASS 600, 3000#, PN16)

Follows NON-NEGOTIABLE rules:
1. Never silently guess missing attributes.
2. Missing values are explicitly None.
3. Every attribute receives a confidence rating: high, medium, low.
4. Ambiguous descriptions are marked low confidence or None.

NOTE (Feature 3): Standards dictionary is dynamically seeded at runtime 
with abbreviations from `seed_standards.py` to solve cold-start issues.
"""

import re
from typing import Dict, Any, Optional, Tuple


# Pre-compiled Regex Patterns

# 1. Material Type
TYPE_PATTERNS = [
    (r"\b(?:PIPE|PIEP|PIPING|SMLS\s+PIPE)\b", "PIPE"),
    (r"\b(?:VALVE|VAVLE|GATE\s+VALVE|BALL\s+VALVE|GLOBE\s+VALVE|CHECK\s+VALVE|BUTTERFLY\s+VALVE|NEEDLE\s+VALVE)\b", "VALVE"),
    (r"\b(?:FLANGE|FLNAGE|WNRF|BLRF|SORF|SWRF)\b", "FLANGE"),
    (r"\b(?:GASKET|GASEKT|SWG|CNAF|RTJ|SPW)\b", "GASKET"),
    (r"\b(?:STUD\s+BOLT|HEX\s+BOLT|MACHINE\s+BOLT|HEX\s+NUT|BOLT|FASTENER)\b", "FASTENER"),
    (r"\b(?:ELBOW|TEE|REDUCER|COUPLING|UNION|FITTING|FITITNG)\b", "FITTING"),
]

# Secondary Sub-type clues when generic word missing
SUBTYPE_CLUES = [
    (r"\b(?:WNRF|BLRF|SORF|SWRF)\b", "FLANGE"),
    (r"\b(?:SWG|CNAF|RTJ)\b", "GASKET"),
    (r"\b(?:STUD\s+BOLT|HEX\s+BOLT|HEX\s+NUT)\b", "FASTENER"),
    (r"\b(?:ELBOW\s+90|LR\s+ELBOW|EQUAL\s+TEE|REDUCING\s+TEE|CONCENTRIC\s+REDUCER)\b", "FITTING"),
    (r"\b(?:GATE|BALL|GLOBE|CHECK|BUTTERFLY|NEEDLE)\b(?=.*(?:CLASS|#|PN|TRIM|BODY))", "VALVE"),
]

# Specific Sub-types
SUBTYPES_MAP = [
    # Valves
    (r"\bGATE\b", "GATE"),
    (r"\bBALL\b", "BALL"),
    (r"\bGLOBE\b", "GLOBE"),
    (r"\bCHECK\b", "CHECK"),
    (r"\bBUTTERFLY\b", "BUTTERFLY"),
    (r"\bNEEDLE\b", "NEEDLE"),
    # Flanges
    (r"\bWNRF\b", "WNRF"),
    (r"\bBLRF\b", "BLRF"),
    (r"\bSORF\b", "SORF"),
    (r"\bSWRF\b", "SWRF"),
    # Gaskets
    (r"\bSWG\b", "SWG"),
    (r"\b(?:CNAF|NON-ASBESTOS)\b", "CNAF"),
    (r"\bRTJ\b", "RTJ"),
    # Fasteners
    (r"\bSTUD\s+BOLT\b", "STUD BOLT"),
    (r"\b(?:HEX\s+BOLT|MACHINE\s+BOLT)\b", "HEX BOLT"),
    (r"\b(?:HEX\s+NUT|NUT)\b", "HEX NUT"),
    # Fittings
    (r"\bELBOW\b", "ELBOW"),
    (r"\b(?:REDUCING\s+TEE|TEE)\b", "TEE"),
    (r"\b(?:CONCENTRIC\s+REDUCER|ECCENTRIC\s+REDUCER|REDUCER)\b", "REDUCER"),
    (r"\bCOUPLING\b", "COUPLING"),
    (r"\bUNION\b", "UNION"),
]

# Known recognized standards for validation
KNOWN_STANDARDS = {
    "A106": "ASTM A106", "A312": "ASTM A312", "A333": "ASTM A333",
    "A216": "ASTM A216", "A105": "ASTM A105", "A182": "ASTM A182",
    "A193": "ASTM A193", "A194": "ASTM A194", "A234": "ASTM A234",
    "A403": "ASTM A403", "A694": "ASTM A694",
    "B16.5": "ASME B16.5", "B16.9": "ASME B16.9", "B16.11": "ASME B16.11",
    "B16.20": "ASME B16.20", "B16.34": "ASME B16.34",
    "5L": "API 5L", "600": "API 600", "602": "API 602", "608": "API 608",
    "609": "API 609", "594": "API 594", "6D": "API 6D",
    "1239": "IS 1239", "1367": "IS 1367", "210": "IS 210",
    "1873": "BS 1873", "7531": "BS 7531",
}

from backend.app.nlp.seed_standards import merge_standards
KNOWN_STANDARDS = merge_standards(KNOWN_STANDARDS)

# Standard Inch Nominal to MM mapping for piping & valves
INCH_FRACTIONS = {
    "1/4": 6.35, "3/8": 9.525, "1/2": 12.7, "3/4": 19.05, "5/8": 15.875, "7/8": 22.225,
    "1": 25.4, "1-1/8": 28.575, "1 1/8": 28.575, "1-1/4": 31.75, "1 1/4": 31.75,
    "1-1/2": 38.1, "1 1/2": 38.1, "2": 50.8, "2-1/2": 63.5, "2 1/2": 63.5,
    "2.5": 63.5, "3": 76.2, "4": 101.6, "5": 127.0, "6": 152.4,
    "8": 203.2, "10": 254.0, "12": 304.8, "14": 355.6, "16": 406.4,
    "18": 457.2, "20": 508.0, "24": 609.6
}


def _extract_material_type(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract standard material category and confidence."""
    for pattern, mtype in TYPE_PATTERNS:
        if re.search(pattern, text):
            return mtype, "high"
            
    for pattern, mtype in SUBTYPE_CLUES:
        if re.search(pattern, text):
            return mtype, "medium"
            
    return None, None


def _extract_subtype(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract specific component subtype (e.g., GATE vs BALL, WNRF vs SORF)."""
    for pattern, sub in SUBTYPES_MAP:
        if re.search(pattern, text):
            return sub, "high"
    return None, None


def _extract_dimension(text: str) -> Tuple[Optional[float], Optional[str], Optional[str]]:
    """Extract primary dimension, normalize to mm float, and return (dim_mm, confidence, raw_dim_str)."""
    # Pattern 1: Metric bolts (e.g., M16, M20 X 80MM)
    m_bolt = re.search(r"\bM(\d{2})\b(?:\s*X\s*\d+\s*(?:MM)?)?", text)
    if m_bolt:
        val = float(m_bolt.group(1))
        return val, "high", m_bolt.group(0)

    # Pattern 2: Fractions/Inch with X (e.g. 1/2" X 70MM, 3/4" X 110MM, 5/8" X 90MM)
    m_inch_x = re.search(r'([1357]/[1248]|1\s*[-– ]\s*[1357]/[1248]|\d+(?:\.\d+)?)\s*"\s*X\s*(\d+)\s*(?:MM)?', text)
    if m_inch_x:
        raw_diam = m_inch_x.group(1).replace(" ", "")
        if raw_diam in INCH_FRACTIONS:
            return INCH_FRACTIONS[raw_diam], "high", m_inch_x.group(0)
        try:
            return round(float(raw_diam) * 25.4, 2), "high", m_inch_x.group(0)
        except ValueError:
            pass

    # Pattern 3: Inch dimensions with quote or INCH / IN keyword
    m_inch = re.search(
        r'\b((?:1\s*[-– ]\s*)?[1357]/[1248]|\d+(?:\.\d+)?)\s*(?:"|INCH\b|IN\b|NOMINAL\b)',
        text
    )
    if m_inch:
        raw_token = m_inch.group(1).replace(" ", "")
        raw_match = m_inch.group(0)
        if raw_token in INCH_FRACTIONS:
            return INCH_FRACTIONS[raw_token], "high", raw_match
        try:
            val_inch = float(raw_token)
            return round(val_inch * 25.4, 2), "high", raw_match
        except ValueError:
            pass

    # Pattern 4: DN or NB (e.g., DN50, DN 100, 50 NB, 100NB, 50MM NB)
    m_dn_nb = re.search(r"\b(?:DN\s*(\d{2,3})|(\d{2,3})\s*(?:MM\s*)?NB)\b", text)
    if m_dn_nb:
        num_str = m_dn_nb.group(1) or m_dn_nb.group(2)
        val = float(num_str)
        return val, "high", m_dn_nb.group(0)

    # Pattern 5: Explicit Millimeters (e.g., 50 MM, 50.8MM, 100MM)
    m_mm = re.search(r"\b(\d+(?:\.\d+)?)\s*MM\b", text)
    if m_mm:
        val = float(m_mm.group(1))
        return val, "high", m_mm.group(0)

    # Pattern 6: Standalone Fractions followed by X (e.g. 3/4 X 110)
    m_frac_x = re.search(r'\b([1357]/[1248])\s*X\s*(\d+)', text)
    if m_frac_x:
        frac = m_frac_x.group(1)
        if frac in INCH_FRACTIONS:
            return INCH_FRACTIONS[frac], "medium", m_frac_x.group(0)

    return None, None, None


def _extract_schedule(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract pipe schedule or wall thickness."""
    m_sch = re.search(r"\b(SCH\s*(?:40S|80S|10S|160|80|40|STD|XS|XXS)|PSL2|PSL1)\b", text)
    if m_sch:
        return m_sch.group(1).replace(" ", ""), "high"
    return None, None


def _extract_standard(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract standard specification (ASTM, ASME, API, IS, BS) and confidence."""
    # ASTM pattern
    m_astm = re.search(r"\b(?:ASTM\s*[-–]?\s*A\s*[-–]?\s*|AA\s*[-–]?\s*|A\s*[-–]?\s*)(\d{3,4})\b", text)
    if m_astm:
        code = m_astm.group(1)
        key = f"A{code}"
        if key in KNOWN_STANDARDS:
            conf = "high" if "ASTM" in m_astm.group(0) else "medium"
            return KNOWN_STANDARDS[key], conf

    # ASME B pattern
    m_asme = re.search(r"\b(?:ASME\s*[-–]?\s*B\s*|B\s*)(\d{2}\.\d{1,2})\b", text)
    if m_asme:
        code = f"B{m_asme.group(1)}"
        if code in KNOWN_STANDARDS:
            conf = "high" if "ASME" in m_asme.group(0) else "medium"
            return KNOWN_STANDARDS[code], conf

    # API pattern
    m_api = re.search(r"\bAPI\s*[-–]?\s*(5L|600|602|608|609|594|6D)\b", text)
    if m_api:
        code = m_api.group(1)
        return f"API {code}", "high"

    # IS pattern
    m_is = re.search(r"\bIS\s*[-–]?\s*(1239|1367|210)\b", text)
    if m_is:
        return f"IS {m_is.group(1)}", "high"

    # BS pattern
    m_bs = re.search(r"\bBS\s*[-–]?\s*(1873|7531)\b", text)
    if m_bs:
        return f"BS {m_bs.group(1)}", "high"

    return None, None


def _extract_grade(text: str, standard: Optional[str] = None) -> Tuple[Optional[str], Optional[str]]:
    """Extract material metallurgy/grade and confidence with zero false collisions."""
    # Stainless Steel: F304, F316, TP304, TP316, 304, 316, CF8M
    m_ss_spec = re.search(r"\b(?:ASTM\s*A182\s*)?(F304|F316|F304L|F316L)\b", text)
    if m_ss_spec:
        return m_ss_spec.group(1), "high"

    m_wp = re.search(r"\b(WP304|WP316|WP304L|WP316L)\b", text)
    if m_wp:
        return m_wp.group(1), "high"

    m_tp = re.search(r"\b(TP304|TP316|TP304L|TP316L)\b", text)
    if m_tp:
        return m_tp.group(1), "high"

    if re.search(r"\bCF8M\b", text):
        return "CF8M", "high"

    # Stainless steel numeric grades: 304, 316
    m_ss_num = re.search(r"\b(?:SS\s*[-–]?\s*|STAINLESS\s*(?:STEEL\s*)?)?(304L|316L|304|316)\b", text)
    if m_ss_num and ("SS" in text or "STAINLESS" in text or "SWG" in text or "304" in text or "316" in text):
        return m_ss_num.group(1), "high"

    # Fastener specific grades: B7, B8, B8M, B16 (with negative lookahead to prevent ASME B16.5 collision!)
    m_bolt = re.search(r"\b(?:GRADE|GR\.?|GR-)?\s*(B7M|B8M|B16(?!\.\d)|B7|B8|2H|GR\s*2H)\b", text)
    if m_bolt:
        g = m_bolt.group(1).replace(" ", "")
        if g in ["2H", "GR2H"]:
            return "GR 2H", "high"
        return f"GR {g}" if g in ["B7", "B8", "B8M", "B16"] else g, "high"

    # Metric bolt grades
    m_met = re.search(r"\b(8\.8|4\.6|10\.9)\b", text)
    if m_met:
        return m_met.group(1), "high"

    # API 5L line pipe grades
    m_api_g = re.search(r"\b(X52|X65|X70|X60|X42)\b", text)
    if m_api_g:
        return m_api_g.group(1), "high"

    # Cast/forged steel grades
    if re.search(r"\b(?:A216\s*WCB|WCB)\b", text):
        return "A216 WCB", "high"
    if re.search(r"\b(?:A105N|A105)\b", text):
        return "A105", "high"
    if re.search(r"\b(?:WPB)\b", text):
        return "WPB", "high"

    # Generic Grade B, Grade 6, etc.
    m_gr = re.search(r"\b(?:GRADE|GR\.?|GR-)\s*([A-Z0-9]+)\b", text)
    if m_gr:
        val = m_gr.group(1)
        if val in ["B", "C", "6"]:
            return f"GR {val}", "high"
        elif val not in ["NO", "REF", "SEC", "MM", "IN", "STK"]:
            return f"GR {val}", "medium"

    # Gasket grades
    if "NON-ASBESTOS" in text or "CNAF" in text:
        return "NON-ASBESTOS", "medium"
    if "ARMCO" in text:
        return "ARMCO", "high"

    # IS 1239 pipe grade (Heavy / Medium)
    if "HEAVY" in text and ("IS 1239" in text or "GI" in text or "PIPE" in text):
        return "HEAVY", "medium"

    return None, None


def _extract_pressure(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract and normalize pressure rating and confidence."""
    # Pattern 1: CLASS / CL (e.g. CLASS 150, CL 300, CLASS 600, CLASS 800)
    m_class = re.search(r"\b(?:CLASS|CL\.?)\s*([1-9]\d{2,3})\b", text)
    if m_class:
        rating = m_class.group(1)
        if rating in ["150", "300", "600", "800", "900", "1500", "2500"]:
            return f"CLASS {rating}", "high"

    # Pattern 2: Pound symbol (e.g. 150#, 300#, 600#, 800#, 1500#) or LBS
    m_pound = re.search(r"\b([1-9]\d{2,3})\s*#(?:[^\w]|$)", text)
    if m_pound:
        rating = m_pound.group(1)
        if rating in ["150", "300", "600", "800", "900", "1500", "2500"]:
            return f"CLASS {rating}", "high"
        elif rating in ["3000", "6000"]:
            return f"{rating}#", "high"

    m_lbs = re.search(r"\b([1-9]\d{2,3})\s*(?:LBS|LB)\b", text)
    if m_lbs:
        rating = m_lbs.group(1)
        if rating in ["150", "300", "600", "800", "900", "1500", "2500"]:
            return f"CLASS {rating}", "high"
        elif rating in ["3000", "6000"]:
            return f"{rating}#", "high"

    # Pattern 3: Metric PN rating (e.g. PN16, PN 16, PN25, PN40)
    m_pn = re.search(r"\bPN\s*(\d{1,3})\b", text)
    if m_pn:
        return f"PN{m_pn.group(1)}", "high"

    # Pattern 4: High pressure forged fittings (3000#, 6000# standalone with context)
    m_forged = re.search(r"\b(3000|6000)\b(?=.*(?:COUPLING|UNION|NEEDLE|FORGED|FULL))", text)
    if m_forged:
        return f"{m_forged.group(1)}#", "medium"

    return None, None


def extract_attributes(raw_description: str) -> Dict[str, Any]:
    """
    Public Function:
    Extracts canonical structured attributes from raw procurement text description.
    """
    if not raw_description or not isinstance(raw_description, str):
        return {
            "material_type": None,
            "sub_type": None,
            "dimension_value": None,
            "dimension_unit": "mm",
            "schedule": None,
            "standard": None,
            "grade": None,
            "pressure_rating": None,
            "extraction_confidence": {},
            "raw_dimension_text": None,
        }

    clean_text = raw_description.upper()

    m_type, conf_type = _extract_material_type(clean_text)
    sub_type, conf_sub = _extract_subtype(clean_text)
    dim_val, conf_dim, raw_dim = _extract_dimension(clean_text)
    sch, conf_sch = _extract_schedule(clean_text)
    std, conf_std = _extract_standard(clean_text)
    grade, conf_grade = _extract_grade(clean_text, standard=std)
    press, conf_press = _extract_pressure(clean_text)

    confidence = {}
    if conf_type: confidence["material_type"] = conf_type
    if conf_sub: confidence["sub_type"] = conf_sub
    if conf_dim: confidence["dimension_value"] = conf_dim
    if conf_sch: confidence["schedule"] = conf_sch
    if conf_std: confidence["standard"] = conf_std
    if conf_grade: confidence["grade"] = conf_grade
    if conf_press: confidence["pressure_rating"] = conf_press

    return {
        "material_type": m_type,
        "sub_type": sub_type,
        "dimension_value": dim_val,
        "dimension_unit": "mm",
        "schedule": sch,
        "standard": std,
        "grade": grade,
        "pressure_rating": press,
        "extraction_confidence": confidence,
        "raw_dimension_text": raw_dim,
    }
