import {
  LiveCheckResponse,
  ClustersResponse,
  KPIStats,
  UNSPSCResult,
  ReviewQueueItem,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  async checkHealth(): Promise<{ status: string; is_indexed: boolean; indexed_materials: number }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  async checkMaterial(rawDescription: string, sourceCpse: string = 'GENERIC'): Promise<LiveCheckResponse> {
    const res = await fetch(`${API_BASE}/materials/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_description: rawDescription, source_cpse: sourceCpse }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed checking material' }));
      throw new Error(err.detail || 'Network error checking material');
    }
    return res.json();
  },

  async bulkCheckMaterials(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/materials/bulk-check`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Bulk upload failed');
    return res.json();
  },

  async getClusters(): Promise<ClustersResponse> {
    const res = await fetch(`${API_BASE}/materials/clusters`);
    if (!res.ok) throw new Error('Failed to load clusters');
    return res.json();
  },

  async getEmbeddingProjection(): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/embedding-projection`);
    if (!res.ok) throw new Error('Failed to load embedding projection');
    return res.json();
  },

  async getStats(): Promise<KPIStats> {
    const res = await fetch(`${API_BASE}/materials/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async getReviewQueue(): Promise<{ total_pending: number; items: ReviewQueueItem[] }> {
    const res = await fetch(`${API_BASE}/materials/review-queue`);
    if (!res.ok) throw new Error('Failed to load review queue');
    return res.json();
  },

  async submitDecision(matchId: string, decision: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/${matchId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewer_notes: notes }),
    });
    if (!res.ok) throw new Error('Failed to submit officer decision');
    return res.json();
  },

  async mapUNSPSC(rawDescription: string): Promise<UNSPSCResult> {
    const res = await fetch(`${API_BASE}/materials/unspsc-map`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_description: rawDescription }),
    });
    if (!res.ok) throw new Error('Failed to map UNSPSC');
    return res.json();
  },

  async getEvaluation(): Promise<any> {
    const res = await fetch(`${API_BASE}/materials/evaluation`);
    if (!res.ok) throw new Error('Failed to load evaluation');
    return res.json();
  },

  async getAudit(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/materials/audit`);
    if (!res.ok) throw new Error('Failed to load audit trail');
    return res.json();
  }
};
