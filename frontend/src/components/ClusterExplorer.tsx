import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { api } from '../services/api';
import { ClustersResponse } from '../types';
import { Activity, GitMerge, AlertTriangle, Layers, Maximize, ZoomIn } from 'lucide-react';
import * as THREE from 'three';

export const ClusterExplorer: React.FC = () => {
  const [data, setData] = useState<ClustersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const graphRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.getClusters();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node);
      
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      if (graphRef.current) {
        graphRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
          node, // lookAt ({ x, y, z })
          3000  // ms transition duration
        );
      }
    },
    [graphRef]
  );

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-spin" style={{ color: '#4F8EF7' }}><Activity size={48} /></div>
      </div>
    );
  }

  // Determine colors based on CPSE or Cluster type
  const getNodeColor = (node: any) => {
    const cpseColors: Record<string, string> = {
      IOCL: '#FF6B35',
      ONGC: '#FF4757',
      BPCL: '#4F8EF7',
      GAIL: '#00D68F',
      NTPC: '#A855F7'
    };
    return cpseColors[node.source_cpse] || '#8B96B0';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 70px)' }}>
      {/* 3D Force Graph Container */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}>
        {data && (
          <ForceGraph3D
            ref={graphRef}
            graphData={data.graph}
            nodeLabel="material_code"
            nodeColor={getNodeColor}
            nodeRelSize={6}
            linkColor={(link: any) => link.type === 'positive' ? 'rgba(0, 214, 143, 0.4)' : 'rgba(255, 71, 87, 0.4)'}
            linkWidth={(link: any) => link.type === 'positive' ? 1.5 : 0.5}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            backgroundColor="rgba(0,0,0,0)" // Transparent to see global canvas background
            showNavInfo={false}
          />
        )}
      </div>

      {/* Floating UI Panel (Left) */}
      <div style={{ 
        position: 'absolute', top: '24px', left: '24px', zIndex: 10,
        width: '320px', pointerEvents: 'auto'
      }}>
        <div className="glass-panel-glow" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(79,142,247,0.15)', padding: '8px', borderRadius: '10px' }}>
              <GitMerge size={20} color="#4F8EF7" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F0F4FF' }}>3D Cluster Matrix</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Navigate the multi-CPSE material catalog in 3D space. Spheres represent materials, grouped by AI semantic similarity.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#00D68F' }}>{data?.total_clusters || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>UNIQUE CLUSTERS</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FF' }}>{data?.graph.nodes.length || 0}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL MATERIALS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Detail Inspector (Right) */}
      {selectedNode && (
        <div 
          className="animate-slide-right"
          style={{ 
            position: 'absolute', top: '24px', right: '24px', zIndex: 10,
            width: '340px', pointerEvents: 'auto'
          }}
        >
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(79,142,247,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#4F8EF7" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#7AAEFF', letterSpacing: '0.05em' }}>Node Inspector</span>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#F0F4FF', marginBottom: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
              {selectedNode.material_code}
            </div>
            
            <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', background: getNodeColor(selectedNode) + '30', border: `1px solid ${getNodeColor(selectedNode)}`, color: getNodeColor(selectedNode), fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>
              {selectedNode.source_cpse}
            </div>

            <div style={{ background: '#050810', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>RAW DESCRIPTION</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedNode.raw_description}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
              <GitMerge size={16} color="#00D68F" />
              <span style={{ fontSize: '12px', color: '#00D68F', fontWeight: 600 }}>Cluster ID: {selectedNode.cluster_id}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Controls Hint */}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ZoomIn size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Scroll to Zoom · Click & Drag to Rotate · Click Node to Inspect</span>
        </div>
      </div>
    </div>
  );
};
