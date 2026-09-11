import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export const CanvasBackground = () => {
  const group = useRef<THREE.Group>(null);

  // Slowly rotate the entire background
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      group.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <>
      <color attach="background" args={['#050810']} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#4F8EF7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A855F7" />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group ref={group}>
        {/* Abstract floating elements in the background */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Float
            key={i}
            speed={1.5} 
            rotationIntensity={2} 
            floatIntensity={2}
            position={[
              (Math.random() - 0.5) * 40,
              (Math.random() - 0.5) * 40,
              (Math.random() - 0.5) * 40 - 20
            ]}
          >
            <Sphere args={[Math.random() * 0.5 + 0.1, 16, 16]}>
              <MeshDistortMaterial 
                color={Math.random() > 0.5 ? '#4F8EF7' : '#A855F7'}
                transparent
                opacity={0.3}
                distort={0.4}
                speed={2}
              />
            </Sphere>
          </Float>
        ))}
      </group>
    </>
  );
};
