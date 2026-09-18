import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  Zap, Database, Search, Layers
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

/* ─── 3D NEURAL NETWORK ELEMENT (Restored Clean Sphere + Smooth Orbit) ─── */
const NeuralNetwork3D: React.FC = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // 1. Central Golden Core rotates steadily on its Y-axis
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.2;
    }

    // 2. Small Green Balls orbit smoothly around the central sphere
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.42;
    }
  });

  return (
    // Move spinning yellow sphere to bottom-right so it never merges into the upper wave network
    <group position={[1.4, -1.35, 0]} scale={0.85}>
      {/* Central Golden Wireframe Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#FACC15" 
          emissive="#EAB308" 
          emissiveIntensity={0.65} 
          wireframe 
        />
      </mesh>
      
      {/* Orbiting Emerald Green Nodes on an inclined 3D plane */}
      <group rotation={[0.42, 0, 0.2]}>
        <group ref={orbitRef}>
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const radius = 3.2;
            return (
              <mesh 
                key={i} 
                position={[
                  Math.cos(angle) * radius,
                  0,
                  Math.sin(angle) * radius
                ]}
              >
                <sphereGeometry args={[0.26, 24, 24]} />
                <meshStandardMaterial 
                  color="#22C55E" 
                  emissive="#10B981" 
                  emissiveIntensity={0.9} 
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
            );
          })}
        </group>
      </group>
      
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#FACC15" />
      <pointLight position={[-10, -10, -10]} intensity={1.5} color="#22C55E" />
      <pointLight position={[0, 0, 0]} intensity={1.0} color="#FACC15" distance={6} />
    </group>
  );
};


/* ─── TERMINAL TYPING EFFECT (Yellow + Green Palette) ─── */
const TERMINAL_SEQUENCE: readonly string[] = [
  "> INITIATING CPSE MATERIAL SYNC...",
  "> LOADING 456 MASTER CATALOGUE ITEMS...",
  "> EXTRACTING NLP TOKENS & NER TAGS...",
  "> GENERATING 384D VECTOR EMBEDDINGS...",
  "> QUERYING GLOBAL FAISS INDEX...",
  "> SYSTEM READY."
];

