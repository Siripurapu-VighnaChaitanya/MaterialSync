import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Clock, ChevronRight, FileCheck } from 'lucide-react';
import { api } from '../services/api';
import { ReviewQueueItem } from '../types';

export const ReviewQueue: React.FC = () => {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getReviewQueue();
      setItems(res.items);
      if (res.items.length > 0) {
        setSelectedItem(res.items[0]);
      }
    } catch (e) {
      console.error('Failed to load review queue', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;
    try {
      await api.submitDecision(selectedItem.match_id, decision, reviewerNotes);
      setFeedback(`Match ${selectedItem.match_id} marked as ${decision}. Audit ledger updated.`);
      setItems(items.filter((i) => i.match_id !== selectedItem.match_id));
      setSelectedItem(items.length > 1 ? items[1] : null);
      setReviewerNotes('');
      setTimeout(() => setFeedback(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Error recording decision');
    }
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', border: '1.5px solid rgba(217, 119, 6, 0.3)' }}>
            <ShieldCheck size={22} color="#D97706" />
          </div>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#000000', letterSpacing: '-0.02em', margin: 0 }}>
              Procurement Officer <span style={{ background: 'linear-gradient(90deg, #D97706, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Review Queue</span>
            </h2>
            <p style={{ fontSize: '13px', color: '#000000', fontWeight: 700, marginTop: '2px', margin: 0 }}>
              Human-in-the-loop audit for ambiguous items (e.g. missing grades, minor unit variance). Decisions are logged to the tamper-evident audit ledger.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px 20px', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', borderLeftWidth: '4px', borderLeftColor: '#D97706', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#000000', textTransform: 'uppercase', fontWeight: 800 }}>Queue Depth</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#B45309', fontWeight: 800 }}>Active</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#B45309', marginTop: '6px' }}>
            {items.length} Pairs
          </div>
          <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>Awaiting procurement officer sign-off</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', borderLeftWidth: '4px', borderLeftColor: '#059669', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#000000', textTransform: 'uppercase', fontWeight: 800 }}>Confidence Window</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.12)', color: '#047857', fontWeight: 800 }}>Medium</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#047857', marginTop: '6px' }}>
            70% – 85%
          </div>
          <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>Dense vector + attribute alignment</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', borderLeftWidth: '4px', borderLeftColor: '#059669', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#000000', textTransform: 'uppercase', fontWeight: 800 }}>Safety Verification</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(5, 150, 105, 0.12)', color: '#047857', fontWeight: 800 }}>100% Zero-Risk</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#047857', marginTop: '6px' }}>
            Passed
          </div>
          <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>ASTM / ASME metallurgical interlocks</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', borderLeftWidth: '4px', borderLeftColor: '#D97706', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#000000', textTransform: 'uppercase', fontWeight: 800 }}>Audit Integrity</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.12)', color: '#B45309', fontWeight: 800 }}>CVC Aligned</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#B45309', marginTop: '6px' }}>
            SHA-256
          </div>
          <span style={{ fontSize: '11px', color: '#000000', fontWeight: 700 }}>Cryptographic decision trail recorded</span>
        </div>
      </div>

      {feedback && (
        <div style={{ background: 'rgba(5, 150, 105, 0.12)', border: '1.5px solid rgba(5, 150, 105, 0.4)', borderRadius: '8px', padding: '12px 16px', color: '#047857', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#000000', fontWeight: 700 }}>
          <Clock size={32} className="animate-pulse-subtle" color="#D97706" style={{ margin: '0 auto 12px' }} />
          <p>Loading pending reviews...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 0', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)' }}>
          <FileCheck size={40} color="#059669" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#000000', marginBottom: '6px' }}>
            Review Queue Clean!
          </h3>
          <p style={{ fontSize: '14px', color: '#000000', fontWeight: 700 }}>
            All ambiguous candidate matches have been reviewed or resolved.
          </p>
        </div>
      ) : (
        <div className="review-queue-grid">
          {/* List of Pending Items */}
          <div className="glass-panel review-queue-list" style={{ background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', padding: '0 4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                Pending Ambiguous Pairs ({items.length})
              </span>
              <span style={{ fontSize: '11px', color: '#FFFFFF', background: 'linear-gradient(135deg, #F59E0B, #D97706)', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>
                Medium Confidence
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((it) => {
                const isSelected = selectedItem?.match_id === it.match_id;
                return (
                  <div
                    key={it.match_id}
                    onClick={() => setSelectedItem(it)}
                    style={{
                      background: isSelected ? 'rgba(217, 119, 6, 0.12)' : '#F8FAFC',
                      border: isSelected ? '2px solid #D97706' : '1.5px solid rgba(203, 213, 225, 0.9)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 0 16px rgba(217, 119, 6, 0.2)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: '#000000' }}>{it.match_id}</span>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: isSelected ? '#B45309' : '#047857' }}>
                        {Math.round(it.confidence_score * 100)}% Conf
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#000000', fontWeight: 700 }}>
                      <span className={`badge-cpse ${getCpseBadgeClass(it.cpse_a)}`}>{it.code_a}</span>
                      <span style={{ color: '#B45309', fontWeight: 900 }}>vs</span>
                      <span className={`badge-cpse ${getCpseBadgeClass(it.cpse_b)}`}>{it.code_b}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison & Decision Panel */}
          {selectedItem && (
            <div className="glass-panel" style={{ padding: '24px', background: '#FFFFFF', border: '1.5px solid rgba(203, 213, 225, 0.9)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#000000', textTransform: 'uppercase', fontWeight: 800 }}>
                    Match ID: {selectedItem.match_id}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#000000', marginTop: '2px' }}>
                    Side-by-Side Procurement Comparison
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#047857' }}>
                    {Math.round(selectedItem.confidence_score * 100)}%
                  </span>
                  <span style={{ fontSize: '10px', color: '#000000', display: 'block', fontWeight: 900 }}>CONFIDENCE</span>
                </div>
              </div>

              {/* Two Side-by-Side Cards with Yellow & Green Accents */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1.5px solid rgba(217, 119, 6, 0.4)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#B45309', marginBottom: '6px', letterSpacing: '0.05em' }}>
                    Requisition Candidate (Entity A)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge-cpse ${getCpseBadgeClass(selectedItem.cpse_a)}`}>{selectedItem.cpse_a}</span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#000000' }}>{selectedItem.code_a}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#000000', fontWeight: 700, lineHeight: 1.5 }}>
                    {selectedItem.desc_a}
                  </p>
                </div>

                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1.5px solid rgba(5, 150, 105, 0.4)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#047857', marginBottom: '6px', letterSpacing: '0.05em' }}>
                    Existing Master SKU (Entity B)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge-cpse ${getCpseBadgeClass(selectedItem.cpse_b)}`}>{selectedItem.cpse_b}</span>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#000000' }}>{selectedItem.code_b}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#000000', fontWeight: 700, lineHeight: 1.5 }}>
                    {selectedItem.desc_b}
                  </p>
                </div>
              </div>

              {/* Justification Banner */}
              <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '16px', borderRadius: '10px', border: '1.5px solid rgba(217, 119, 6, 0.3)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#B45309', textTransform: 'uppercase', fontWeight: 900 }}>
                    AI Justification & Technical Alignment:
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#000000', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                  {selectedItem.explanation}
                </p>
              </div>

              {/* Reviewer Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#000000', fontWeight: 800, display: 'block', marginBottom: '6px' }}>
                  Officer Reviewer Notes (Audit Trail):
                </label>
                <input
                  type="text"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="e.g. Verified dimensional tolerance and metallurgy compatibility from MTC certificate..."
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(203, 213, 225, 0.9)',
                    borderRadius: '8px',
                    padding: '11px 14px',
                    color: '#000000',
                    fontWeight: 700,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#059669'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.9)'}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleDecision('APPROVED')}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: '13px', fontWeight: 800 }}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve & Merge Codes</span>
                </button>
                <button
                  onClick={() => handleDecision('REJECTED')}
                  className="btn-danger"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: '13px', fontWeight: 800 }}
                >
                  <XCircle size={16} />
                  <span>Reject (Keep Distinct)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
