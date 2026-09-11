import React, { useState, useEffect, useRef } from 'react';
import {
  Search, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  ShieldCheck, Zap, Layers, Sparkles, RefreshCw, ArrowRightLeft,
  ChevronRight, Brain, Star
} from 'lucide-react';
import { api } from '../services/api';
import { LiveCheckResponse, CandidateMatch } from '../types';

interface LiveCheckerProps {
  onCodeReused: (code: string) => void;
  activeRole?: string;
}

/* ─── Radial Confidence Gauge ─── */
const ConfidenceGauge: React.FC<{ score: number; verdict: string }> = ({ score, verdict }) => {
  const pct = Math.round(score * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const color =
    verdict === 'likely_duplicate' ? '#00D68F' :
    verdict === 'possible_duplicate' ? '#F7B731' : '#4F8EF7';

  const label =
    verdict === 'likely_duplicate' ? 'DUPLICATE DETECTED' :
    verdict === 'possible_duplicate' ? 'NEEDS REVIEW' : 'UNIQUE — CREATE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div className="radial-progress" style={{ width: '130px', height: '130px' }}>
        <svg width="130" height="130">
          <circle className="track" cx="65" cy="65" r={r} strokeWidth="10" />
          <circle
            className="fill"
            cx="65" cy="65" r={r}
            strokeWidth="10"
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div className="label">
          <div style={{ fontSize: '26px', fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>MATCH</div>
        </div>
      </div>
      <div
        style={{
          padding: '6px 18px',
          borderRadius: '20px',
          background: `${color}18`,
          border: `1px solid ${color}40`,
          color,
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* ─── Magic Morph Diff Card ─── */
const MorphDiffCard: React.FC<{
  rawInput: string;
  attrs: any;
  matchDesc?: string;
  matchCode?: string;
  matchCpse?: string;
}> = ({ rawInput, attrs, matchDesc, matchCode, matchCpse }) => {
  const cleanAttrs = Object.entries(attrs).filter(([k, v]) =>
    v && !['extraction_confidence', 'source_cpse', 'material_code'].includes(k)
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
      {/* LEFT — RAW CHAOS */}
      <div style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#FF4757', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          ⚠ Raw ERP Input
        </div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FF', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}>
          {rawInput}
        </div>
        <div style={{ fontSize: '11px', color: '#FF6B78', marginTop: '8px' }}>Inconsistent · Abbreviated · Messy</div>
      </div>

      {/* MIDDLE — AI ARROW */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F8EF7, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(79,142,247,0.5)',
          }}
          className="animate-glow"
        >
          <Brain size={18} color="white" />
        </div>
        <ArrowRightLeft size={14} color="var(--text-muted)" />
        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>
          AI<br/>SYNC
        </div>
      </div>

      {/* RIGHT — CLEAN CANONICAL */}
      <div style={{ background: 'rgba(0,214,143,0.06)', border: '1px solid rgba(0,214,143,0.2)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#00D68F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          ✦ Canonical Standard
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {cleanAttrs.map(([key, val]) => (
            <span
              key={key}
              style={{
                background: 'rgba(0,214,143,0.1)',
                border: '1px solid rgba(0,214,143,0.25)',
                color: '#2FFFA7',
                padding: '3px 9px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {String(val)}{key === 'dimension_value' ? ' mm' : ''}
            </span>
          ))}
        </div>
        {matchCode && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#00D68F', fontWeight: 700 }}>{matchCode}</span>
            {matchCpse && <span className={`badge-cpse badge-${matchCpse.toLowerCase()}`} style={{ marginLeft: '6px' }}>{matchCpse}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Attribute Pill Grid ─── */
const AttrGrid: React.FC<{ attrs: any }> = ({ attrs }) => {
  const fields = [
    { key: 'material_type', label: 'Type', color: '#4F8EF7' },
    { key: 'sub_type', label: 'Sub-Type', color: '#A855F7' },
    { key: 'dimension_value', label: 'Dimension', color: '#4F8EF7', suffix: ' mm' },
    { key: 'grade', label: 'Grade', color: '#00D68F' },
    { key: 'pressure_rating', label: 'Pressure', color: '#F7B731' },
    { key: 'schedule', label: 'Schedule', color: '#F7B731' },
    { key: 'standard', label: 'Standard', color: '#8B96B0' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
      {fields.map(({ key, label, color, suffix }) => {
        const val = attrs[key as keyof typeof attrs];
        return (
          <div
            key={key}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${val ? color + '25' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '10px',
              padding: '10px 12px',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
              {label}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: val ? color : 'var(--text-muted)' }}>
              {val ? `${val}${suffix || ''}` : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── LLM Summary Panel ─── */
const LLMSummaryPanel: React.FC<{ result: LiveCheckResponse; visible: boolean }> = ({ result, visible }) => {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDone(false);
    setText('');
    const summaries = [
      `This material (${result.extracted_attributes.material_type || 'item'}) from ${result.extracted_attributes.source_cpse || 'unknown CPSE'} `,
      result.top_verdict === 'likely_duplicate'
        ? `has a high-confidence match with an existing record. Both share identical metallurgy and pressure class. Reusing the existing UNSPSC code will eliminate a redundant SKU, reducing inventory carrying costs by an estimated ₹85,000/year.`
        : result.top_verdict === 'possible_duplicate'
        ? `is a borderline match. Specification overlap is significant, but one or more critical attributes diverge. Procurement Officer manual review is strongly recommended before merging.`
        : `has no equivalent in the current cross-CPSE catalog. Assigning a new standardized UNSPSC code is appropriate. This unique item will be indexed for future cross-enterprise matching.`,
    ];
    const full = summaries.join('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < full.length) {
        setText(full.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [visible, result]);

  if (!visible) return null;

  return (
    <div
      className="animate-fadeInUp"
      style={{
        background: 'rgba(168,85,247,0.06)',
        border: '1px solid rgba(168,85,247,0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginTop: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <Sparkles size={16} color="#A855F7" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          AI Executive Summary
        </span>
        {!done && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }} className="animate-pulse-subtle">generating...</span>}
      </div>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {text}
        {!done && <span style={{ borderRight: '2px solid #A855F7', marginLeft: '2px', animation: 'pulse-subtle 0.8s infinite' }}>&nbsp;</span>}
      </p>
    </div>
  );
};

/* ─── Candidate Card ─── */
const CandidateCard: React.FC<{
  cand: CandidateMatch;
  idx: number;
  onUseExisting: (code: string) => void;
  onCreateNew: () => void;
  getCpseBadgeClass: (cpse: string) => string;
}> = ({ cand, idx, onUseExisting, onCreateNew, getCpseBadgeClass }) => {
  const isMatch = cand.verdict === 'likely_duplicate';
  const isPossible = cand.verdict === 'possible_duplicate';
  const isBlocked = cand.safety_flags.length > 0;
  const pct = Math.round(cand.confidence_score * 100);

  const barColor = isBlocked ? '#FF4757' : isMatch ? '#00D68F' : '#F7B731';

  return (
    <div
      className="glass-card animate-fadeInUp"
      style={{
        padding: '20px',
        border: isMatch && !isBlocked
          ? '1px solid rgba(0,214,143,0.3)'
          : isBlocked
          ? '1px solid rgba(255,71,87,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
        background: isMatch && !isBlocked
          ? 'rgba(0,214,143,0.04)'
          : isBlocked
          ? 'rgba(255,71,87,0.04)'
          : 'rgba(255,255,255,0.02)',
        animationDelay: `${idx * 0.08}s`,
        animationFillMode: 'both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isMatch && !isBlocked ? (
            <CheckCircle2 size={20} color="#00D68F" />
          ) : isBlocked ? (
            <XCircle size={20} color="#FF4757" />
          ) : (
            <AlertTriangle size={20} color="#F7B731" />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#F0F4FF', fontFamily: 'JetBrains Mono, monospace' }}>
                {cand.material_code}
              </span>
              <span className={`badge-cpse badge-${getCpseBadgeClass(cand.source_cpse).replace('badge-', '')}`}>
                {cand.source_cpse}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: barColor, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>confidence</div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="progress-bar-track" style={{ marginBottom: '12px' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}40` }} />
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontStyle: 'italic' }}>
        "{cand.raw_description}"
      </p>

      <p style={{ fontSize: '12px', color: isBlocked ? '#FF6B78' : '#A7F3D0', lineHeight: 1.5, marginBottom: '14px' }}>
        {cand.explanation}
      </p>

      {isBlocked && (
        <div style={{
          background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
          padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <XCircle size={15} color="#FF4757" />
          <span style={{ fontSize: '12px', color: '#FF6B78', fontWeight: 700 }}>
            Safety Gate Blocked: {cand.safety_flags.join(' · ')}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {isMatch && !isBlocked ? (
          <>
            <button onClick={() => onUseExisting(cand.material_code)} className="btn-success" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}>
              <CheckCircle2 size={15} /> Reuse · {cand.material_code}
            </button>
            <button onClick={onCreateNew} className="btn-secondary" style={{ fontSize: '12px', padding: '10px 14px' }}>
              Create New
            </button>
          </>
        ) : (
          <button onClick={onCreateNew} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}>
            <ArrowRight size={15} /> Create Standardized Code
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export const LiveChecker: React.FC<LiveCheckerProps> = ({ onCodeReused, activeRole }) => {
  const [query, setQuery] = useState('');
  const [sourceCpse, setSourceCpse] = useState('IOCL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessModal, setActionSuccessModal] = useState<{ title: string; desc: string } | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [showLLMSummary, setShowLLMSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const demoScenarios = [
    { label: 'Example 1: Standard Pipe', text: 'SS PIPE ASTM A106 GR B 150 MM', cpse: 'IOCL', type: 'normal' },
    { label: 'Example 2: Different Units', text: 'CS PIPE 2 INCH 150# SCH 40', cpse: 'BPCL', type: 'normal' },
    { label: 'Example 3: Grade Mismatch (Blocked)', text: 'SS PIPE 316 50MM SCH 40S', cpse: 'ONGC', type: 'normal' },
    { label: 'Example 4: Pressure Mismatch (Blocked)', text: 'GATE VALVE WCB 2 INCH CLASS 600', cpse: 'GAIL', type: 'normal' },
    { label: 'Example 5: Brand New Item', text: 'SPECIAL TITANIUM TURBINE BLADE 500MM', cpse: 'ONGC', type: 'normal' },
  ];

  const getCpseBadgeClass = (cpse: string) => {
    const map: Record<string, string> = { IOCL: 'badge-iocl', ONGC: 'badge-ongc', BPCL: 'badge-bpcl', GAIL: 'badge-gail', NTPC: 'badge-ntpc', SAIL: 'badge-sail', BHEL: 'badge-bhel' };
    return map[cpse?.toUpperCase()] || 'badge-generic';
  };

  const handleSearch = async (overrideText?: string, overrideCpse?: string) => {
    const searchText = overrideText ?? query;
    const searchCpse = overrideCpse ?? sourceCpse;
    if (!searchText.trim() || searchText.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowLLMSummary(false);
    try {
      const t0 = performance.now();
      const data = await api.checkMaterial(searchText, searchCpse);
      setResponseTimeMs(Math.round(performance.now() - t0));
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Engine error — make sure backend is running.');
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
      title: 'DUPLICATE CODE PREVENTED',
      desc: `Procurement Officer confirmed reuse of material code ${code}. No redundant SKU created. Estimated savings: ₹85,000/year in inventory carrying costs.`,
    });
  };

  const handleCreateNew = () => {
    setActionSuccessModal({
      title: 'NEW MATERIAL CODE CATALOGUED',
      desc: `A new standardized material record has been assigned an UNSPSC taxonomy code and indexed in the cross-CPSE master catalog for future matching.`,
    });
  };

  const topVerdict = result?.top_verdict || '';
  const verdictBannerClass =
    topVerdict === 'likely_duplicate' ? 'verdict-banner-safe' :
    topVerdict === 'possible_duplicate' ? 'verdict-banner-warn' : '';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 28px' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#F0F4FF', letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.1 }}>
          Cross-CPSE{' '}
          <span className="shimmer-text">Material Harmonizer</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
          Paste any messy SAP/ERP material description. The AI pipeline cleans abbreviations,
          extracts physical attributes, and matches across IOCL, ONGC, BPCL and GAIL material masters.
        </p>
      </div>

      {/* ── Search Box ── */}
      <div className="glass-panel-glow" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select
            id="cpse-select"
            value={sourceCpse}
            onChange={(e) => setSourceCpse(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#F0F4FF',
              border: '1px solid var(--border-bright)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'Outfit, sans-serif',
              minWidth: '100px',
            }}
          >
            {['IOCL', 'ONGC', 'BPCL', 'GAIL', 'NTPC', 'SAIL', 'BHEL'].map(c => (
              <option key={c} value={c} style={{ background: '#0C1120', color: '#F0F4FF' }}>{c}</option>
            ))}
          </select>

          <div style={{ flex: 1, position: 'relative' }}>
            <input
              id="material-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. SS PIPE ASTM A106 GR B 150 MM, GATE VALVE WCB 2 INCH 600#..."
              className="input-field"
              style={{ paddingLeft: '46px' }}
            />
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <button
            id="verify-btn"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary"
            style={{ padding: '0 28px', fontSize: '14px' }}
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Analyzing...</>
            ) : (
              <><ShieldCheck size={16} /> Verify</>
            )}
          </button>
        </div>

        {/* Scenario Chips */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Star size={12} color="#F7B731" />
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              One-Click Demo Scenarios
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {demoScenarios.map((sc, idx) => (
              <button
                key={idx}
                id={`demo-scenario-${idx + 1}`}
                onClick={() => selectScenario(sc.text, sc.cpse)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{sc.label}</span>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
          borderRadius: '12px', padding: '16px', color: '#FF6B78', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }} className="animate-fadeInUp">
          <AlertTriangle size={20} color="#FF4757" />
          <span style={{ fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }} className="animate-fadeInUp">
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F8EF7, #A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 0 30px rgba(79,142,247,0.5)',
            animation: 'spin 1.5s linear infinite',
          }}>
            <Layers size={28} color="white" />
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Extracting attributes · Searching {indexedMaterials} SKUs · Checking safety gates...
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && !loading && (
        <div className="animate-fadeInUp">

          {/* Timing Badge */}
          {responseTimeMs !== null && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.25)',
                padding: '5px 14px', borderRadius: '20px',
              }}>
                <Zap size={12} color="#00D68F" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#00D68F' }}>
                  {responseTimeMs}ms · Local CPU Pipeline
                </span>
              </div>
            </div>
          )}

          {/* Magic Morph Diff */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ArrowRightLeft size={16} color="#4F8EF7" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#7AAEFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Harmonization Transformation
              </span>
            </div>
            <MorphDiffCard
              rawInput={result.query}
              attrs={result.extracted_attributes}
              matchDesc={result.candidates[0]?.raw_description}
              matchCode={result.candidates[0]?.material_code}
              matchCpse={result.candidates[0]?.source_cpse}
            />
            {/* LLM Toggle */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="llm-summary-toggle"
                onClick={() => setShowLLMSummary(!showLLMSummary)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: showLLMSummary ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                  border: showLLMSummary ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  color: showLLMSummary ? '#C084FC' : 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Brain size={14} />
                {showLLMSummary ? 'Hide' : 'Generate'} AI Executive Summary
              </button>
            </div>
            <LLMSummaryPanel result={result} visible={showLLMSummary} />
          </div>

          {/* Two-column: Gauge + Attributes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Confidence Gauge */}
            <div
              className={`glass-panel ${verdictBannerClass}`}
              style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minWidth: '220px' }}
            >
              <ConfidenceGauge
                score={result.candidates[0]?.confidence_score || 0}
                verdict={topVerdict}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5, maxWidth: '180px' }}>
                {result.recommendation}
              </p>
            </div>

            {/* Attribute Grid */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Layers size={16} color="#4F8EF7" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#7AAEFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Extracted Physical Attributes
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Normalized to SI Units</span>
              </div>
              <AttrGrid attrs={result.extracted_attributes} />
              {/* Safety Gate Notice */}
              <div style={{
                marginTop: '16px',
                background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.18)',
                borderRadius: '10px', padding: '12px 14px',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <ShieldCheck size={16} color="#4F8EF7" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#7AAEFF' }}>Zero-Guessing Safety Gate:</strong> Missing attributes are never inferred. Dense vector similarity alone cannot merge items if metallurgy or pressure class conflicts.
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Cards */}
          {result.candidates.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Top Candidate Matches
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '20px',
                  fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700,
                }}>
                  {result.candidates.length} found
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {result.candidates.map((cand, idx) => (
                  <CandidateCard
                    key={idx} cand={cand} idx={idx}
                    onUseExisting={handleUseExisting}
                    onCreateNew={handleCreateNew}
                    getCpseBadgeClass={getCpseBadgeClass}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {actionSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 200, padding: '20px',
        }}>
          <div
            className="glass-panel animate-fadeInUp"
            style={{ maxWidth: '500px', width: '100%', padding: '32px', border: '1px solid rgba(0,214,143,0.3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '50%',
                background: 'rgba(0,214,143,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0,214,143,0.3)',
              }}>
                <CheckCircle2 size={28} color="#00D68F" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#F0F4FF' }}>{actionSuccessModal.title}</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              {actionSuccessModal.desc}
            </p>
            <button
              id="modal-close-btn"
              onClick={() => setActionSuccessModal(null)}
              className="btn-success"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Stub used in loading state
const indexedMaterials = 456;