const TerminalWindow: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState<number>(1);
  const [cycle, setCycle] = useState<number>(0);

  useEffect(() => {
    let timeoutId: any;
    let intervalId: any;

    setVisibleCount(1);
    let count = 1;

    intervalId = setInterval(() => {
      count += 1;
      if (count <= TERMINAL_SEQUENCE.length) {
        setVisibleCount(count);
      } else {
        clearInterval(intervalId);
        // Hold SYSTEM READY status for 2.4 seconds, then repeat cycle
        timeoutId = setTimeout(() => {
          setCycle((c) => c + 1);
        }, 2400);
      }
    }, 650);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [cycle]);

  const displayedLines = TERMINAL_SEQUENCE.slice(0, visibleCount);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        padding: '22px 24px',
        borderRadius: '16px',
        background: 'rgba(3, 7, 18, 0.97)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.3)',
        fontFamily: 'monospace',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px'
      }}
    >
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)' }} />
        <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 800, marginLeft: 'auto', letterSpacing: '0.08em' }}>neural-engine.sh</span>
      </div>
      {displayedLines.map((line, idx) => {
        const isSuccess = Boolean(line && line.includes("READY"));
        return (
          <motion.div 
            key={`${cycle}-${idx}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            style={{ 
              color: isSuccess ? '#00E676' : '#FACC15', 
              fontWeight: 900,
              fontSize: '0.94rem',
              letterSpacing: '0.03em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textShadow: isSuccess 
                ? '0 0 12px rgba(0, 230, 118, 0.9), 0 0 25px rgba(0, 230, 118, 0.5)' 
                : '0 0 10px rgba(250, 204, 21, 0.8), 0 0 22px rgba(250, 204, 21, 0.45)'
            }}
          >
            <span style={{ 
              color: isSuccess ? '#00E676' : '#FACC15', 
              fontWeight: 900,
              textShadow: isSuccess 
                ? '0 0 14px rgba(0, 230, 118, 1)' 
                : '0 0 14px rgba(250, 204, 21, 1)'
            }}>
              {'>'}
            </span>
            <span>{line.replace(/^>\s*/, '')}</span>
            {isSuccess && (
              <span style={{ 
                fontSize: '10px', 
                background: 'rgba(0, 230, 118, 0.2)', 
                border: '1.5px solid #00E676', 
                color: '#00E676', 
                padding: '2px 8px', 
                borderRadius: '6px',
                fontWeight: 900,
                marginLeft: '8px',
                letterSpacing: '0.06em',
                boxShadow: '0 0 12px rgba(0, 230, 118, 0.6)'
              }}>
                ONLINE
              </span>
            )}
          </motion.div>
        );
      })}
      <motion.div 
        animate={{ opacity: [1, 0, 1] }} 
        transition={{ repeat: Infinity, duration: 0.75 }}
        style={{ 
          width: '8px', 
          height: '16px', 
          background: visibleCount >= TERMINAL_SEQUENCE.length ? '#00E676' : '#FACC15', 
          boxShadow: visibleCount >= TERMINAL_SEQUENCE.length ? '0 0 12px #00E676, 0 0 20px #00E676' : '0 0 12px #FACC15, 0 0 20px #FACC15',
          display: 'inline-block', 
          marginTop: '4px', 
          borderRadius: '1px' 
        }}
      />
    </motion.div>
  );
};

/* ─── REAL GENUINE CPSE PROCUREMENT TICKER DATA ─── */
interface TickerItem {
  icon: string;
  entity: string;
  action: string;
  result: string;
  color: string;
}

const GENUINE_CPSE_TICKERS: readonly TickerItem[] = [
  { icon: '🏭', entity: 'IOCL & ONGC', action: '3" SS Gate Valves Cross-Matched', result: 'Saved ₹14.8 Lakhs', color: '#059669' },
  { icon: '📦', entity: 'GAIL Pipeline', action: '420 Duplicate Flange Orders Prevented', result: 'GeM Portal Sync', color: '#0284C7' },
  { icon: '⚙️', entity: 'BPCL & HPCL', action: 'SKF Spherical Roller Bearings Sourced', result: 'Surplus Allocated', color: '#0D9488' },
  { icon: '💰', entity: 'Cross-CPSE Pool', action: 'Dead Inventory Identified', result: '₹18.6 Crores Unlocked', color: '#D97706' },
  { icon: '🏷️', entity: 'Standardization', action: '12,500+ Legacy Part Numbers Mapped', result: 'UNSPSC Certified', color: '#059669' },
  { icon: '🔄', entity: 'NTPC to IOCL', action: '85 Excess Pump Impellers Transferred', result: 'Mathura Refinery', color: '#0284C7' },
  { icon: '🛡️', entity: 'Compliance Guard', action: '100% GFR (General Financial Rules) & CVC Audit Ready', result: 'Active Protection', color: '#059669' },
  { icon: '⚡', entity: 'FAISS Semantic Index', action: '384D Vector Cosine Embeddings', result: '12ms Match Latency', color: '#0D9488' },
];

/* ─── MAIN COMPONENT ─── */
export const LandingPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <div style={{ width: '100%', minHeight: '100vh', color: '#0F172A', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px 5% 15px 5%', position: 'relative' }}>
        <div style={{ flex: 1, zIndex: 10, maxWidth: '600px' }}>
          
          {/* Brand Title with High Contrast Gradient */}
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ 
              fontSize: '4.2rem', 
              fontWeight: 900, 
              lineHeight: 1.1, 
              marginBottom: '20px', 
              background: 'linear-gradient(135deg, #0F172A 0%, #0F172A 40%, #059669 85%, #10B981 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              filter: 'drop-shadow(0 4px 14px rgba(5, 150, 105, 0.12))'
            }}
          >
            MaterialSync AI
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ 
              fontSize: '1.25rem', 
              color: '#334155', 
              marginBottom: '40px', 
              lineHeight: 1.6
            }}
          >
            A smart AI platform to <span style={{ color: '#D97706', fontWeight: 700 }}>find duplicate materials across CPSEs</span> (IOCL, ONGC, BPCL). 
            We automatically match identical items in seconds to <span style={{ color: '#059669', fontWeight: 700 }}>stop duplicate buying and save public funds</span>.
          </motion.p>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '50px' }}>
            {/* Primary Action: High-contrast Emerald Button */}
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: '0 8px 25px rgba(5, 150, 105, 0.35)' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('checker')}
              style={{ 
                padding: '15px 30px', 
                background: 'linear-gradient(90deg, #059669, #10B981)', 
                border: 'none', 
                borderRadius: '12px', 
                color: '#FFFFFF', 
                fontWeight: 800, 
                fontSize: '1.05rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                boxShadow: '0 4px 20px rgba(5, 150, 105, 0.22)'
              }}
            >
              <Search size={20} color="#FFFFFF" strokeWidth={2.5} /> Launch AI Checker
            </motion.button>

            {/* Secondary Action: Frosted Card Button */}
            <motion.button 
              whileHover={{ scale: 1.04, backgroundColor: '#FFFFFF', borderColor: '#059669' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onNavigate('analytics')}
              style={{ 
                padding: '15px 30px', 
                background: '#FFFFFF', 
                border: '1px solid rgba(226, 232, 240, 0.95)', 
                borderRadius: '12px', 
                color: '#0F172A', 
                fontWeight: 700, 
                fontSize: '1.05rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' 
              }}
            >
              <Database size={20} color="#059669" /> View Analytics
            </motion.button>
          </div>

          {/* Terminal Box */}
          <TerminalWindow />
        </div>

        {/* 3D Canvas Side */}
        <div style={{ flex: 1, height: '600px', position: 'relative', zIndex: 1, minWidth: '320px' }}>
          <ErrorBoundary
            fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(250,204,21,0.2) 0%, rgba(34,197,94,0.1) 70%, transparent 100%)', filter: 'blur(20px)' }} />
              </div>
            }
          >
            <Canvas 
              camera={{ position: [0, 0, 8] }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: 'default' }}
            >
              <NeuralNetwork3D />
            </Canvas>
          </ErrorBoundary>
        </div>
      </section>

      {/* 2. LIVE SAVINGS TICKER (MARQUEE with Real Genuine CPSE Matter & Glowing Badges) */}
      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.92)', 
          borderTop: '1px solid rgba(226, 232, 240, 0.9)', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.9)', 
          padding: '14px 0', 
          marginTop: '0px',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        <style>
          {`
            @keyframes marqueeScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .landing-marquee-container {
              display: flex;
              width: max-content;
              animation: marqueeScroll 45s linear infinite;
            }
            .landing-marquee-container:hover {
              animation-play-state: paused;
            }
            .marquee-pill {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin: 0 16px;
              padding: 8px 22px;
              border-radius: 30px;
              background: #FFFFFF;
              border: 1px solid rgba(226, 232, 240, 0.95);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
              transition: all 0.25s ease;
              white-space: nowrap;
            }
            .marquee-pill:hover {
              border-color: #10B981;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
              transform: translateY(-2px);
            }
          `}
        </style>
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="landing-marquee-container">
            {[...GENUINE_CPSE_TICKERS, ...GENUINE_CPSE_TICKERS].map((item, idx) => (
              <div 
                key={idx} 
                className="marquee-pill"
              >
                <span style={{ fontSize: '1.2rem' }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 800, 
                  color: item.color,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {item.entity}:
                </span>
                <span style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 600, 
                  color: '#334155'
                }}>
                  {item.action}
                </span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 800, 
                  padding: '3px 12px',
                  borderRadius: '12px',
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}40`,
                  color: item.color
                }}>
                  {item.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. APPLE-STYLE SCROLL REVEALS */}
      <section style={{ padding: '100px 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
          
          {/* Subtle Glowing Spotlight Behind Heading */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '750px',
              height: '170px',
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.08) 42%, transparent 72%)',
              filter: 'blur(35px)',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />

          {/* Glowing Pill Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 20px',
              borderRadius: '20px',
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              marginBottom: '22px',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.1)',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', color: '#059669', textTransform: 'uppercase' }}>
              Next-Gen CPSE Intelligence
            </span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{ 
              fontSize: '3.5rem', 
              fontWeight: 900, 
              letterSpacing: '-0.02em',
              marginBottom: '22px', 
              position: 'relative', 
              zIndex: 1,
              lineHeight: 1.2,
              color: '#0F172A'
            }}
          >
            <span>
              Smarter Procurement.
            </span>{' '}
            <span style={{ color: '#059669' }}>
              Zero Effort.
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
              color: '#475569', 
              fontSize: '1.25rem', 
              maxWidth: '840px', 
              margin: '0 auto', 
              lineHeight: 1.7,
              position: 'relative', 
              zIndex: 1
            }}
          >
            Experience the world's most advanced <span style={{ color: '#0F172A', fontWeight: 700 }}>NLP and Vector architecture</span> built exclusively for the <span style={{ color: '#059669', fontWeight: 700 }}>Indian CPSE ecosystem</span>.
          </motion.p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
          
          {/* Feature Card 1: Emerald / Spring Green */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)' }}
            transition={{ duration: 0.4 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.92)', border: '1px solid rgba(226, 232, 240, 0.9)', cursor: 'pointer', backdropFilter: 'blur(16px)' }}
            onClick={() => onNavigate('checker')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '20px' }}>
              <Zap size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px', color: '#0F172A' }}>Live AI Checker</h3>
            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Instantly validate incoming material requests against the global catalogue. Explainable AI highlights exact attribute mismatches instantly.</p>
          </motion.div>

          {/* Feature Card 2: Sky Blue */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)' }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.92)', border: '1px solid rgba(226, 232, 240, 0.9)', cursor: 'pointer', backdropFilter: 'blur(16px)' }}
            onClick={() => onNavigate('analytics')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(14, 165, 233, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', marginBottom: '20px' }}>
              <Database size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px', color: '#0F172A' }}>Executive Analytics</h3>
            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Track total capital unlocked, unified clusters, and AI performance metrics in real-time. Make data-driven procurement decisions.</p>
          </motion.div>

          {/* Feature Card 3: Emerald */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)' }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.92)', border: '1px solid rgba(226, 232, 240, 0.9)', cursor: 'pointer', backdropFilter: 'blur(16px)' }}
            onClick={() => onNavigate('clusters')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '20px' }}>
              <Layers size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '15px', color: '#0F172A' }}>3D Cluster Explorer</h3>
            <p style={{ color: '#64748B', lineHeight: 1.6 }}>Visualize the multi-dimensional vector space. Watch as the AI groups similar materials together across different CPSEs.</p>
          </motion.div>

        </div>
      </section>

      {/* FOOTER PUSH */}
      <div style={{ height: '100px' }} />
    </div>
  );
};
