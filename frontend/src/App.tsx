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
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#010612', zIndex: 9999, overflow: 'hidden' }}>
      <ErrorBoundary fallback={<div style={{ position: 'fixed', inset: 0, background: '#010612' }} />}>
        <Canvas 
          camera={{ position: [0, 0, 10], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <CanvasBackground />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};
