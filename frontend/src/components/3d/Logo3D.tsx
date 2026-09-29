import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SpinningShape = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1, 1]} scale={2}>
      <MeshDistortMaterial
        color="#059669"
        emissive="#06B6D4"
        emissiveIntensity={0.8}
        wireframe={true}
        distort={0.25}
        speed={2.2}
      />
    </Icosahedron>
  );
};

export const Logo3D = () => {
  return (
    <div style={{ width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ pointerEvents: 'none' }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 4]} intensity={1.8} color="#06B6D4" />
        <pointLight position={[-3, -3, -2]} intensity={1.2} color="#10B981" />
        <SpinningShape />
      </Canvas>
    </div>
  );
};
