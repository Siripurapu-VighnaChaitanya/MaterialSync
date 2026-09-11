import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SpinningShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1, 1]} scale={2}>
      <MeshDistortMaterial
        color="#00D68F"
        emissive="#4F8EF7"
        emissiveIntensity={0.5}
        wireframe={true}
        distort={0.3}
        speed={2}
      />
    </Icosahedron>
  );
};

export const Logo3D = () => {
  return (
    <div style={{ width: '44px', height: '44px', cursor: 'pointer' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 2]} intensity={1} />
        <SpinningShape />
      </Canvas>
    </div>
  );
};
