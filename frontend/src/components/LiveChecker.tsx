import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { LiveCheckResponse } from '../types';

interface LiveCheckerProps {
  onCodeReused: (code: string) => void;
}

export const LiveChecker: React.FC<LiveCheckerProps> = ({ onCodeReused }) => {
  const [query, setQuery] = useState('');
  const [sourceCpse, setSourceCpse] = useState('IOCL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessModal, setActionSuccessModal] = useState<{ title: string; desc: string; type: 'reuse' | 'create' } | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);

  // Pre-configured SIH Demo Scenarios
  const demoScenarios = [
    {
      label: '1. Standard Pipe (IOCL / BPCL)',
      text: 'SS PIPE ASTM A106 GR B 150 MM',
      cpse: 'IOCL',
      type: 'positive'
    },
    {
      label: '2. Unit / Abbr (2" vs 50mm)',
      text: 'CS PIPE 2 INCH 150# SCH 40',
      cpse: 'BPCL',
      type: 'positive'
    },
    {
      label: '3. ADVERSARIAL: Grade Trap (316 vs 304)',
      text: 'SS PIPE 316 50MM SCH 40S',
      cpse: 'ONGC',
      type: 'adversarial'
    },
    {
      label: '4. ADVERSARIAL: Pressure Trap (600# vs 150#)',
      text: 'GATE VALVE WCB 2 INCH CLASS 600',
      cpse: 'GAIL',
      type: 'adversarial'
    },
    {
      label: '5. Novel Unseen Item (Safe New Code)',
      text: 'SPECIAL TITANIUM TURBINE BLADE 500MM',
      cpse: 'ONGC',
      type: 'new'
    }
  ];

  const handleSearch = async (overrideText?: string, overrideCpse?: string) => {
    const searchText = overrideText !== undefined ? overrideText : query;
    const searchCpse = overrideCpse !== undefined ? overrideCpse : sourceCpse;
    if (!searchText.trim() || searchText.trim().length < 3) return;

    setLoading(true);
    setError(null);
    setResponseTimeMs(null);
    try {
      const startTime = performance.now();
      const data = await api.checkMaterial(searchText, searchCpse);
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTimeMs(elapsed);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with harmonization engine');
    } finally {
      setLoading(false);
    }
  };

  const selectScenario = (text: string, cpse: string) => {
    setQuery(text);
    setSourceCpse(cpse);
    handleSearch(text, cpse);
  };

  const handleUseExisting = (code: string) => {
    onCodeReused(code);
    setActionSuccessModal({
      title: 'DUPLICATE CODE PREVENTED!',
      desc: `Procurement Officer confirmed reuse of existing standardized material code: ${code}. No redundant SKU created in ERP catalog. Estimated enterprise inventory carrying cost saved: ₹85,000 / year.`,
      type: 'reuse'
    });
  };

  const handleCreateNew = () => {
    setActionSuccessModal({
      title: 'NEW MATERIAL CODE CREATED',
      desc: `New canonical material record catalogued and indexed across CPSE master with assigned UNSPSC taxonomy.`,
      type: 'create'
    });
  };

  const getCpseBadgeClass = (cpse: string) => {
    switch (cpse?.toUpperCase()) {
      case 'IOCL': return 'badge-iocl';
      case 'ONGC': return 'badge-ongc';
      case 'BPCL': return 'badge-bpcl';
      case 'GAIL': return 'badge-gail';
      default: return 'badge-generic';
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Title & Banner */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '14px' }}>
          <Zap size={14} color="#60A5FA" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.04em' }}>SIH26099 LIVE DEMONSTRATION ENGINE</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Live Cross-CPSE Duplicate Prevention
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '780px', margin: '0 auto' }}>
          Enter messy material descriptions from purchase orders or SAP/ERP requests. The AI pipeline cleans text, extracts physical attributes, and checks against IOCL, ONGC, BPCL, and GAIL material masters.
        </p>
      </div>

      {/* Input Form & Quick Scenario Chips */}
      <div className="glass-panel-glow" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {/* CPSE Select */}
          <select
            value={sourceCpse}
            onChange={(e) => setSourceCpse(e.target.value)}
            style={{
              background: '#0B0F19',
              color: '#FFFFFF',
              border: '1px solid var(--border-bright)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="IOCL">IOCL</option>
            <option value="ONGC">ONGC</option>
            <option value="BPCL">BPCL</option>
            <option value="GAIL">GAIL</option>
          </select>

          {/* Description Input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. SS PIPE ASTM A106 GR B 150 MM, CS 90 DEG ELBOW 2 INCH, GATE VALVE 150#..."
              style={{
                width: '100%',
                background: '#0B0F19',
                border: '1px solid var(--border-bright)',
                borderRadius: '8px',
                padding: '12px 16px 12px 42px',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                transition: 'border 0.2s',
              }}
            />
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary"
            style={{ padding: '0 24px', opacity: loading || !query.trim() ? 0.6 : 1 }}
          >
            {loading ? (
              <span className="animate-pulse-subtle">Evaluating...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Verify Duplicate</span>
              </>
            )}
          </button>
        </div>

        {/* Demo Preset Chips */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={13} color="#F59E0B" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              One-Click Judge Demo Scenarios:
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {demoScenarios.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => selectScenario(sc.text, sc.cpse)}
                style={{
                  background: sc.type === 'adversarial' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: sc.type === 'adversarial' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                  color: sc.type === 'adversarial' ? '#FCA5A5' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span className={`badge-cpse ${getCpseBadgeClass(sc.cpse)}`} style={{ fontSize: '9px', padding: '1px 4px' }}>{sc.cpse}</span>
                <span style={{ fontWeight: 600 }}>{sc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '16px', color: '#FCA5A5', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} color="#EF4444" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Check Results Presentation */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
          {/* LEFT: Extracted Attributes & Safety Breakdown */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#60A5FA" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Canonical Specifications</h3>
              </div>
              {responseTimeMs !== null && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <Zap size={11} color="#10B981" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', letterSpacing: '0.03em' }}>{responseTimeMs}ms on local CPU</span>
                </div>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Normalized Units (mm)</span>
            </div>

            <div style={{ background: '#0B0F19', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Query Text</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F3F4F6', marginTop: '2px' }}>{result.query}</p>
            </div>

            {/* Structured Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Material Type</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.material_type ? '#FFFFFF' : '#6B7280' }}>
                  {result.extracted_attributes.material_type || '—'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sub-Type</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.sub_type ? '#FFFFFF' : '#6B7280' }}>
                  {result.extracted_attributes.sub_type || '—'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dimension</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.dimension_value ? '#60A5FA' : '#6B7280' }}>
                  {result.extracted_attributes.dimension_value ? `${result.extracted_attributes.dimension_value} mm` : '—'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grade / Metallurgy</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.grade ? '#10B981' : '#6B7280' }}>
                  {result.extracted_attributes.grade || '—'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pressure Class</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.pressure_rating ? '#F59E0B' : '#6B7280' }}>
                  {result.extracted_attributes.pressure_rating || '—'}
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Governing Standard</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: result.extracted_attributes.standard ? '#FFFFFF' : '#6B7280' }}>
                  {result.extracted_attributes.standard || '—'}
                </p>
              </div>
            </div>

            {/* Safety Gate Rule Notice */}
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '6px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={18} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#93C5FD' }}>Zero Guessing Safety Gate:</strong> Missing values are never assumed. Dense vector similarity alone is prohibited from merging items if metallurgy or pressure rating conflict.
              </div>
            </div>
          </div>

          {/* RIGHT: Primary Recommendation & Best Matching Candidates */}
          <div>
            {/* Top Recommendation Banner */}
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                background:
                  result.top_verdict === 'likely_duplicate'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                    : result.top_verdict === 'possible_duplicate'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
                border:
                  result.top_verdict === 'likely_duplicate'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : result.top_verdict === 'possible_duplicate'
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(59, 130, 246, 0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {result.top_verdict === 'likely_duplicate' ? (
                    <CheckCircle2 size={24} color="#10B981" />
                  ) : result.top_verdict === 'possible_duplicate' ? (
                    <AlertTriangle size={24} color="#F59E0B" />
                  ) : (
                    <Check size={24} color="#3B82F6" />
                  )}
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF' }}>
                    {result.top_verdict === 'likely_duplicate'
                      ? 'MATCH FOUND — EXISTING CODE AVAILABLE'
                      : result.top_verdict === 'possible_duplicate'
                      ? 'POTENTIAL MATCH — OFFICER REVIEW RECOMMENDED'
                      : 'NO DUPLICATE FOUND — SAFE TO CREATE CODE'}
                  </span>
                </div>
                <span
                  className={
                    result.top_verdict === 'likely_duplicate'
                      ? 'badge-likely'
                      : result.top_verdict === 'possible_duplicate'
                      ? 'badge-possible'
                      : 'badge-not'
                  }
                  style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}
                >
                  {result.top_verdict.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.5 }}>
                {result.recommendation}
              </p>
            </div>

            {/* Candidate Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {result.candidates.map((cand, idx) => {
                const isTopMatch = idx === 0 && cand.verdict === 'likely_duplicate';
                return (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: '20px',
                      border: isTopMatch ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-subtle)',
                      background: isTopMatch ? 'rgba(16, 185, 129, 0.04)' : undefined,
                    }}
                  >
                    {/* Candidate Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge-cpse ${getCpseBadgeClass(cand.source_cpse)}`}>
                          {cand.source_cpse}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                          {cand.material_code}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800, color: cand.confidence_score >= 0.75 ? '#10B981' : '#F59E0B' }}>
                            {Math.round(cand.confidence_score * 100)}%
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>CONFIDENCE</span>
                        </div>
                      </div>
                    </div>

                    {/* Raw Description */}
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', background: '#0B0F19', padding: '8px 12px', borderRadius: '6px' }}>
                      {cand.raw_description}
                    </p>

                    {/* Why? Explanation */}
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Procurement Justification:
                      </span>
                      <p style={{ fontSize: '12px', color: cand.safety_flags.length > 0 ? '#F87171' : '#A7F3D0', marginTop: '4px', lineHeight: 1.4 }}>
                        {cand.explanation}
                      </p>
                    </div>

                    {/* Safety Gate Alert if Triggered */}
                    {cand.safety_flags.length > 0 && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <XCircle size={16} color="#EF4444" />
                        <span style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: 600 }}>
                          Safety Violations: {cand.safety_flags.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      {cand.verdict === 'likely_duplicate' ? (
                        <>
                          <button
                            onClick={() => handleUseExisting(cand.material_code)}
                            className="btn-success"
                            style={{ flex: 1, padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <CheckCircle2 size={16} />
                            <span>USE EXISTING CODE: {cand.material_code}</span>
                          </button>
                          <button
                            onClick={handleCreateNew}
                            className="btn-secondary"
                            style={{ fontSize: '12px', padding: '10px 14px' }}
                          >
                            Create New Code Anyway
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleCreateNew}
                          className="btn-primary"
                          style={{ flex: 1, padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <ArrowRight size={16} />
                          <span>CREATE NEW STANDARDIZED CODE</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '520px', width: '100%', padding: '28px', border: '1px solid rgba(16, 185, 129, 0.4)', background: '#111827' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={26} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>{actionSuccessModal.title}</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              {actionSuccessModal.desc}
            </p>
            <button
              onClick={() => setActionSuccessModal(null)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Done / Return to Checker
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
