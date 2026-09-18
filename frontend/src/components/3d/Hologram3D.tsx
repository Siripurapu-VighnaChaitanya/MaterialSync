import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Float, MeshDistortMaterial, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface Hologram3DProps {
  color?: string;
  isMatched?: boolean;
}

export const Hologram3D: React.FC<Hologram3DProps> = ({ color = '#059669', isMatched = true }) => {
  const outerCageRef = useRef<THREE.Mesh>(null);
  const innerSphereRef = useRef<THREE.Mesh>(null);
  const coreStarRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Curated deep, rich, saturated colors (NOT dark/black, NOT washed-out light pastels)
  const primaryColor = isMatched ? '#00C853' : '#D97706';
  const emissiveColor = isMatched ? '#00E676' : '#FF9100';
  const edgeColor = isMatched ? '#00E676' : '#FBBF24';
  const ring1Color = isMatched ? '#00F5D4' : '#FF5400';
  const ring2Color = isMatched ? '#FFD166' : '#9D4EDD';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Organic Breathing Scale Pulse
    const pulse = 1 + Math.sin(t * 2.2) * 0.05;

    // 2. Liquid Inner Ball rotation & breath
    if (innerSphereRef.current) {
      innerSphereRef.current.scale.set(pulse, pulse, pulse);
      innerSphereRef.current.rotation.x = -t * 0.35;
      innerSphereRef.current.rotation.y = -t * 0.45;
    }

    // 3. Central Quantum Core rotation
    if (coreStarRef.current) {
      coreStarRef.current.rotation.y = t * 0.8;
      coreStarRef.current.rotation.z = t * 0.5;
    }

    // 4. Outer Holographic Icosahedron Cage Counter-Rotation
    if (outerCageRef.current) {
      outerCageRef.current.rotation.x = t * 0.25;
      outerCageRef.current.rotation.y = t * 0.35;
    }

    // 5. Dual Orbital Laser Energy Rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.75;
      ring1Ref.current.rotation.y = t * 0.35;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.65;
      ring2Ref.current.rotation.x = t * 0.45;
    }
  });

  return (
    <>
      {/* Dynamic Multi-Point Studio Lighting for Rich Color Saturation */}
      <ambientLight intensity={0.9} />
      {/* Key Light in primary saturated color */}
      <directionalLight position={[4, 5, 4]} intensity={2.8} color={emissiveColor} />
      {/* Cyan Rim Light for high-tech contrast highlight */}
      <pointLight position={[-4, -3, 3]} intensity={2.4} color="#00D2FF" distance={12} />
      {/* Warm Amber Fill Light */}
      <pointLight position={[0, -4, -3]} intensity={2.0} color="#FFB703" distance={10} />
      {/* Central Radiance */}
      <pointLight position={[0, 0, 0]} intensity={3.5} color={emissiveColor} distance={6} />

      <Center>
        <Float speed={2.0} rotationIntensity={0.8} floatIntensity={1.2}>
          <group position={[0, 0, 0]}>
            
            {/* ── 1. Outer Geometric Wireframe Cage (Reduced size to prevent clipping) ── */}
            <mesh ref={outerCageRef}>
              <icosahedronGeometry args={[1.28, 1]} />
              <meshBasicMaterial 
                color={edgeColor} 
                wireframe 
                transparent 
                opacity={0.32} 
              />
              <Edges 
                scale={1.01} 
                threshold={15} 
                color={edgeColor} 
              />
            </mesh>

            {/* ── 2. Orbital Laser Ring 1 (Tilted Emerald/Cyan) ── */}
            <mesh ref={ring1Ref} rotation={[Math.PI / 4, 0, 0]}>
              <torusGeometry args={[0.98, 0.018, 16, 64]} />
              <meshStandardMaterial 
                color={ring1Color} 
                emissive={ring1Color} 
                emissiveIntensity={0.85} 
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>

            {/* ── 3. Orbital Laser Ring 2 (Tilted Warm Gold/Violet) ── */}
            <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
              <torusGeometry args={[1.12, 0.016, 16, 64]} />
              <meshStandardMaterial 
                color={ring2Color} 
                emissive={ring2Color} 
                emissiveIntensity={0.85} 
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>

            {/* ── 4. Inner Liquid Energy Ball (Reduced from 1.2 to 0.75, Rich Vibrant Saturated Colors) ── */}
            <mesh ref={innerSphereRef}>
              <icosahedronGeometry args={[0.75, 4]} />
              <MeshDistortMaterial
                color={primaryColor}
                emissive={emissiveColor}
                emissiveIntensity={0.58}
                roughness={0.14}
                metalness={0.12}
                distort={0.28}
                speed={2.2}
                transparent
                opacity={0.94}
              />
            </mesh>

            {/* ── 5. Center High-Luminance Quantum Star ── */}
            <mesh ref={coreStarRef}>
              <sphereGeometry args={[0.26, 24, 24]} />
              <meshBasicMaterial 
                color="#FFFFFF" 
                transparent 
                opacity={0.88} 
              />
            </mesh>

          </group>
        </Float>
      </Center>
    </>
  );
};
