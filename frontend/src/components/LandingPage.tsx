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
  const [visibleCount, setVisibleCount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < TERMINAL_SEQUENCE.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 750);
    return () => clearInterval(interval);
  }, []);

  const displayedLines = TERMINAL_SEQUENCE.slice(0, visibleCount);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-panel"
      style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'rgba(9, 18, 16, 0.88)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 0 35px rgba(34, 197, 94, 0.1)',
        fontFamily: 'monospace',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '10px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E' }} />
        <span style={{ fontSize: '11px', color: '#A3E635', marginLeft: 'auto', letterSpacing: '0.05em' }}>neural-engine.sh</span>
      </div>
      {displayedLines.map((line, idx) => {
        const isSuccess = Boolean(line && line.includes("READY"));
        return (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              color: isSuccess ? '#22C55E' : '#FACC15', 
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {line}
          </motion.div>
        );
      })}
      <motion.div 
        animate={visibleCount < TERMINAL_SEQUENCE.length ? { opacity: [1, 0, 1] } : { opacity: 0 }} 
        transition={visibleCount < TERMINAL_SEQUENCE.length ? { repeat: Infinity, duration: 0.8 } : { duration: 0.3 }}
        style={{ width: '8px', height: '16px', background: '#22C55E', display: 'inline-block', marginTop: '4px' }}
      />
    </motion.div>
  );
};

