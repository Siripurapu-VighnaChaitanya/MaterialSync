import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, Download, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const BulkUploadView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
    return interval;
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsUploading(true);
    const interval = simulateProgress();
    
    try {
      // Use the new bulk-check API
      const data = await api.bulkCheckMaterials(file);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setIsUploading(false);
      }, 500);
    } catch (e) {
      clearInterval(interval);
      setIsUploading(false);
      alert('Failed to process CSV file.');
    }
  };

  const handleDownload = () => {
    // In a real app, this would download the processed CSV or Excel.
    // For the demo, we generate a simple text blob.
    const content = `Material Code,Raw Description,Canonical Type,Canonical Sub-Type,Canonical Dimension,Verdict,Matched Code,Confidence\n`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Harmonized_Catalog_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 28px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#F0F4FF', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Enterprise Batch Processor
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '680px' }}>
          Upload massive SAP/ERP extracts (.csv) to harmonize descriptions, extract attributes, and find cross-CPSE duplicates in bulk.
        </p>
      </div>

      {!results && (
        <div 
          className={`glass-panel dropzone ${isDragging ? 'active' : ''}`} 
          style={{ padding: '60px 40px', textAlign: 'center', marginBottom: '24px' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', border: '1px solid rgba(79,142,247,0.3)'
          }}>
            <FileSpreadsheet size={32} color="#4F8EF7" />
          </div>
          
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#F0F4FF', marginBottom: '8px' }}>
            {file ? file.name : 'Drag & Drop CSV File'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from your computer'}
          </p>

          {file && !isUploading && (
            <button 
              className="btn-primary animate-fadeInUp" 
              onClick={(e) => { e.stopPropagation(); handleProcess(); }}
              style={{ padding: '12px 32px', fontSize: '15px' }}
            >
              <Upload size={18} /> Begin Bulk Processing
            </button>
          )}

          {isUploading && (
            <div style={{ maxWidth: '400px', margin: '0 auto' }} className="animate-fadeInUp">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#4F8EF7' }}>
                <span>Processing Records...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%`, background: '#4F8EF7', boxShadow: '0 0 10px rgba(79,142,247,0.5)' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {results && (
        <div className="animate-fadeInUp">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Layers size={20} color="#4F8EF7" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Records Processed</h4>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#F0F4FF' }}>{results.total_processed}</div>
            </div>
            
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <CheckCircle2 size={20} color="#00D68F" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duplicates Found</h4>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#00D68F' }}>{results.duplicates_found}</div>
            </div>

            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <ShieldCheck size={20} color="#F7B731" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Interventions</h4>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#F7B731' }}>{results.safety_blocks}</div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
             <div style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              background: 'rgba(0,214,143,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', border: '1px solid rgba(0,214,143,0.3)',
              boxShadow: '0 0 30px rgba(0,214,143,0.2)'
            }}>
              <CheckCircle2 size={32} color="#00D68F" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#F0F4FF', marginBottom: '12px' }}>Batch Harmonization Complete</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
              All records have been parsed, mapped to canonical attributes, and checked against the cross-CPSE database. 
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button className="btn-success" onClick={handleDownload} style={{ padding: '12px 24px' }}>
                <Download size={18} /> Download Cleaned Excel Catalog
              </button>
              <button className="btn-secondary" onClick={() => { setResults(null); setFile(null); setProgress(0); }}>
                Upload Another File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
