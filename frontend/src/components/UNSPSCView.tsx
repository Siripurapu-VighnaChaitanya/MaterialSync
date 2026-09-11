import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Tag,
  Bookmark,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Sparkles,
  Layers,
  Eye,
  Zap,
  ExternalLink,
  Filter,
  Maximize2,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { UNSPSCResult } from '../types';

interface TaxonomyNode {
  id: string;
  code: string;
  title: string;
  level: 'segment' | 'family' | 'class' | 'commodity';
  gemCode?: string;
  cpseCount?: number;
  sampleItems?: string[];
  children?: TaxonomyNode[];
}

const TAXONOMY_TREE: TaxonomyNode[] = [
  {
    id: 'seg-40',
    code: '40000000',
    title: 'Distribution & Conditioning Systems & Equipment',
    level: 'segment',
    cpseCount: 312,
    children: [
      {
        id: 'fam-4014',
        code: '40140000',
        title: 'Fluid & Gas Distribution',
        level: 'family',
        cpseCount: 198,
        children: [
          {
            id: 'cls-401416',
            code: '40141600',
            title: 'Valves & Flow Controls',
            level: 'class',
            cpseCount: 84,
            children: [
              {
                id: 'com-40141611',
                code: '40141611',
                title: 'Gate Valves',
                level: 'commodity',
                gemCode: 'GeM-VALVE-GATE-40141611',
                cpseCount: 38,
                sampleItems: ['GATE VALVE WCB 2 INCH CLASS 150', 'GATE VALVE FORGED STEEL 800# 1/2"']
              },
              {
                id: 'com-40141602',
                code: '40141602',
                title: 'Ball & Plug Valves',
                level: 'commodity',
                gemCode: 'GeM-VALVE-BALL-40141602',
                cpseCount: 26,
                sampleItems: ['BALL VALVE SS316 3-PIECE 1000 WOG 1 INCH', 'BALL VALVE CS CLASS 300 2 INCH']
              },
              {
                id: 'com-40141616',
                code: '40141616',
                title: 'Check Valves (Non-Return)',
                level: 'commodity',
                gemCode: 'GeM-VALVE-CHK-40141616',
                cpseCount: 20,
                sampleItems: ['SWING CHECK VALVE WCB CLASS 150 3 INCH', 'DUAL PLATE CHECK VALVE SS316']
              }
            ]
          },
          {
            id: 'cls-401417',
            code: '40141700',
            title: 'Pipe Fittings & Flanges',
            level: 'class',
            cpseCount: 114,
            children: [
              {
                id: 'com-40141720',
                code: '40141720',
                title: 'Flanges & Blind Plates',
                level: 'commodity',
                gemCode: 'GeM-FIT-FLANGE-40141720',
                cpseCount: 52,
                sampleItems: ['FLANGE WNRF ASTM A105 4 INCH 300#', 'SORF FLANGE SS304 150# 2 INCH']
              },
              {
                id: 'com-40141718',
                code: '40141718',
                title: 'Pipe Elbows, Tees & Reducers',
                level: 'commodity',
                gemCode: 'GeM-FIT-ELBOW-40141718',
                cpseCount: 38,
                sampleItems: ['CS 90 DEG ELBOW ASTM A234 WPB 2 INCH', 'EQUAL TEE SCH 40 ASTM A234 4 INCH']
              },
              {
                id: 'com-40142100',
                code: '40142100',
                title: 'Gaskets & Industrial Seals',
                level: 'commodity',
                gemCode: 'GeM-SEAL-GSKT-40142100',
                cpseCount: 24,
                sampleItems: ['SPIRAL WOUND GASKET SS304 GRAPHITE 2 INCH 150#', 'CAF GASKET 3MM 4 INCH 300#']
              }
            ]
          }
        ]
      },
      {
        id: 'fam-4017',
        code: '40170000',
        title: 'Industrial Pipe & Tubing',
        level: 'family',
        cpseCount: 114,
        children: [
          {
            id: 'cls-401715',
            code: '40171500',
            title: 'Ferrous Metal Pipes & Tubes',
            level: 'class',
            cpseCount: 114,
            children: [
              {
                id: 'com-40171501',
                code: '40171501',
                title: 'Stainless Steel Pipes',
                level: 'commodity',
                gemCode: 'GeM-PIPE-SS-40171501',
                cpseCount: 62,
                sampleItems: ['SS PIPE ASTM A312 TP316 50MM SCH 40S', 'STAINLESS STEEL PIPE 304L 100MM SCH 10S']
              },
              {
                id: 'com-40171512',
                code: '40171512',
                title: 'Carbon Steel Seamless Pipes',
                level: 'commodity',
                gemCode: 'GeM-PIPE-CS-40171512',
                cpseCount: 52,
                sampleItems: ['SS PIPE ASTM A106 GR B 150 MM', 'CS SEAMLESS PIPE A106 GR B 2 INCH SCH 40']
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'seg-31',
    code: '31000000',
    title: 'Manufacturing & Processing Machinery & Hardware',
    level: 'segment',
    cpseCount: 88,
    children: [
      {
        id: 'fam-3116',
        code: '31160000',
        title: 'Hardware & Industrial Fasteners',
        level: 'family',
        cpseCount: 88,
        children: [
          {
            id: 'cls-311616',
            code: '31161600',
            title: 'Bolts, Studs & Fasteners',
            level: 'class',
            cpseCount: 88,
            children: [
              {
                id: 'com-31161601',
                code: '31161601',
                title: 'Stud Bolts with Heavy Hex Nuts',
                level: 'commodity',
                gemCode: 'GeM-FAST-STUD-31161601',
                cpseCount: 54,
                sampleItems: ['STUD BOLT ASTM A193 B7 3/4" X 110MM', 'STUD BOLT ASTM A320 L7 1" X 140MM']
              },
              {
                id: 'com-31161612',
                code: '31161612',
                title: 'Hex Head Cap Screws & Machine Bolts',
                level: 'commodity',
                gemCode: 'GeM-FAST-HEX-31161612',
                cpseCount: 34,
                sampleItems: ['HEX HEAD BOLT HIGH TENSILE M16 X 65MM', 'MACHINE BOLT SS316 M12 X 40MM']
              }
            ]
          }
        ]
      }
    ]
  }
];

export const UNSPSCView: React.FC = () => {
  const [desc, setDesc] = useState('SS PIPE ASTM A312 TP316 50MM SCH 40S');
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<UNSPSCResult | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [is3DMode, setIs3DMode] = useState(true);

  // Keep track of which nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'seg-40': true,
    'fam-4014': true,
    'fam-4017': true,
    'cls-401715': true,
    'cls-401416': false,
    'cls-401417': false,
    'seg-31': false,
  });

  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: TaxonomyNode[]) => {
      nodes.forEach(n => {
        all[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(TAXONOMY_TREE);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleMap = async (textToMap?: string) => {
    const q = textToMap !== undefined ? textToMap : desc;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.mapUNSPSC(q);
      setMapping(res);

      // Auto-expand path in tree based on mapped code
      if (res.unspsc_code) {
        const codePrefix = res.unspsc_code.substring(0, 4);
        if (codePrefix === '4017') {
          setExpandedNodes(prev => ({
            ...prev,
            'seg-40': true,
            'fam-4017': true,
            'cls-401715': true
          }));
        } else if (codePrefix === '4014') {
          setExpandedNodes(prev => ({
            ...prev,
            'seg-40': true,
            'fam-4014': true,
            'cls-401416': true,
            'cls-401417': true
          }));
        } else if (codePrefix === '3116') {
          setExpandedNodes(prev => ({
            ...prev,
            'seg-31': true,
            'fam-3116': true,
            'cls-311616': true
          }));
        }
      }
    } catch (e) {
      console.error('Failed mapping UNSPSC', e);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    { label: 'Stainless Pipe (40171501)', text: 'SS PIPE ASTM A312 TP316 50MM SCH 40S' },
    { label: 'Gate Valve (40141611)', text: 'GATE VALVE WCB 2 INCH CLASS 150' },
    { label: 'WNRF Flange (40141720)', text: 'FLANGE WNRF ASTM A105 4 INCH 300#' },
    { label: 'Spiral Gasket (40142100)', text: 'SPIRAL WOUND GASKET SS304 GRAPHITE 2 INCH 150#' },
    { label: 'Stud Bolt (31161601)', text: 'STUD BOLT ASTM A193 B7 3/4" X 110MM' },
    { label: 'CS Elbow (40141718)', text: 'CS 90 DEG ELBOW ASTM A234 WPB 2 INCH' },
  ];

  // Check if a node matches the mapped code or search query
  const isNodeHighlighted = (node: TaxonomyNode) => {
    if (mapping && mapping.unspsc_code) {
      if (node.code === mapping.unspsc_code) return 'commodity-match';
      if (mapping.unspsc_code.startsWith(node.code.substring(0, 4)) && node.level === 'family') return 'branch-match';
      if (mapping.unspsc_code.startsWith(node.code.substring(0, 2)) && node.level === 'segment') return 'branch-match';
      if (mapping.unspsc_code.startsWith(node.code.substring(0, 6)) && node.level === 'class') return 'branch-match';
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      if (node.title.toLowerCase().includes(q) || node.code.includes(q)) return 'search-match';
    }
    return false;
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <FolderTree size={22} color="#3B82F6" />
            </div>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                Interactive 3D UNSPSC Taxonomy Tree Explorer
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                International 4-tier United Nations Standard Products and Services Code & GeM (Government e-Marketplace) alignment hierarchy.
              </p>
            </div>
          </div>
        </div>

        {/* 3D Perspective Toggle & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              background: is3DMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: is3DMode ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
              color: is3DMode ? '#60A5FA' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Compass size={14} /> {is3DMode ? '3D Isometric View ON' : 'Flat View'}
          </button>
          <button
            onClick={expandAll}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Interactive Classification Sandbox Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '28px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMap()}
              placeholder="Test raw description to trace in 3D taxonomy tree..."
              style={{
                width: '100%',
                background: '#0B0F19',
                border: '1px solid var(--border-bright)',
                borderRadius: '8px',
                padding: '11px 16px 11px 40px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleMap()}
            disabled={loading || !desc.trim()}
            className="btn-primary"
            style={{ padding: '11px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={14} />
            {loading ? 'Classifying in 3D...' : 'Map to UNSPSC'}
          </button>
        </div>

        {/* Preset Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Quick Pre-sets:
          </span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDesc(q.text);
                handleMap(q.text);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: '#93C5FD',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split View: Left = 3D Taxonomy Tree, Right = Active Mapping & Node Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: mapping || selectedNode ? '1.5fr 1fr' : '1fr', gap: '24px' }}>
        {/* The 3D Taxonomy Hierarchy Explorer */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            overflow: 'hidden',
            perspective: is3DMode ? '1200px' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#3B82F6" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                4-Tier Taxonomy Hierarchy Matrix
              </span>
            </div>

            {/* Tree Filter Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Filter size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                placeholder="Filter categories..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0B0F19',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '6px 10px 6px 28px',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Render 3D Perspective Nodes */}
          <div
            style={{
              transform: is3DMode ? 'rotateX(1.5deg) rotateY(-1deg)' : 'none',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.4s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {TAXONOMY_TREE.map((segment) => {
              const segHighlighted = isNodeHighlighted(segment);
              const isSegExpanded = expandedNodes[segment.id];

              return (
                <div
                  key={segment.id}
                  style={{
                    background: segHighlighted ? 'rgba(59, 130, 246, 0.08)' : 'rgba(11, 15, 25, 0.7)',
                    borderRadius: '12px',
                    border: segHighlighted ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: segHighlighted ? '0 0 20px rgba(59, 130, 246, 0.2)' : 'none',
                    padding: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Segment Level Header */}
                  <div
                    onClick={() => toggleNode(segment.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#FFFFFF',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {isSegExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: '#3B82F6', color: '#FFFFFF', fontWeight: 800 }}>
                        SEGMENT {segment.code}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                        {segment.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {segment.cpseCount} CPSE SKUs
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(segment);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: '4px' }}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Families List */}
                  {isSegExpanded && segment.children && (
                    <div style={{ marginTop: '14px', marginLeft: '24px', paddingLeft: '16px', borderLeft: '2px dashed rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {segment.children.map((family) => {
                        const famHighlighted = isNodeHighlighted(family);
                        const isFamExpanded = expandedNodes[family.id];

                        return (
                          <div
                            key={family.id}
                            style={{
                              background: famHighlighted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                              borderRadius: '10px',
                              border: famHighlighted ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.05)',
                              boxShadow: famHighlighted ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                              padding: '12px 14px',
                            }}
                          >
                            {/* Family Header */}
                            <div
                              onClick={() => toggleNode(family.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#FFFFFF',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isFamExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </button>
                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#10B981', color: '#FFFFFF', fontWeight: 700 }}>
                                  FAMILY {family.code}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9' }}>
                                  {family.title}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {family.cpseCount} items
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNode(family);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#34D399', cursor: 'pointer', padding: '2px' }}
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Classes List */}
                            {isFamExpanded && family.children && (
                              <div style={{ marginTop: '10px', marginLeft: '20px', paddingLeft: '14px', borderLeft: '2px dashed rgba(16, 185, 129, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {family.children.map((cls) => {
                                  const clsHighlighted = isNodeHighlighted(cls);
                                  const isClsExpanded = expandedNodes[cls.id];

                                  return (
                                    <div
                                      key={cls.id}
                                      style={{
                                        background: clsHighlighted ? 'rgba(245, 158, 11, 0.1)' : 'rgba(2, 6, 23, 0.7)',
                                        borderRadius: '8px',
                                        border: clsHighlighted ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.04)',
                                        boxShadow: clsHighlighted ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                                        padding: '10px 12px',
                                      }}
                                    >
                                      {/* Class Header */}
                                      <div
                                        onClick={() => toggleNode(cls.id)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <button
                                            style={{
                                              background: 'rgba(255,255,255,0.06)',
                                              border: 'none',
                                              borderRadius: '4px',
                                              color: '#FFFFFF',
                                              padding: '2px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            {isClsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                                          </button>
                                          <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: '#F59E0B', color: '#000000', fontWeight: 800 }}>
                                            CLASS {cls.code}
                                          </span>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                                            {cls.title}
                                          </span>
                                        </div>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedNode(cls);
                                          }}
                                          style={{ background: 'transparent', border: 'none', color: '#FCD34D', cursor: 'pointer', padding: '2px' }}
                                        >
                                          <Eye size={12} />
                                        </button>
                                      </div>

                                      {/* Commodities List */}
                                      {isClsExpanded && cls.children && (
                                        <div style={{ marginTop: '8px', marginLeft: '16px', paddingLeft: '12px', borderLeft: '2px solid rgba(245, 158, 11, 0.25)', display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                                          {cls.children.map((com) => {
                                            const comMatch = isNodeHighlighted(com);
                                            const isTarget = comMatch === 'commodity-match';

                                            return (
                                              <div
                                                key={com.id}
                                                onClick={() => {
                                                  setSelectedNode(com);
                                                  if (com.sampleItems && com.sampleItems.length > 0) {
                                                    setDesc(com.sampleItems[0]);
                                                    handleMap(com.sampleItems[0]);
                                                  }
                                                }}
                                                style={{
                                                  background: isTarget
                                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                                                    : 'rgba(255, 255, 255, 0.02)',
                                                  border: isTarget
                                                    ? '1px solid #10B981'
                                                    : '1px solid rgba(255, 255, 255, 0.05)',
                                                  borderRadius: '6px',
                                                  padding: '8px 10px',
                                                  cursor: 'pointer',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  boxShadow: isTarget ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none',
                                                  transform: isTarget ? 'scale(1.01)' : 'none',
                                                  transition: 'all 0.2s ease'
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                  <Tag size={12} color={isTarget ? '#10B981' : '#60A5FA'} />
                                                  <span style={{ fontSize: '11px', fontWeight: 800, color: isTarget ? '#34D399' : '#60A5FA', fontFamily: 'monospace' }}>
                                                    {com.code}
                                                  </span>
                                                  <span style={{ fontSize: '12px', color: isTarget ? '#FFFFFF' : '#CBD5E1', fontWeight: isTarget ? 700 : 500 }}>
                                                    {com.title}
                                                  </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  {com.gemCode && (
                                                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', fontWeight: 700 }}>
                                                      GeM
                                                    </span>
                                                  )}
                                                  {isTarget && (
                                                    <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', background: '#10B981', color: '#000000', fontWeight: 800 }}>
                                                      MATCH
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Active Mapping & Node Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Classification Card */}
          {mapping ? (
            <div className="glass-panel-glow" style={{ padding: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                    UNSPSC Standard Commodity Code
                  </span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#60A5FA', letterSpacing: '0.04em', marginTop: '2px' }}>
                    {mapping.unspsc_code}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: mapping.confidence >= 0.8 ? '#10B981' : '#F59E0B' }}>
                    {Math.round(mapping.confidence * 100)}%
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Confidence</span>
                </div>
              </div>

              {/* Title & Hierarchy */}
              <div style={{ background: '#0B0F19', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Standardized Commodity Title
                </span>
                <p style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px', marginBottom: '8px' }}>
                  {mapping.unspsc_title}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <strong>Category:</strong> {mapping.commodity_category}
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#93C5FD', fontFamily: 'monospace' }}>
                  <strong>Path:</strong> {mapping.hierarchy}
                </div>
              </div>

              {/* Rationale */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                <strong style={{ color: '#E2E8F0' }}>AI Rationale:</strong> {mapping.mapping_rationale}
              </div>

              {/* GeM Badge */}
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px 14px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bookmark size={15} color="#60A5FA" />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>Government e-Marketplace (GeM)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#93C5FD', fontWeight: 700, fontFamily: 'monospace' }}>
                  Aligned for Central Tender
                </span>
              </div>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Compass size={32} color="#3B82F6" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                Interactive Taxonomy Navigator
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Click any commodity node in the 3D tree or click one of the quick pre-set buttons above to classify an item and view real-time hierarchy tracing.
              </p>
            </div>
          )}

          {/* Node Inspector */}
          {selectedNode && (
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, color: '#3B82F6' }}>
                  Node Inspector ({selectedNode.level})
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#FFFFFF' }}>
                  {selectedNode.code}
                </span>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                {selectedNode.title}
              </h4>

              {selectedNode.gemCode && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <strong>GeM Identifier:</strong> <span style={{ color: '#60A5FA', fontFamily: 'monospace' }}>{selectedNode.gemCode}</span>
                </div>
              )}

              {selectedNode.sampleItems && selectedNode.sampleItems.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Typical Catalog Items:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    {selectedNode.sampleItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setDesc(item);
                          handleMap(item);
                        }}
                        style={{
                          fontSize: '11px',
                          color: '#E2E8F0',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{item}</span>
                        <ArrowRight size={12} color="#60A5FA" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
