import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Download, 
  Layers, 
  AlertTriangle,
  Sparkles,
  Clock,
  RefreshCw,
  Search,
  Zap,
  Eye,
  X,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';

/* ─── COMPACT PRESET DATASETS ─── */
const PRESETS = {
  comprehensive: {
    title: 'Benchmark Batch (12)',
    filename: 'multi_cpse_benchmark.csv',
    csv: `material_code,source_cpse,raw_description
SAMPLE-ONGC-001,ONGC,"VALVE, GATE, CAST STEEL A216 WCB, 4"" NOMINAL, API 600 A216 WCB, CLASS 150"
SAMPLE-BPCL-002,BPCL,DN 100 CS WCB VALVE GATE API 600 A216 WCB 150 LBS KOCHI REFY STK
SAMPLE-IOCL-003,IOCL,CARBON STEEL FLANGE WNRF 50NB ASME-B16.5 ASTM A105 150# COMMODITY: PIP-CS
SAMPLE-BPCL-004,BPCL,50 MM CS FLANGE WNRF ASME B16.5 ASTM A105 CLASS 150
SAMPLE-GAIL-005,GAIL,FITITNG - C.S. - CONCENTRIC REDUCER - AA234 WPB - 150 NB - SCH 40 - NCR REGION
SAMPLE-ONGC-006,ONGC,"FITTING, CONCENTRIC REDUCER, CS, 6"" X 4"" NOMINAL, ASTM A234 WPB, SCH 40"
SAMPLE-IOCL-007,IOCL,COMPRESSED NON ASBESTOS GASKET CNAF 1.5MM 4 INCH BS 7531 NON-ASBESTOS 150 LBS
SAMPLE-ONGC-008,ONGC,"GASKET, CNAF 1.5MM, CNAF, 4"" NOMINAL, BS 7531 NON-ASBESTOS, CLASS 150"
SAMPLE-BPCL-009,BPCL,DN 100 CARBON-STL PIPE ASTM A106 GR B SCH 40 PO# 450091
SAMPLE-IOCL-010,IOCL,CS PIPE 100 NB SCH 80 ASTM A106 GR B
SAMPLE-NEW-011,IOCL,INCONEL 625 SUPERALLOY TURBINE SHAFT SLEEVE SPECIALIZED HIGH TEMP COATING
SAMPLE-NEW-012,ONGC,"SUBSEA ROV UMBILICAL TERMINATION ASSEMBLY 5000 PSI HYDRAULIC RATED"`
  },
  refinery: {
    title: 'Refinery Piping & Valves (8)',
    filename: 'refinery_piping.csv',
    csv: `material_code,source_cpse,raw_description
IOCL-VAL-01,IOCL,3 INCH FLANGED GATE VALVE ASTM A216 WCB CLASS 150 TRIM 8
ONGC-VAL-02,ONGC,"VALVE, GATE, CS A216 WCB, 3"" NB, 150#, FLANGED RF, API 600"
BPCL-PIP-03,BPCL,PIPE CS SEAMLESS 2 INCH SCH 40 ASTM A106 GRADE B BEVELLED END
GAIL-PIP-04,GAIL,50 MM NB CARBON STEEL SEAMLESS PIPE ASTM A106 GR B SCHEDULE 40
IOCL-FLG-05,IOCL,FLANGE WELD NECK RAISED FACE 4 INCH 300# ASTM A105 SCH 40
ONGC-FLG-06,ONGC,"FLANGE, WNRF, 100 NB, CLASS 300, ASTM A105, ASME B16.5"
BPCL-GSK-07,BPCL,SPIRAL WOUND GASKET 3 INCH 150 LBS SS316 WITH GRAPHITE FILLER
GAIL-GSK-08,GAIL,GASKET SPIRAL WOUND 80 NB CLASS 150 INNER/OUTER RING SS316`
  },
  safety: {
    title: 'Safety Gate Traps (6)',
    filename: 'safety_traps.csv',
    csv: `material_code,source_cpse,raw_description
TRAP-01,IOCL,GATE VALVE 2 INCH 150# ASTM A216 WCB CAST STEEL
TRAP-02,ONGC,"VALVE GATE 2"" 150# ASTM A351 CF8M STAINLESS STEEL 316"
TRAP-03,BPCL,SEAMLESS PIPE 4 INCH SCH 40 ASTM A106 GR B CARBON STEEL
TRAP-04,GAIL,SEAMLESS PIPE 4 INCH SCH 40 ASTM A312 TP304L STAINLESS STEEL
TRAP-05,IOCL,FLANGE WNRF 2 INCH CLASS 150 ASTM A105
TRAP-06,ONGC,"FLANGE WNRF 2"" CLASS 600 ASTM A105 HIGH PRESSURE"`
  }
};

