import React, { useState, useEffect, useRef } from 'react';
import { GitMerge, Layers, Search, Eye, Filter, CheckCircle2, XCircle, ChevronRight, Grid, Network } from 'lucide-react';
import { api } from '../services/api';
import { ClustersResponse, ClusterGroup, GraphNode } from '../types';

export const ClusterExplorer: React.FC = () => {
  const [data, setData] = useState<ClustersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCpse, setSelectedCpse] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewMode, setActiveViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const res = await api.getClusters();
      setData(res);
      if (res.clusters.length > 0) {
        setSelectedCluster(res.clusters[0]);
      }
    } catch (e) {
      console.error('Failed loading clusters', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter clusters
  const filteredClusters = (data?.clusters || []).filter((c) => {
    const matchCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchCpse = selectedCpse === 'ALL' || c.cpses_involved.includes(selectedCpse);
    const matchSearch =
      !searchQuery.trim() ||
      c.items.some(
        (it) =>
          it.material_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          it.raw_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchCat && matchCpse && matchSearch;
  });

  const getCpseColor = (cpse: string) => {
    switch (cpse?.toUpperCase()) {
      case 'IOCL': return '#F97316';
      case 'ONGC': return '#EF4444';
      case 'BPCL': return '#3B82F6';
      case 'GAIL': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  // Interactive 2D Canvas Visualization
  useEffect(() => {
    if (activeViewMode !== 'graph' || !canvasRef.current || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Filter nodes for the canvas based on category
    const activeNodes: (GraphNode & { vx?: number; vy?: number })[] = data.graph.nodes
      .filter((n) => selectedCategory === 'ALL' || n.category === selectedCategory)
      .slice(0, 80) // Render top 80 nodes for crisp performance
      .map((n, idx) => {
        const angle = (idx / 80) * 2 * Math.PI;
        const radius = 120 + (n.cluster_id % 7) * 28;
        return {
          ...n,
          x: width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
          y: height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
        };
      });

    const nodeMap = new Map(activeNodes.map((n) => [n.id, n]));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Cluster Connection Links
      data.graph.links.forEach((l) => {
        const sourceNode = nodeMap.get(l.source);
        const targetNode = nodeMap.get(l.target);
        if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Update positions and draw nodes
      activeNodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          node.x += node.vx || 0;
          node.y += node.vy || 0;

          // Soft boundary bounce
          if (node.x < 30 || node.x > width - 30) node.vx = -(node.vx || 0);
          if (node.y < 30 || node.y > height - 30) node.vy = -(node.vy || 0);

          const isSelected = selectedNode?.id === node.id;
          const color = getCpseColor(node.source_cpse);

          // Node Halo if selected
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fill();
          }

          // Node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, isSelected ? 8 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = isSelected ? 12 : 6;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Node text label
          ctx.font = '10px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillText(node.source_cpse, node.x + 9, node.y + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Canvas Click Handler
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

      let found: GraphNode | null = null;
      for (const n of activeNodes) {
        if (n.x && n.y) {
          const dist = Math.hypot(n.x - clickX, n.y - clickY);
          if (dist < 15) {
            found = n;
            break;
          }
        }
      }

      if (found) {
        setSelectedNode(found);
        const matchingCluster = data.clusters.find((c) => c.cluster_id === found?.cluster_id);
        if (matchingCluster) setSelectedCluster(matchingCluster);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [activeViewMode, data, selectedCategory, selectedNode]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <GitMerge size={20} color="#60A5FA" />
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF' }}>Cross-CPSE Duplicate Cluster Explorer</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Explore verified duplicate clusters across IOCL, ONGC, BPCL, and GAIL.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: '#111827', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveViewMode('graph')}
            style={{
              background: activeViewMode === 'graph' ? '#2563EB' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Network size={14} />
            <span>Interactive Graph</span>
          </button>
          <button
            onClick={() => setActiveViewMode('table')}
            style={{
              background: activeViewMode === 'table' ? '#2563EB' : 'transparent',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Grid size={14} />
            <span>Table Fallback</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              background: '#0B0F19',
              color: '#FFFFFF',
              border: '1px solid var(--border-bright)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="PIPE">Pipes</option>
            <option value="VALVE">Valves</option>
            <option value="FLANGE">Flanges</option>
            <option value="GASKET">Gaskets</option>
            <option value="FASTENER">Fasteners</option>
            <option value="FITTING">Fittings</option>
          </select>
        </div>

        {/* CPSE Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CPSE:</span>
          <select
            value={selectedCpse}
            onChange={(e) => setSelectedCpse(e.target.value)}
            style={{
              background: '#0B0F19',
              color: '#FFFFFF',
              border: '1px solid var(--border-bright)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="ALL">All Enterprises</option>
            <option value="IOCL">IOCL</option>
            <option value="ONGC">ONGC</option>
            <option value="BPCL">BPCL</option>
            <option value="GAIL">GAIL</option>
          </select>
        </div>

        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Legend:</span>
          {['IOCL', 'ONGC', 'BPCL', 'GAIL'].map((cpse) => (
            <div key={cpse} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCpseColor(cpse) }} />
              <span style={{ fontSize: '11px', color: '#D1D5DB', fontWeight: 600 }}>{cpse}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area: Graph + Side Detail Panel */}
      {activeViewMode === 'graph' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px' }}>
          {/* 2D Canvas Viewport */}
          <div className="glass-panel" style={{ padding: '16px', position: 'relative', minHeight: '560px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Interactive Node Simulation (Click any node to inspect duplicates)
              </span>
              <span style={{ fontSize: '11px', color: '#60A5FA', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Physics Force Simulation Active
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={800}
              height={520}
              style={{
                width: '100%',
                height: '520px',
                borderRadius: '8px',
                background: '#090D16',
                border: '1px solid var(--border-subtle)',
                cursor: 'crosshair',
              }}
            />
          </div>

          {/* Side Inspection Panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            {selectedCluster ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                      Cluster #{selectedCluster.cluster_id}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', borderRadius: '4px', fontWeight: 700 }}>
                      {selectedCluster.category}
                    </span>
                  </div>
                  {selectedCluster.is_deliberate_negative ? (
                    <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      NEAR-MISS TRAP
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      TRUE DUPLICATES
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Found {selectedCluster.items.length} duplicate purchase orders across {selectedCluster.cpses_involved.join(', ')}:
                </p>

                {/* Items in Cluster */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                  {selectedCluster.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#0B0F19',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {it.material_code}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${getCpseColor(it.source_cpse)}22`, color: getCpseColor(it.source_cpse) }}>
                          {it.source_cpse}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {it.raw_description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Harmonization Action */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => alert(`Harmonized cluster #${selectedCluster.cluster_id} to canonical master: ${selectedCluster.items[0].material_code}`)}
                    className="btn-success"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '10px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Consolidate to Single Code</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Eye size={32} style={{ margin: '0 auto 12px' }} />
                <p>Click on any node in the graph to inspect its cluster members.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Table Fallback View */
        <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-bright)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Cluster ID</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>CPSEs Involved</th>
                <th style={{ padding: '12px 16px' }}>Total Duplicate Items</th>
                <th style={{ padding: '12px 16px' }}>Sample Description</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClusters.slice(0, 35).map((cl) => (
                <tr
                  key={cl.cluster_id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onClick={() => setSelectedCluster(cl)}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#60A5FA' }}>
                    #{cl.cluster_id}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#FFFFFF', fontWeight: 600 }}>
                    {cl.category}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {cl.cpses_involved.map((cpse) => (
                        <span
                          key={cpse}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: `${getCpseColor(cpse)}22`,
                            color: getCpseColor(cpse),
                          }}
                        >
                          {cpse}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {cl.total_items} items
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cl.items[0]?.raw_description}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCluster(cl);
                        setActiveViewMode('graph');
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
