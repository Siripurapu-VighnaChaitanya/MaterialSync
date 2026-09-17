import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Navbar } from './components/Navbar';
import { LiveChecker } from './components/LiveChecker';
import { BulkUploadView } from './components/BulkUploadView';
import { ClusterExplorer } from './components/ClusterExplorer';
import { ReviewQueue } from './components/ReviewQueue';
import { AnalyticsView } from './components/AnalyticsView';
import { UNSPSCView } from './components/UNSPSCView';
import { DemoGuideModal } from './components/DemoGuideModal';
import { CanvasBackground } from './components/3d/CanvasBackground';
import { LandingPage } from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';
import { AnimatePresence, motion } from 'framer-motion';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeRole, setActiveRole] = useState('officer');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [indexedMaterials, setIndexedMaterials] = useState(456);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await api.checkHealth();
      setIsBackendOnline(res.status === 'healthy');
      if (res.indexed_materials) setIndexedMaterials(res.indexed_materials);
    } catch {
      setIsBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleSelectDemoStep = (stepNumber: number) => {
    if (stepNumber === 1 || stepNumber === 2 || stepNumber === 5) {
      setActiveTab('checker');
    } else if (stepNumber === 10) {
      setActiveTab('analytics');
    } else {
      setActiveTab('checker');
    }
  };

  return (
    <>
      {/* 3D WebGL Canvas Layer (Background) */}
      <div className="canvas-container">
        <ErrorBoundary fallback={<div style={{ position: 'fixed', inset: 0, background: '#050810' }} />}>
          <Canvas 
            camera={{ position: [0, 0.5, 9.5], fov: 48 }}
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
          >
            <CanvasBackground activeTab={activeTab} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Standard HTML UI Layer (Foreground) */}
      <div className="ui-layer">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isBackendOnline={isBackendOnline}
          indexedMaterials={indexedMaterials}
          onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
          activeRole={activeRole}
          setActiveRole={setActiveRole}
        />

        {/* Main Content Sections */}
        <main style={{ flex: 1, paddingBottom: '40px', position: 'relative' }}>
          <ErrorBoundary onReset={() => setActiveTab('home')}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%' }}
              >
                {activeTab === 'home' && <LandingPage onNavigate={setActiveTab} />}
                {activeTab === 'checker' && (
                  <LiveChecker
                    onCodeReused={(code) => console.log(`Reused material code: ${code}`)}
                    activeRole={activeRole}
                  />
                )}
                
                {activeTab === 'bulk' && <BulkUploadView />}
                {activeTab === 'clusters' && <ClusterExplorer />}
                {activeTab === 'review' && <ReviewQueue />}
                {activeTab === 'analytics' && <AnalyticsView />}
                {activeTab === 'unspsc' && <UNSPSCView />}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>

        {/* Demo Guide Modal */}
        {isDemoGuideOpen && (
          <DemoGuideModal
            onClose={() => setIsDemoGuideOpen(false)}
            onSelectStep={handleSelectDemoStep}
          />
        )}

        {/* Footer */}
        <footer
          style={{
            background: 'rgba(5, 8, 16, 0.7)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '24px 28px',
            marginTop: 'auto',
          }}
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>MaterialSync</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— Smart India Hackathon 2026 Prototype (SIH26099)</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                AI-Driven Standardization and Harmonization of Material Codes Across Indian CPSEs.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Participating CPSEs:</span>
              {['IOCL', 'ONGC', 'BPCL', 'GAIL', 'NTPC', 'SAIL'].map((cpse) => (
                <span
                  key={cpse}
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#A0AEC0',
                  }}
                >
                  {cpse}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