/* ─── MAIN COMPONENT ─── */
export const LandingPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <div style={{ width: '100%', minHeight: '100vh', color: '#F8FAFC', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '0 5%', position: 'relative' }}>
        <div style={{ flex: 1, zIndex: 10, maxWidth: '600px' }}>
          
          {/* Yellow + Green Mix Gradient Title */}
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ 
              fontSize: '4rem', 
              fontWeight: 900, 
              lineHeight: 1.1, 
              marginBottom: '20px', 
              background: 'linear-gradient(135deg, #FDE047 0%, #EAB308 30%, #4ADE80 70%, #22C55E 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            MaterialSync AI
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: '1.25rem', color: '#CBD5E1', marginBottom: '40px', lineHeight: 1.6 }}
          >
            A smart AI platform to <span style={{ color: '#FACC15', fontWeight: 600 }}>find duplicate materials across CPSEs</span> (IOCL, ONGC, BPCL). 
            We automatically match identical items in seconds to <span style={{ color: '#4ADE80', fontWeight: 600 }}>stop duplicate buying and save public funds</span>.
          </motion.p>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '50px' }}>
            {/* Primary Action: High-contrast Yellow-Green Button */}
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(34, 197, 94, 0.45)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('checker')}
              style={{ 
                padding: '15px 30px', 
                background: 'linear-gradient(90deg, #EAB308, #22C55E)', 
                border: 'none', 
                borderRadius: '10px', 
                color: '#050810', 
                fontWeight: 800, 
                fontSize: '1.05rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                boxShadow: '0 4px 20px rgba(234, 179, 8, 0.25)'
              }}
            >
              <Search size={20} color="#050810" strokeWidth={2.5} /> Launch AI Checker
            </motion.button>

            {/* Secondary Action: Yellow/Gold Outline */}
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(250, 204, 21, 0.08)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('analytics')}
              style={{ 
                padding: '15px 30px', 
                background: 'transparent', 
                border: '1px solid rgba(250, 204, 21, 0.5)', 
                borderRadius: '10px', 
                color: '#FACC15', 
                fontWeight: 700, 
                fontSize: '1.05rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px' 
              }}
            >
              <Database size={20} color="#FACC15" /> View Analytics
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

      {/* 2. LIVE SAVINGS TICKER (MARQUEE with Yellow + Green Styling) */}
      <div style={{ background: 'linear-gradient(90deg, rgba(234,179,8,0.08), rgba(34,197,94,0.08))', borderTop: '1px solid rgba(250,204,21,0.12)', borderBottom: '1px solid rgba(34,197,94,0.12)', padding: '15px 0', marginTop: '20px' }}>
        <style>
          {`
            @keyframes marqueeScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .landing-marquee-container {
              display: flex;
              width: 200%;
              animation: marqueeScroll 25s linear infinite;
            }
            .landing-marquee-container:hover {
              animation-play-state: paused;
            }
          `}
        </style>
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div className="landing-marquee-container">
            {[
              "🔥 IOCL Unified 1,240 Materials",
              "🚀 ONGC Saved ₹4.2 Lakhs Today",
              "🧠 AI Confidence Accuracy: 99.8%",
              "⚡ Global Search Speed: 12ms",
              "🛡️ Federated Security: Active",
              "📊 BPCL Capital Unlocked: ₹1.8M",
              "🔗 GAIL Cross-Linked 890 Items",
              "🔥 IOCL Unified 1,240 Materials",
              "🚀 ONGC Saved ₹4.2 Lakhs Today",
              "🧠 AI Confidence Accuracy: 99.8%",
              "⚡ Global Search Speed: 12ms",
              "🛡️ Federated Security: Active",
              "📊 BPCL Capital Unlocked: ₹1.8M",
              "🔗 GAIL Cross-Linked 890 Items"
            ].map((text, idx) => {
              const dotColor = idx % 2 === 0 ? '#FACC15' : '#22C55E';
              return (
                <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', margin: '0 40px', fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', letterSpacing: '0.05em' }}>
                  {text}
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, marginLeft: '15px' }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. APPLE-STYLE SCROLL REVEALS */}
      <section style={{ padding: '100px 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}
          >
            Smarter Procurement. <span style={{ background: 'linear-gradient(90deg, #FACC15, #22C55E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zero Effort.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ color: '#94A3B8', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}
          >
            Experience the world's most advanced NLP and Vector architecture built exclusively for the Indian CPSE ecosystem.
          </motion.p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
          
          {/* Feature Card 1: Emerald / Spring Green */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.18)' }}
            transition={{ duration: 0.5 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(20, 30, 26, 0.5)', border: '1px solid rgba(34, 197, 94, 0.15)', cursor: 'pointer' }}
            onClick={() => onNavigate('checker')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E', marginBottom: '20px' }}>
              <Zap size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>Live AI Checker</h3>
            <p style={{ color: '#94A3B8', lineHeight: 1.6 }}>Instantly validate incoming material requests against the global catalogue. Explainable AI highlights exact attribute mismatches instantly.</p>
          </motion.div>

          {/* Feature Card 2: Golden Amber */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(234, 179, 8, 0.18)' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(30, 32, 22, 0.5)', border: '1px solid rgba(234, 179, 8, 0.15)', cursor: 'pointer' }}
            onClick={() => onNavigate('analytics')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FACC15', marginBottom: '20px' }}>
              <Database size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>Executive Analytics</h3>
            <p style={{ color: '#94A3B8', lineHeight: 1.6 }}>Track total capital unlocked, unified clusters, and AI performance metrics in real-time. Make data-driven procurement decisions.</p>
          </motion.div>

          {/* Feature Card 3: Cyber Lime */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(132, 204, 22, 0.18)' }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-panel"
            style={{ padding: '40px', borderRadius: '24px', background: 'rgba(25, 34, 20, 0.5)', border: '1px solid rgba(132, 204, 22, 0.15)', cursor: 'pointer' }}
            onClick={() => onNavigate('clusters')}
          >
            <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(132, 204, 22, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3E635', marginBottom: '20px' }}>
              <Layers size={30} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '15px' }}>3D Cluster Explorer</h3>
            <p style={{ color: '#94A3B8', lineHeight: 1.6 }}>Visualize the multi-dimensional vector space. Watch as the AI groups similar materials together across different CPSEs.</p>
          </motion.div>

        </div>
      </section>

      {/* FOOTER PUSH */}
      <div style={{ height: '100px' }} />
    </div>
  );
};
