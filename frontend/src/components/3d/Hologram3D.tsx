import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Float, Icosahedron, MeshDistortMaterial, Wireframe, Edges } from '@react-three/drei';
import * as THREE from 'three';

interface Hologram3DProps {
  color?: string;
  isMatched?: boolean;
}

export const Hologram3D: React.FC<Hologram3DProps> = ({ color = '#10B981', isMatched = true }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.4;
      outerRef.current.rotation.y = t * 0.6;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x = -t * 0.2;
      innerRef.current.rotation.y = -t * 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={2} color={color} />
      <pointLight position={[0, 0, 0]} intensity={3} color={color} distance={10} />

      <Center>
        <Float speed={3} rotationIntensity={1} floatIntensity={2}>
          {/* Outer Wireframe Shell */}
          <mesh ref={outerRef}>
            <icosahedronGeometry args={[1.8, 1]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
            <Edges scale={1.05} threshold={15} color={color} />
          </mesh>

          {/* Inner Energy Core */}
          <mesh ref={innerRef}>
            <icosahedronGeometry args={[1.2, 3]} />
            <MeshDistortMaterial
              color={isMatched ? color : '#FACC15'}
              transparent
              opacity={0.8}
              distort={0.4}
              speed={4}
              roughness={0.2}
              metalness={1}
            />
          </mesh>
        </Float>
      </Center>
    </>
  );
};
