# MatCode Database Schema

## Distinct Roles: UNSPSC vs. Common National Material Code (CNMC)

While both UNSPSC and CNMC aim to standardize procurement, they serve fundamentally different purposes in the MatCode architecture. **UNSPSC (United Nations Standard Products and Services Code)** is a global *classification standard*; it categorizes what a product is (e.g., placing a specific bearing into the "Ball Bearings" family). However, millions of different physical items can share the exact same UNSPSC code. 

**CNMC (Common National Material Code)**, by contrast, is our system's generated *national identity layer*. It acts as a unique primary key assigned to one exact physical item across the entire country. When the AI Engine identifies that ONGC's `SAMPLE-ONGC-001` and BPCL's `SAMPLE-BPCL-002` are the exact same physical gate valve, they are both mapped to a single, newly generated identity (e.g., `CNMC-0000001`). This preserves full traceability back to the original CPSE codes ("one national identity, every original code still visible"), enabling cross-enterprise inventory sharing without forcing CPSEs to immediately rewrite their internal ERP systems.
