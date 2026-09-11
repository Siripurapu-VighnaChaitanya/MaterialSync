import React from 'react';
import { X, CheckCircle2, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';

interface DemoGuideModalProps {
  onClose: () => void;
  onSelectStep: (stepNumber: number) => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ onClose, onSelectStep }) => {
  const steps = [
    {
      step: 1,
      title: 'The National Problem: CPSE Procurement Silos',
      action: 'Show the 4 CPSEs (IOCL, ONGC, BPCL, GAIL) maintaining disjoint material masters for the same physical pipes, valves, and flanges.',
      tab: 'clusters',
    },
    {
      step: 2,
      title: 'The Multi-CPSE Master Catalog',
      action: '456 real procurement descriptions across 6 categories (Pipes, Valves, Flanges, Gaskets, Fasteners, Fittings).',
      tab: 'clusters',
    },
    {
      step: 3,
      title: 'Zero-Guessing Attribute Extraction',
      action: 'All dimensions normalized to millimeters (mm). Technical specifications extracted with field-level confidence ratings.',
      tab: 'checker',
    },
    {
      step: 4,
      title: 'Dense Vector Search + Technical Attribute Gates',
      action: 'Dense embeddings find nearest semantic candidates, but physical attributes act as a mandatory safety gate.',
      tab: 'checker',
    },
    {
      step: 5,
      title: 'Cross-Enterprise Duplicate Cluster Explorer',
      action: 'Inspect Cluster #3: IOCL, ONGC, BPCL, GAIL each using different naming conventions for 2" CS Pipe Sch 40.',
      tab: 'clusters',
    },
    {
      step: 6,
      title: 'Legally Defensible Procurement Explanation',
      action: 'Every decision outputs transparent procurement justifications (Why did they match? Which attributes aligned?).',
      tab: 'checker',
    },
    {
      step: 7,
      title: 'Adversarial Safety Gate Test: Grade 304 vs 316',
      action: 'Click demo scenario #3: High text similarity (95%), but metallurgy mismatch triggers safety gate and rejects merge!',
      tab: 'checker',
    },
    {
      step: 8,
      title: 'LIVE MATERIAL CHECK (SIH Demo Star)',
      action: 'Type new item "SS PIPE ASTM A106 GR B 150 MM" -> Instant live search finds existing IOCL/BPCL code.',
      tab: 'checker',
    },
    {
      step: 9,
      title: 'Click [ USE EXISTING CODE ]',
      action: 'Explain core value proposition: "We prevent a duplicate code BEFORE it is created, saving ERP catalog overhead."',
      tab: 'checker',
    },
    {
      step: 10,
      title: 'Enterprise Impact & Savings Analytics',
      action: 'Show ~69% catalog redundancy reduction, ₹2.67 Cr annual carrying savings, and 100% safety gate success on near-misses.',
      tab: 'analytics',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#111827',
          border: '1px solid rgba(59, 130, 246, 0.4)',
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} color="#F59E0B" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
              SIH 2026 Judge Presentation Playbook
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Steps List */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Follow this recommended chronological demonstration to showcase the complete AI/ML pipeline to hackathon judges:
          </p>

          {steps.map((s) => (
            <div
              key={s.step}
              onClick={() => {
                onSelectStep(s.step);
                onClose();
              }}
              style={{
                background: '#0B0F19',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                transition: 'border 0.2s',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {s.step}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                  {s.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {s.action}
                </p>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" style={{ marginTop: '6px' }} />
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
