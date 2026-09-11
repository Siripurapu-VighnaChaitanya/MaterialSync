import React, { useState } from 'react';
import { Database, Search, CheckCircle2, AlertTriangle, ArrowRight, Tag, Bookmark } from 'lucide-react';
import { api } from '../services/api';
import { UNSPSCResult } from '../types';

export const UNSPSCView: React.FC = () => {
  const [desc, setDesc] = useState('SS PIPE ASTM A312 TP316 50MM SCH 40S');
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<UNSPSCResult | null>(null);

  const handleMap = async (textToMap?: string) => {
    const q = textToMap !== undefined ? textToMap : desc;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.mapUNSPSC(q);
      setMapping(res);
    } catch (e) {
      console.error('Failed mapping UNSPSC', e);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'SS PIPE ASTM A312 TP316 50MM SCH 40S',
    'GATE VALVE WCB 2 INCH CLASS 150',
    'FLANGE WNRF ASTM A105 4 INCH 300#',
    'SPIRAL WOUND GASKET SS304 GRAPHITE 2 INCH 150#',
    'STUD BOLT ASTM A193 B7 3/4" X 110MM',
    'CS 90 DEG ELBOW ASTM A234 WPB 2 INCH',
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Database size={22} color="#3B82F6" />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
            UNSPSC Standard Commodity Taxonomy Mapping
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Maps disparate CPSE internal item codes to international United Nations Standard Products and Services Codes (UNSPSC) for unified procurement analytics and GeM (Government e-Marketplace) alignment.
        </p>
      </div>

      {/* Mapping Sandbox */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
          Test UNSPSC Classification:
        </h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleMap()}
            placeholder="Enter material description..."
            style={{
              flex: 1,
              background: '#0B0F19',
              border: '1px solid var(--border-bright)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#FFFFFF',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleMap()}
            disabled={loading || !desc.trim()}
            className="btn-primary"
            style={{ padding: '0 24px' }}
          >
            {loading ? 'Classifying...' : 'Map to UNSPSC'}
          </button>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDesc(q);
                handleMap(q);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Result Card */}
      {mapping && (
        <div className="glass-panel-glow" style={{ padding: '28px', maxWidth: '800px', margin: '0 auto 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={22} color="#3B82F6" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  UNSPSC Commodity Code
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#60A5FA', letterSpacing: '0.04em' }}>
                  {mapping.unspsc_code}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, color: mapping.confidence >= 0.8 ? '#10B981' : '#F59E0B' }}>
                {Math.round(mapping.confidence * 100)}%
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>MAPPING CONFIDENCE</span>
            </div>
          </div>

          <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Standardized Title</span>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
              {mapping.unspsc_title}
            </p>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Category:</strong> {mapping.commodity_category}
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
              <strong>Taxonomy Hierarchy:</strong> {mapping.hierarchy}
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Rationale:</strong> {mapping.mapping_rationale}
          </p>

          {mapping.human_review_required && (
            <div style={{ marginTop: '14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', color: '#FCD34D', fontSize: '12px' }}>
              <AlertTriangle size={16} color="#F59E0B" />
              <span>Confidence below threshold. Flagged for human procurement officer verification before catalog entry.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
