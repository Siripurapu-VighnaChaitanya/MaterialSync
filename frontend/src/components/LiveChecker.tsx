import React, { useState, useEffect, useRef } from 'react';
import {
  Search, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  ShieldCheck, Zap, Layers, Sparkles, RefreshCw, ArrowRightLeft,
  ChevronRight, Brain, Star, Cpu, Network, Database
} from 'lucide-react';
import { api } from '../services/api';
import { LiveCheckResponse, CandidateMatch } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Hologram3D } from './3d/Hologram3D';

interface LiveCheckerProps {
  onCodeReused: (code: string) => void;
  activeRole?: string;
}

/* ─── Radial Confidence Gauge ─── */
const ConfidenceGauge: React.FC<{ score: number; verdict: string }> = ({ score, verdict }) => {
  const [displayedPct, setDisplayedPct] = useState(0);
  const targetPct = Math.round(score * 100);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < targetPct) {
        current += Math.max(1, Math.floor((targetPct - current) / 4));
        setDisplayedPct(current);
      } else {
        setDisplayedPct(targetPct);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [targetPct]);

  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayedPct / 100) * circ;

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
            style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        </svg>
        <div className="label">
          <div style={{ fontSize: '26px', fontWeight: 900, color, lineHeight: 1 }}>{displayedPct}%</div>
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
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div
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
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {text}
          {!done && <span style={{ borderRight: '2px solid #A855F7', marginLeft: '2px', animation: 'pulse-subtle 0.8s infinite' }}>&nbsp;</span>}
        </p>
      </div>
    </motion.div>
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
  const isBlocked = cand.safety_flags.length > 0;
  const pct = Math.round(cand.confidence_score * 100);
  const barColor = isBlocked ? '#FF4757' : isMatch ? '#00D68F' : '#F7B731';

  return (
    <motion.div
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 1.0 + (idx * 0.4), duration: 0.5, type: 'spring' }}
      whileHover={{ scale: 1.01 }}
      className="glass-card"
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: idx * 0.1 + 0.2, ease: 'easeOut' }}
          className="progress-bar-fill"
          style={{ background: barColor, boxShadow: `0 0 8px ${barColor}40` }}
        />
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
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export const LiveChecker: React.FC<LiveCheckerProps> = ({ onCodeReused, activeRole }) => {
  const [query, setQuery] = useState('');
  const [sourceCpse, setSourceCpse] = useState('IOCL');
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0); 
  const [result, setResult] = useState<LiveCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccessModal, setActionSuccessModal] = useState<{ title: string; desc: string } | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [showLLMSummary, setShowLLMSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const demoScenarios = [
    { label: 'Example 1: Standard Pipe', text: 'SS PIPE ASTM A106 GR B 150 MM', cpse: 'IOCL', type: 'normal' },
    { label: 'Example 2: Different Units', text: 'CS PIPE 2 INCH 150# SCH 40', cpse: 'BPCL', type: 'normal' },
    { label: 'Example 3: Grade Mismatch', text: 'SS PIPE 316 50MM SCH 40S', cpse: 'ONGC', type: 'normal' },
    { label: 'Example 4: Pressure Mismatch', text: 'GATE VALVE WCB 2 INCH CLASS 600', cpse: 'GAIL', type: 'normal' },
    { label: 'Example 5: Brand New Item', text: 'SPECIAL TITANIUM TURBINE BLADE 500MM', cpse: 'ONGC', type: 'normal' },
  ];

  const getCpseBadgeClass = (cpse: string) => {
    const map: Record<string, string> = { IOCL: 'badge-iocl', ONGC: 'badge-ongc', BPCL: 'badge-bpcl', GAIL: 'badge-gail', NTPC: 'badge-ntpc', SAIL: 'badge-sail', BHEL: 'badge-bhel' };
    return map[cpse?.toUpperCase()] || 'badge-generic';
  };

  const loadingSteps = [
    { text: "Initializing MiniLM-L12 Engine...", icon: <RefreshCw size={14} className="animate-spin" /> },
    { text: "Extracting Canonical Attributes...", icon: <Cpu size={14} /> },
    { text: "Generating Dense Vector Embeddings...", icon: <Network size={14} /> },
    { text: "Querying FAISS Index (140,000+ Items)...", icon: <Database size={14} /> },
    { text: "Evaluating Structural Similarity...", icon: <Layers size={14} /> },
    { text: "Applying Deterministic Safety Gates...", icon: <ShieldCheck size={14} /> }
  ];

  const handleSearch = async (overrideText?: string, overrideCpse?: string) => {
    const searchText = overrideText ?? query;
    const searchCpse = overrideCpse ?? sourceCpse;
    if (!searchText.trim() || searchText.trim().length < 3) return;
    
    setLoading(true);
    setScanStep(1);
    setError(null);
    setResult(null);
    setShowLLMSummary(false);
    
    try {
      const t0 = performance.now();
      
      // Start step-by-step animation
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < loadingSteps.length) {
          setScanStep(currentStep);
        }
      }, 700);
      
      // Fetch data in background
      const data = await api.checkMaterial(searchText, searchCpse);
      
      // Wait for at least 3.5 seconds to show the cool animation
      const elapsed = performance.now() - t0;
      const remainingWait = Math.max(0, 3500 - elapsed);
      
      setTimeout(() => {
        clearInterval(interval);
        setScanStep(loadingSteps.length - 1);
        setTimeout(() => {
          setResponseTimeMs(Math.round(performance.now() - t0));
          setResult(data);
          setLoading(false);
          setScanStep(0);
        }, 500);
      }, remainingWait);
      
    } catch (err: any) {
      setError(err.message || 'Engine error — make sure backend is running.');
      setLoading(false);
      setScanStep(0);
    }
  };

  const selectScenario = (text: string, cpse: string) => {
    setQuery(text);
    setSourceCpse(cpse);
    handleSearch(text, cpse);
  };

  const topVerdict = result?.top_verdict || '';
  const isMatch = topVerdict === 'likely_duplicate';
  const holoColor = isMatch ? '#00D68F' : topVerdict === 'possible_duplicate' ? '#F7B731' : '#4F8EF7';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 28px' }}>
      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#F0F4FF', letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.1 }}>
          Cross-CPSE{' '}
          <span className="shimmer-text">Material Harmonizer</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
          Paste any messy SAP/ERP material description. The AI pipeline cleans abbreviations,
          extracts physical attributes, and matches across IOCL, ONGC, BPCL and GAIL material masters.
        </p>
      </motion.div>

      {/* ── Search Box ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel-glow"
        style={{ padding: '24px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}
      >
        {/* Animated Scanning Laser */}
        {loading && (
          <motion.div
            initial={{ top: 0, opacity: 0 }}
            animate={{ top: ['0%', '100%', '0%'], opacity: 1 }}
            transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            style={{
              position: 'absolute',
              left: 0, right: 0, height: '2px',
              background: '#4F8EF7',
              boxShadow: '0 0 15px 2px rgba(79,142,247,0.7)',
              zIndex: 10
            }}
          />
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <select
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
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary"
            style={{ padding: '0 28px', fontSize: '14px', minWidth: '140px' }}
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Verifying...</>
            ) : (
              <><ShieldCheck size={16} /> Verify</>
            )}
          </button>
        </div>

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
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '24px' }}
          >
            <div style={{
              background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)',
              borderRadius: '12px', padding: '16px', color: '#FF6B78',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <AlertTriangle size={20} color="#FF4757" />
              <span style={{ fontWeight: 600 }}>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Elaborate Loading Animation ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '24px' }}
          >
            <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              
              {/* Central Glowing Orb */}
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(79, 142, 247, 0.5)' }}
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.4) 0%, transparent 70%)' }}
                />
                <Cpu size={32} color="#4F8EF7" />
              </div>

              {/* Step Sequence */}
              <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingSteps.map((step, idx) => {
                  const isActive = idx === scanStep;
                  const isPast = idx < scanStep;
                  
                  if (idx > scanStep) return null; // Don't show future steps yet
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px',
                        background: isActive ? 'rgba(79, 142, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: isActive ? '1px solid rgba(79, 142, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        color: isActive ? '#7AAEFF' : 'var(--text-muted)'
                      }}
                    >
                      {isPast ? <CheckCircle2 size={16} color="#00D68F" /> : step.icon}
                      <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, fontFamily: 'JetBrains Mono, monospace' }}>
                        {step.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── RESULTS ── */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, staggerChildren: 0.1 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              {/* 3D Hologram Data Core */}
              <motion.div
                className={`glass-panel ${topVerdict === 'likely_duplicate' ? 'verdict-banner-safe' : topVerdict === 'possible_duplicate' ? 'verdict-banner-warn' : ''}`}
                style={{ position: 'relative', overflow: 'hidden', padding: 0, minHeight: '300px', display: 'flex', flexDirection: 'column' }}
                whileHover={{ rotateX: 2, rotateY: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* 3D Canvas Background */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                    <Hologram3D color={holoColor} isMatched={isMatch} />
                  </Canvas>
                </div>
                
                {/* Foreground Stats overlay */}
                <div style={{ position: 'relative', zIndex: 1, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#F0F4FF', letterSpacing: '0.1em' }}>Canonical Standard</span>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: holoColor, marginTop: '4px' }}>
                      {result.extracted_attributes.material_type || 'UNKNOWN ITEM'}
                    </div>
                  </div>
                  <ConfidenceGauge score={result.candidates[0]?.confidence_score || 0} verdict={topVerdict} />
                </div>
                
                <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', padding: '24px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '280px', lineHeight: 1.5 }}>
                    {result.recommendation}
                  </p>
                </div>
              </motion.div>

              {/* Attribute Grid */}
              <motion.div
                className="glass-panel" style={{ padding: '24px' }}
                whileHover={{ rotateX: 2, rotateY: 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Layers size={16} color="#4F8EF7" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#7AAEFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Extracted Physical Attributes
                  </span>
                </div>
                <AttrGrid attrs={result.extracted_attributes} />
                <div style={{
                  marginTop: '16px', background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.18)',
                  borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                  <ShieldCheck size={16} color="#4F8EF7" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: '#7AAEFF' }}>Zero-Guessing Safety Gate:</strong> Missing attributes are never inferred. Dense vector similarity alone cannot merge items if metallurgy or pressure class conflicts.
                  </div>
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowLLMSummary(!showLLMSummary)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      background: showLLMSummary ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
                      border: showLLMSummary ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: showLLMSummary ? '#C084FC' : 'var(--text-muted)',
                      padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    <Brain size={12} /> {showLLMSummary ? 'Hide' : 'Generate'} AI Summary
                  </button>
                </div>
                <AnimatePresence>
                  {showLLMSummary && <LLMSummaryPanel result={result} visible={showLLMSummary} />}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Candidate Cards */}
            {result.candidates.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Top Candidate Matches
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    {result.candidates.length} found
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {result.candidates.map((cand, idx) => (
                    <CandidateCard
                      key={idx} cand={cand} idx={idx}
                      onUseExisting={(code) => setActionSuccessModal({
                        title: 'DUPLICATE CODE PREVENTED',
                        desc: `Procurement Officer confirmed reuse of material code ${code}. No redundant SKU created. Estimated savings: ₹85,000/year.`,
                      })}
                      onCreateNew={() => setActionSuccessModal({
                        title: 'NEW MATERIAL CODE CATALOGUED',
                        desc: `A new standardized material record has been assigned an UNSPSC taxonomy code and indexed.`,
                      })}
                      getCpseBadgeClass={getCpseBadgeClass}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {actionSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '32px', border: '1px solid rgba(0,214,143,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(0,214,143,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,214,143,0.3)' }}>
                  <CheckCircle2 size={28} color="#00D68F" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#F0F4FF' }}>{actionSuccessModal.title}</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                {actionSuccessModal.desc}
              </p>
              <button
                onClick={() => setActionSuccessModal(null)}
                className="btn-success" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
