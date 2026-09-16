"""
Seed Standards Dictionary for NLP Extraction.

Compiles a reference list of standard codes and common real-world abbreviation variants
for ASTM, API, IS, ANSI/ASME, NACE, etc.
These are merged into the extraction engine to resolve cold-start issues when 
dealing with messy CPSE standard abbreviations.
"""

# Feature 3: Cold-start NLP Seed Standards
STANDARD_SEEDS = {
    # ASTM
    "A106": "ASTM A106",
    "ASTM 106": "ASTM A106",
    "A-106": "ASTM A106",
    "A105": "ASTM A105",
    "A-105": "ASTM A105",
    "A182": "ASTM A182",
    "A-182": "ASTM A182",
    "A216": "ASTM A216",
    "A234": "ASTM A234",
    "A193": "ASTM A193",
    "A194": "ASTM A194",
    "A312": "ASTM A312",
    
    # API
    "5L": "API 5L",
    "API-5L": "API 5L",
    "600": "API 600",
    "6D": "API 6D",
    "API-6D": "API 6D",
    
    # IS
    "1239": "IS 1239",
    "IS-1239": "IS 1239",
    
    # ASME / ANSI
    "B16.5": "ASME B16.5",
    "ANSI B16.5": "ASME B16.5",
    "B16.9": "ASME B16.9",
    "B16.34": "ASME B16.34",
    "B16.11": "ASME B16.11",
    
    # NACE
    "MR0175": "NACE MR0175",
    "NACE 0175": "NACE MR0175",
}

def merge_standards(existing_map: dict) -> dict:
    """
    Merge the seed standards into the existing abbreviation dictionary.
    Does not overwrite existing (potentially CPSE-specific) abbreviations.
    """
    merged = existing_map.copy()
    for key, value in STANDARD_SEEDS.items():
        if key not in merged:
            merged[key] = value
    return merged
