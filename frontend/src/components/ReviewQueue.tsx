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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldCheck size={22} color="#F59E0B" />
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>
            Procurement Officer Review Queue
          </h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Human-in-the-loop review for ambiguous items (e.g. missing grades, minor unit variance). Decisions are logged to the tamper-evident audit ledger.
        </p>
      </div>

      {feedback && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '12px 16px', color: '#6EE7B7', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#10B981" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Clock size={32} className="animate-pulse-subtle" style={{ margin: '0 auto 12px' }} />
          <p>Loading pending reviews...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 0' }}>
          <FileCheck size={40} color="#10B981" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            Review Queue Clean!
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            All ambiguous candidate matches have been reviewed or resolved.
          </p>
        </div>
      ) : (
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
          {/* List of Pending Items */}
          <div className="glass-panel" style={{ padding: '16px', maxHeight: '680px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pending Ambiguous Pairs ({items.length})
              </span>
              <span style={{ fontSize: '11px', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
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
                      background: isSelected ? 'rgba(59, 130, 246, 0.12)' : '#0B0F19',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{it.match_id}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>
                        {Math.round(it.confidence_score * 100)}% Conf
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span className={`badge-cpse ${getCpseBadgeClass(it.cpse_a)}`}>{it.code_a}</span>
                      <span>vs</span>
                      <span className={`badge-cpse ${getCpseBadgeClass(it.cpse_b)}`}>{it.code_b}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison & Decision Panel */}
          {selectedItem && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Match ID: {selectedItem.match_id}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                    Side-by-Side Procurement Comparison
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B' }}>
                    {Math.round(selectedItem.confidence_score * 100)}%
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>CONFIDENCE</span>
                </div>
              </div>

              {/* Two Side-by-Side Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge-cpse ${getCpseBadgeClass(selectedItem.cpse_a)}`}>{selectedItem.cpse_a}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{selectedItem.code_a}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedItem.desc_a}
                  </p>
                </div>

                <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge-cpse ${getCpseBadgeClass(selectedItem.cpse_b)}`}>{selectedItem.cpse_b}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{selectedItem.code_b}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedItem.desc_b}
                  </p>
                </div>
              </div>

              {/* Justification */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  AI Justification & Warning:
                </span>
                <p style={{ fontSize: '13px', color: '#FCD34D', marginTop: '4px', lineHeight: 1.5 }}>
                  {selectedItem.explanation}
                </p>
              </div>

              {/* Reviewer Notes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Officer Reviewer Notes (Audit Trail):
                </label>
                <input
                  type="text"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="e.g. Verified dimensional tolerance and metallurgy compatibility from MTC certificate..."
                  style={{
                    width: '100%',
                    background: '#0B0F19',
                    border: '1px solid var(--border-bright)',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleDecision('APPROVED')}
                  className="btn-success"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve & Merge Codes</span>
                </button>
                <button
                  onClick={() => handleDecision('REJECTED')}
                  className="btn-danger"
                  style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
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
