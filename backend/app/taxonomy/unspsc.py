"""
Module 9: UNSPSC (United Nations Standard Products and Services Code) Mapping Engine.

Maps canonical procurement materials and standardized clusters to official UNSPSC codes:
- Segment 40: Distribution and Conditioning Systems and Equipment and Components
  - Family 4014: Fluid and gas distribution
    - Class 401416: Industrial Pipe
      - 40141611: Carbon steel pipe
      - 40141612: Stainless steel pipe
      - 40141616: Gaskets and seals
    - Class 401417: Pipe fittings
      - 40141718: Pipe elbows
      - 40141720: Pipe tees
      - 40141728: Pipe flanges
      - 40141731: Pipe couplings / unions
  - Family 4015: Pumps and compressors and valves
    - Class 401416: Industrial valves
      - 40141602: Gate valves
      - 40141604: Ball valves
      - 40141607: Globe valves
      - 40141608: Check valves
      - 40141619: Butterfly valves
      - 40141620: Needle valves
- Segment 31: Manufacturing and Processing Machinery and Accessories
  - Family 3116: Hardware
    - Class 311616: Fasteners
      - 31161601: Stud bolts
      - 31161602: Hex bolts
      - 31161614: Hex nuts

Principle: If confidence is low, set human_review_required = True.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.canonical import CanonicalMaterial


class UNSPSCResult(BaseModel):
    unspsc_code: str
    unspsc_title: str
    commodity_category: str
    hierarchy: str
    confidence: float
    human_review_required: bool
    mapping_rationale: str


# Standardized UNSPSC Catalog for CPSE Procurement
UNSPSC_CATALOG = {
    # 1. PIPES
    "PIPE_CS": {
        "code": "40141611",
        "title": "Carbon steel pipe",
        "category": "Piping & Tubing",
        "hierarchy": "40 > 4014 > 401416 > 40141611",
    },
    "PIPE_SS": {
        "code": "40141612",
        "title": "Stainless steel pipe",
        "category": "Piping & Tubing",
        "hierarchy": "40 > 4014 > 401416 > 40141612",
    },
    "PIPE_GENERIC": {
        "code": "40141600",
        "title": "Industrial pipe and tubing",
        "category": "Piping & Tubing",
        "hierarchy": "40 > 4014 > 401416",
    },

    # 2. VALVES
    "VALVE_GATE": {
        "code": "40141602",
        "title": "Gate valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141602",
    },
    "VALVE_BALL": {
        "code": "40141604",
        "title": "Ball valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141604",
    },
    "VALVE_GLOBE": {
        "code": "40141607",
        "title": "Globe valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141607",
    },
    "VALVE_CHECK": {
        "code": "40141608",
        "title": "Check valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141608",
    },
    "VALVE_BUTTERFLY": {
        "code": "40141619",
        "title": "Butterfly valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141619",
    },
    "VALVE_NEEDLE": {
        "code": "40141620",
        "title": "Needle valves",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416 > 40141620",
    },
    "VALVE_GENERIC": {
        "code": "40141600",
        "title": "Industrial valves - general",
        "category": "Valves & Controls",
        "hierarchy": "40 > 4014 > 401416",
    },

    # 3. FLANGES
    "FLANGE_ALL": {
        "code": "40141728",
        "title": "Pipe flanges and flange adapters",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417 > 40141728",
    },

    # 4. GASKETS
    "GASKET_ALL": {
        "code": "40141616",
        "title": "Gaskets and sealing washers",
        "category": "Seals & Gaskets",
        "hierarchy": "40 > 4014 > 401416 > 40141616",
    },

    # 5. FASTENERS
    "FASTENER_STUD": {
        "code": "31161601",
        "title": "Stud bolts and studs",
        "category": "Fasteners & Hardware",
        "hierarchy": "31 > 3116 > 311616 > 31161601",
    },
    "FASTENER_BOLT": {
        "code": "31161602",
        "title": "Hex head machine bolts",
        "category": "Fasteners & Hardware",
        "hierarchy": "31 > 3116 > 311616 > 31161602",
    },
    "FASTENER_NUT": {
        "code": "31161614",
        "title": "Hex nuts and heavy nuts",
        "category": "Fasteners & Hardware",
        "hierarchy": "31 > 3116 > 311616 > 31161614",
    },
    "FASTENER_GENERIC": {
        "code": "31161600",
        "title": "Industrial fasteners and hardware",
        "category": "Fasteners & Hardware",
        "hierarchy": "31 > 3116 > 311616",
    },

    # 6. FITTINGS
    "FITTING_ELBOW": {
        "code": "40141718",
        "title": "Pipe elbows and bends",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417 > 40141718",
    },
    "FITTING_TEE": {
        "code": "40141720",
        "title": "Pipe tees and reducing tees",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417 > 40141720",
    },
    "FITTING_REDUCER": {
        "code": "40141725",
        "title": "Pipe reducers and concentric reducers",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417 > 40141725",
    },
    "FITTING_COUPLING": {
        "code": "40141731",
        "title": "Pipe couplings and unions",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417 > 40141731",
    },
    "FITTING_GENERIC": {
        "code": "40141700",
        "title": "Pipe fittings - general",
        "category": "Fittings & Flanges",
        "hierarchy": "40 > 4014 > 401417",
    },
}


def map_to_unspsc(material: CanonicalMaterial) -> UNSPSCResult:
    """
    Map canonical material to UNSPSC code, description, hierarchy, and confidence.
    """
    mtype = material.material_type
    sub = material.sub_type
    grade = (material.grade or "").upper()

    if mtype == "PIPE":
        if "304" in grade or "316" in grade:
            cat_key = "PIPE_SS"
            rationale = "Matched Stainless Steel Pipe by metallurgy grade"
            conf = 0.94
        elif "A106" in (material.standard or "") or "GR B" in grade or "CS" in material.raw_description:
            cat_key = "PIPE_CS"
            rationale = "Matched Carbon Steel Pipe by standard/metallurgy"
            conf = 0.95
        else:
            cat_key = "PIPE_GENERIC"
            rationale = "Generic industrial pipe classification"
            conf = 0.75

    elif mtype == "VALVE":
        if sub == "GATE":
            cat_key = "VALVE_GATE"
            conf = 0.96
        elif sub == "BALL":
            cat_key = "VALVE_BALL"
            conf = 0.96
        elif sub == "GLOBE":
            cat_key = "VALVE_GLOBE"
            conf = 0.95
        elif sub == "CHECK":
            cat_key = "VALVE_CHECK"
            conf = 0.95
        elif sub == "BUTTERFLY":
            cat_key = "VALVE_BUTTERFLY"
            conf = 0.95
        elif sub == "NEEDLE":
            cat_key = "VALVE_NEEDLE"
            conf = 0.95
        else:
            cat_key = "VALVE_GENERIC"
            conf = 0.70
        rationale = f"Mapped valve commodity code based on subtype '{sub or 'GENERIC'}'"

    elif mtype == "FLANGE":
        cat_key = "FLANGE_ALL"
        rationale = f"Standard flange commodity mapped for '{sub or 'PIPE FLANGE'}'"
        conf = 0.95

    elif mtype == "GASKET":
        cat_key = "GASKET_ALL"
        rationale = f"Standard gasket commodity mapped for '{sub or 'SEALING GASKET'}'"
        conf = 0.95

    elif mtype == "FASTENER":
        if sub == "STUD BOLT":
            cat_key = "FASTENER_STUD"
            conf = 0.95
        elif sub == "HEX BOLT":
            cat_key = "FASTENER_BOLT"
            conf = 0.94
        elif sub == "HEX NUT":
            cat_key = "FASTENER_NUT"
            conf = 0.96
        else:
            cat_key = "FASTENER_GENERIC"
            conf = 0.72
        rationale = f"Fastener commodity mapped for '{sub or 'GENERAL HARDWARE'}'"

    elif mtype == "FITTING":
        if sub == "ELBOW":
            cat_key = "FITTING_ELBOW"
            conf = 0.95
        elif sub == "TEE":
            cat_key = "FITTING_TEE"
            conf = 0.94
        elif sub == "REDUCER":
            cat_key = "FITTING_REDUCER"
            conf = 0.93
        elif sub in ["COUPLING", "UNION"]:
            cat_key = "FITTING_COUPLING"
            conf = 0.93
        else:
            cat_key = "FITTING_GENERIC"
            conf = 0.70
        rationale = f"Pipe fitting commodity mapped for '{sub or 'FITTING'}'"

    else:
        return UNSPSCResult(
            unspsc_code="40000000",
            unspsc_title="Industrial Distribution Equipment and Components (General)",
            commodity_category="General Industrial",
            hierarchy="40",
            confidence=0.40,
            human_review_required=True,
            mapping_rationale="Material category unclassified; manual officer assignment required."
        )

    info = UNSPSC_CATALOG[cat_key]
    review_required = conf < 0.80

    return UNSPSCResult(
        unspsc_code=info["code"],
        unspsc_title=info["title"],
        commodity_category=info["category"],
        hierarchy=info["hierarchy"],
        confidence=conf,
        human_review_required=review_required,
        mapping_rationale=rationale
    )
