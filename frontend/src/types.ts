export interface CanonicalMaterial {
  material_code: string;
  source_cpse: string;
  raw_description: string;
  material_type?: string | null;
  sub_type?: string | null;
  dimension_value?: number | null;
  dimension_unit: string;
  schedule?: string | null;
  standard?: string | null;
  grade?: string | null;
  pressure_rating?: string | null;
  extraction_confidence?: Record<string, string>;
  raw_dimension_text?: string | null;
}

export interface CandidateMatch {
  material_code: string;
  source_cpse: string;
  raw_description: string;
  canonical_attributes: Record<string, any>;
  embedding_similarity: number;
  confidence_score: number;
  verdict: 'likely_duplicate' | 'possible_duplicate' | 'not_duplicate';
  explanation: string;
  matched_attributes: Record<string, string>;
  safety_flags: string[];
}

export interface LiveCheckResponse {
  query: string;
  extracted_attributes: CanonicalMaterial;
  candidates: CandidateMatch[];
  top_verdict: string;
  recommendation: string;
}

export interface GraphNode {
  id: string;
  material_code: string;
  source_cpse: string;
  cluster_id: number;
  category: string;
  raw_description: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  cluster_id: number;
  type: string;
}

export interface ClusterItem {
  material_code: string;
  source_cpse: string;
  raw_description: string;
  category: string;
  is_negative: boolean;
}

export interface ClusterGroup {
  cluster_id: number;
  category: string;
  total_items: number;
  cpses_involved: string[];
  items: ClusterItem[];
  is_deliberate_negative: boolean;
}

export interface ClustersResponse {
  total_clusters: number;
  clusters: ClusterGroup[];
  graph: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}

export interface KPIStats {
  total_materials: number;
  unique_physical_materials: number;
  redundant_codes_detected: number;
  catalog_reduction_percentage: number;
  estimated_annual_savings_inr: number;
  cpse_breakdown: Record<string, number>;
  evaluation_metrics: {
    precision?: number;
    recall?: number;
    f1_score?: number;
    false_positive_rate?: number;
    false_positives?: number;
    safety_gate_rejections?: number;
  };
  safety_gate_rejections: number;
}

export interface UNSPSCResult {
  unspsc_code: string;
  unspsc_title: string;
  commodity_category: string;
  hierarchy: string;
  confidence: number;
  human_review_required: boolean;
  mapping_rationale: string;
}

export interface ReviewQueueItem {
  match_id: string;
  code_a: string;
  code_b: string;
  desc_a: string;
  desc_b: string;
  cpse_a: string;
  cpse_b: string;
  confidence_score: number;
  verdict: string;
  explanation: string;
  safety_flags: string;
}