interface BulkItemResult {
  row: number;
  description: string;
  extracted_type?: string | null;
  extracted_dimension_mm?: number | null;
  extracted_grade?: string | null;
  top_verdict: string;
  top_match_code?: string | null;
  top_match_cpse?: string | null;
  top_confidence?: number | null;
  recommendation: string;
}

interface BulkResponseData {
  total_rows: number;
  processed: number;
  likely_duplicates: number;
  possible_duplicates: number;
  new_materials: number;
  processing_time_ms: number;
  results: BulkItemResult[];
}

export const BulkUploadView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkResponseData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'duplicates' | 'review' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForInspect, setSelectedItemForInspect] = useState<BulkItemResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const executeBulkProcessing = async (targetFile: File) => {
    setIsUploading(true);
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 18));
    }, 160);

    try {
      const data = await api.bulkCheckMaterials(targetFile);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setIsUploading(false);
      }, 300);
    } catch {
      clearInterval(progressInterval);
      setIsUploading(false);
      alert('Failed to process file. Ensure backend is running.');
    }
  };

  const handleLaunchPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    const blob = new Blob([p.csv], { type: 'text/csv' });
    const sampleFile = new File([blob], p.filename, { type: 'text/csv' });
    setFile(sampleFile);
    executeBulkProcessing(sampleFile);
  };

  const handleDownloadHarmonizedReport = () => {
    if (!results?.results) return;
    let csv = "Row,Raw_Description,Type,Dimension_MM,Grade,Verdict,Matched_CPSE,Matched_SKU,Confidence,Recommendation\n";
    results.results.forEach((r) => {
      const desc = `"${(r.description || '').replace(/"/g, '""')}"`;
      const reco = `"${(r.recommendation || '').replace(/"/g, '""')}"`;
      const conf = r.top_confidence != null ? `${(r.top_confidence * 100).toFixed(1)}%` : '0%';
      csv += `${r.row + 1},${desc},${r.extracted_type || 'N/A'},${r.extracted_dimension_mm ?? 'N/A'},${r.extracted_grade || 'N/A'},${r.top_verdict},${r.top_match_cpse || 'N/A'},${r.top_match_code || 'N/A'},${conf},${reco}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MaterialSync_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows = useMemo(() => {
    return (results?.results || []).filter((item) => {
      if (activeFilter === 'duplicates' && item.top_verdict !== 'likely_duplicate') return false;
      if (activeFilter === 'review' && item.top_verdict !== 'possible_duplicate') return false;
      if (activeFilter === 'new' && (item.top_verdict === 'likely_duplicate' || item.top_verdict === 'possible_duplicate')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.description.toLowerCase().includes(q) ||
          (item.extracted_type && item.extracted_type.toLowerCase().includes(q)) ||
          (item.top_match_code && item.top_match_code.toLowerCase().includes(q)) ||
          (item.top_match_cpse && item.top_match_cpse.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [results, activeFilter, searchQuery]);

  const getCpseColor = (cpse?: string | null) => {
    switch (cpse?.toUpperCase()) {
      case 'ONGC': return '#10B981';
      case 'BPCL': return '#0284C7';
      case 'IOCL': return '#F59E0B';
      case 'GAIL': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px' }}>
      
      {/* ─── SLEEK MINIMAL HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)', marginBottom: '10px' }}>
            <Zap size={13} color="#059669" />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              High-Speed Vector Ingestion
            </span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
            Bulk Ingest & Harmonization
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', fontWeight: 600, margin: 0 }}>
            Instantly deduplicate multi-CPSE catalogs using 384D vector embeddings.
          </p>
        </div>

        {/* Preset Quick Chips */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748B' }}>Try Demo:</span>
          {(['comprehensive', 'refinery', 'safety'] as const).map((key) => (
            <button
              key={key}
              onClick={() => !isUploading && handleLaunchPreset(key)}
              disabled={isUploading}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                background: key === 'comprehensive' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#FFFFFF',
                color: key === 'comprehensive' ? '#FFFFFF' : '#0F172A',
                border: key === 'comprehensive' ? 'none' : '1px solid #CBD5E1',
                boxShadow: key === 'comprehensive' ? '0 4px 14px rgba(16,185,129,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {key === 'comprehensive' && <Sparkles size={13} />}
              {PRESETS[key].title}
            </button>
          ))}
        </div>
      </div>

      {/* ─── GORGEOUS MINIMALIST UPLOAD ZONE (WHEN NO RESULTS) ─── */}
      {!results && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDragging ? 'rgba(16,185,129,0.04)' : '#FFFFFF',
            border: isDragging ? '2px dashed #10B981' : '1.5px dashed #CBD5E1',
            borderRadius: '24px',
            padding: '56px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.03)',
            cursor: isUploading ? 'default' : 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) handleFileSelection(e.dataTransfer.files[0]);
          }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />

          {!isUploading ? (
            <div>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: '#059669'
              }}>
                <FileSpreadsheet size={30} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
                {file ? file.name : 'Drop your CPSE catalog CSV here'}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, margin: '0 0 24px 0' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB — Ready to process` : 'Click to browse or choose a quick demo batch above'}
              </p>

              {file && (
                <button
                  onClick={(e) => { e.stopPropagation(); executeBulkProcessing(file); }}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Upload size={16} /> Run Deduplication
                </button>
              )}
            </div>
          ) : (
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                <span>Matching materials in vector space...</span>
                <span style={{ color: '#059669' }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <motion.div 
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #10B981, #059669)', 
                    width: `${progress}%` 
                  }} 
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── SLEEK COMPACT RESULTS VIEW ─── */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          
          {/* Aesthetic Compact KPI Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Ingested</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>{results.total_rows}</div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 2px 8px rgba(16,185,129,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duplicates Found</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669', marginTop: '4px' }}>{results.likely_duplicates}</div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid rgba(217,119,6,0.3)', boxShadow: '0 2px 8px rgba(217,119,6,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Savings</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#D97706', marginTop: '4px' }}>
                ₹{(results.likely_duplicates * 1.25).toFixed(1)} <span style={{ fontSize: '14px', fontWeight: 700 }}>Lakhs</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processing Speed</div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', marginTop: '4px' }}>
                {results.processing_time_ms} <span style={{ fontSize: '14px', fontWeight: 700 }}>ms</span>
              </div>
            </div>
          </div>

          {/* Clean Controls Strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'duplicates', 'review', 'new'] as const).map((filter) => {
                const count = filter === 'all' 
                  ? results.total_rows 
                  : filter === 'duplicates' 
                  ? results.likely_duplicates 
                  : filter === 'review' 
                  ? results.possible_duplicates 
                  : results.new_materials;
                const label = filter === 'all' ? 'All' : filter === 'duplicates' ? 'Duplicates' : filter === 'review' ? 'Review' : 'New SKUs';
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: activeFilter === filter ? '1px solid #0F172A' : '1px solid transparent',
                      background: activeFilter === filter ? '#0F172A' : '#F8FAFC',
                      color: activeFilter === filter ? '#FFFFFF' : '#475569'
                    }}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '180px' }}>
                <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px 6px 28px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '12px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleDownloadHarmonizedReport}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={13} /> Export CSV
              </button>

              <button
                onClick={() => { setResults(null); setFile(null); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} /> New Batch
              </button>
            </div>
          </div>

          {/* ─── ELEGANT DATA GRID ─── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 16px', width: '40px' }}>#</th>
                  <th style={{ padding: '12px 16px' }}>Input Material Description</th>
                  <th style={{ padding: '12px 16px', width: '150px' }}>Classification</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>Verdict</th>
                  <th style={{ padding: '12px 16px', width: '200px' }}>Matched Master SKU</th>
                  <th style={{ padding: '12px 16px', width: '50px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item, idx) => {
                  const isDup = item.top_verdict === 'likely_duplicate';
                  const isReview = item.top_verdict === 'possible_duplicate';

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedItemForInspect(item)}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                    >
                      <td style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 700 }}>{item.row + 1}</td>
                      <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 800 }}>{item.description}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {item.extracted_type ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#0F172A' }}>
                            {item.extracted_type} {item.extracted_dimension_mm ? `• ${item.extracted_dimension_mm}mm` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>General</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: isDup ? 'rgba(16,185,129,0.1)' : isReview ? 'rgba(245,158,11,0.1)' : 'rgba(2,132,199,0.1)',
                          color: isDup ? '#047857' : isReview ? '#B45309' : '#0284C7'
                        }}>
                          {isDup ? '✓ Duplicate' : isReview ? '⚠ Review' : '★ New SKU'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {item.top_match_code ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', background: `${getCpseColor(item.top_match_cpse)}15`, color: getCpseColor(item.top_match_cpse) }}>
                              {item.top_match_cpse}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', color: '#0F172A' }}>
                              {item.top_match_code}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <Eye size={15} color="#64748B" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </motion.div>
      )}

      {/* ─── MINIMAL SPEC INSPECTOR MODAL ─── */}
      <AnimatePresence>
        {selectedItemForInspect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedItemForInspect(null)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Item Details (Row #{selectedItemForInspect.row + 1})
                </h3>
                <button onClick={() => setSelectedItemForInspect(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>

              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
                "{selectedItemForInspect.description}"
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>TYPE</span>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {selectedItemForInspect.extracted_type || '—'}
                  </div>
                </div>
                <div style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>DIMENSION</span>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {selectedItemForInspect.extracted_dimension_mm ? `${selectedItemForInspect.extracted_dimension_mm} mm` : '—'}
                  </div>
                </div>
                <div style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 800 }}>GRADE</span>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                    {selectedItemForInspect.extracted_grade || 'Standard'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '16px', fontSize: '13px', color: '#047857', fontWeight: 700 }}>
                {selectedItemForInspect.recommendation}
              </div>

              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => setSelectedItemForInspect(null)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
