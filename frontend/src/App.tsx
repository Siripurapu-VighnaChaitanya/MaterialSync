import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveChecker } from './components/LiveChecker';
import { ClusterExplorer } from './components/ClusterExplorer';
import { ReviewQueue } from './components/ReviewQueue';
import { AnalyticsView } from './components/AnalyticsView';
import { UNSPSCView } from './components/UNSPSCView';
import { DemoGuideModal } from './components/DemoGuideModal';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('checker');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [indexedMaterials, setIndexedMaterials] = useState(456);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.checkHealth();
      setIsBackendOnline(res.status === 'healthy');
      if (res.indexed_materials) setIndexedMaterials(res.indexed_materials);
    } catch {
      setIsBackendOnline(false);
    }
  };

  const handleSelectDemoStep = (stepNumber: number) => {
    if (stepNumber === 1 || stepNumber === 2 || stepNumber === 5) {
      setActiveTab('clusters');
    } else if (stepNumber === 10) {
      setActiveTab('analytics');
    } else {
      setActiveTab('checker');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        indexedMaterials={indexedMaterials}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
      />

      {/* Main Content Sections */}
      <main style={{ flex: 1 }}>
        {activeTab === 'checker' && (
          <LiveChecker
            onCodeReused={(code) => {
              console.log(`Reused material code: ${code}`);
            }}
          />
        )}

        {activeTab === 'clusters' && <ClusterExplorer />}

        {activeTab === 'review' && <ReviewQueue />}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'unspsc' && <UNSPSCView />}
      </main>

      {/* Demo Guide Modal */}
      {isDemoGuideOpen && (
        <DemoGuideModal
          onClose={() => setIsDemoGuideOpen(false)}
          onSelectStep={handleSelectDemoStep}
        />
      )}

      {/* Corporate CPSE & SIH Footer */}
      <footer
        style={{
          background: '#070A10',
          borderTop: '1px solid var(--border-subtle)',
          padding: '32px 24px',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>MatCode</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— Smart India Hackathon 2026 Prototype (SIH26099)</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              AI-Driven Standardization and Harmonization of Material Codes Across Indian CPSEs.
            </p>
          </div>

          {/* CPSE Logos Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Participating CPSEs:</span>
            {['IOCL', 'ONGC', 'BPCL', 'GAIL'].map((cpse) => (
              <span
                key={cpse}
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#D1D5DB',
                }}
              >
                {cpse}
              </span>
            ))}
          </div>

          {/* Open Source / ₹0 Stack Badge */}
          <div style={{ fontSize: '11px', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)', fontWeight: 600 }}>
            100% Free & Open-Source Stack • Zero Paid APIs • Local CPU Inference
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
