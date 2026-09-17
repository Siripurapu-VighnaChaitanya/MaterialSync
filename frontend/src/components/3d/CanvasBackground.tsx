import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere, MeshDistortMaterial, Grid } from '@react-three/drei';
import * as THREE from 'three';

export const CanvasBackground = () => {
  const group = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);

  // Mouse reactive rotation
  useFrame((state, delta) => {
    if (group.current) {
      // Subtle constant rotation using frame delta
      group.current.rotation.y += delta * 0.05;
      group.current.rotation.x += delta * 0.02;
    }

    if (gridRef.current) {
      // Parallax effect based on mouse position
      const targetX = (state.pointer.x * Math.PI) / 10;
      const targetY = (state.pointer.y * Math.PI) / 10;
      
      // Smooth interpolation towards mouse position
      gridRef.current.rotation.y = THREE.MathUtils.lerp(gridRef.current.rotation.y, targetX, 0.05);
      gridRef.current.rotation.x = THREE.MathUtils.lerp(gridRef.current.rotation.x, -targetY + 1.2, 0.05); // Base tilt of 1.2 rad
    }
  });

  return (
    <>
      <color attach="background" args={['#030509']} />
      <fog attach="fog" args={['#030509', 10, 40]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#FACC15" />
      <pointLight position={[-10, -10, -10]} intensity={1.2} color="#22C55E" />

      <Stars radius={100} depth={50} count={6000} factor={4} saturation={1} fade speed={1.5} />

      {/* Interactive Cyber Grid */}
      <group ref={gridRef} position={[0, -4, -10]}>
        <Grid 
          renderOrder={-1} 
          position={[0, 0, 0]} 
          infiniteGrid 
          fadeDistance={30} 
          fadeStrength={5} 
          cellColor="#10B981" 
          sectionColor="#FACC15" 
          sectionSize={3} 
          cellSize={0.5} 
        />
      </group>

      <group ref={group}>
        {/* Abstract floating data nodes */}
        {Array.from({ length: 15 }).map((_, i) => (
          <Float
            key={i}
            speed={2} 
            rotationIntensity={2} 
            floatIntensity={3}
            position={[
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20 - 15
            ]}
          >
            <Sphere args={[Math.random() * 0.3 + 0.1, 32, 32]}>
              <MeshDistortMaterial 
                color={Math.random() > 0.5 ? '#FACC15' : '#22C55E'}
                transparent
                opacity={0.6}
                distort={0.6}
                speed={3}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
          </Float>
        ))}
      </group>
    </>
  );
};
