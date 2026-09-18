import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid, Float, Edges } from '@react-three/drei';
import * as THREE from 'three';

// ─── 1. UNDULATING NEURAL PLEXUS MESH (MATCHING USER REFERENCE IMAGE) ───
// Organic wavy 3D network sheet with interconnected glowing nodes & traveling data signals
const NeuralPlexusLandscape: React.FC = () => {
  const meshLinesRef = useRef<THREE.LineSegments>(null);
  const nodesInstancedRef = useRef<THREE.InstancedMesh>(null);
  const hotNodesInstancedRef = useRef<THREE.InstancedMesh>(null);
  const pulsesInstancedRef = useRef<THREE.InstancedMesh>(null);

  // Mesh grid dimensions (34 cols x 22 rows = 748 interconnected nodes)
  const COLS = 34;
  const ROWS = 22;
  const TOTAL_NODES = COLS * ROWS;

  // Grid node base coordinates
  const { baseGrid, edges, standardNodeIndices, hotNodeIndices } = useMemo(() => {
    const nodes: { x: number; z: number; phase: number }[] = [];
    const edgeList: [number, number][] = [];
    const hotSet = new Set<number>();

    const xSpan = 38;
    const zSpan = 22;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const u = c / (COLS - 1);
        const v = r / (ROWS - 1);
        const x = (u - 0.5) * xSpan;
        const z = (v - 0.5) * zSpan - 1.5;
        const phase = Math.sin(u * Math.PI * 3) + Math.cos(v * Math.PI * 2);

        nodes.push({ x, z, phase });

        const idx = r * COLS + c;

        // Horizontal connection line
        if (c < COLS - 1) {
          edgeList.push([idx, idx + 1]);
        }
        // Vertical connection line
        if (r < ROWS - 1) {
          edgeList.push([idx, idx + COLS]);
        }
        // Diagonal cross-filaments for organic triangulated plexus (every alternate cell)
        if (c < COLS - 1 && r < ROWS - 1 && (c + r) % 2 === 0) {
          edgeList.push([idx, idx + COLS + 1]);
        }
      }
    }

    // Partition nodes into standard nodes and hot nodes for exact 1-to-1 instance mapping
    const standardIndices: number[] = [];
    const hotIndices: number[] = [];
    for (let i = 0; i < TOTAL_NODES; i++) {
      if ((i * 17 + 7) % 100 < 18) {
        hotIndices.push(i);
      } else {
        standardIndices.push(i);
      }
    }

    return { 
      baseGrid: nodes, 
      edges: edgeList, 
      standardNodeIndices: standardIndices, 
      hotNodeIndices: hotIndices 
    };
  }, []);

  // Pre-allocate Float32Buffers for line positions & vertex coordinates
  const currentPositions = useMemo(() => new Float32Array(TOTAL_NODES * 3), [TOTAL_NODES]);
  const linePositions = useMemo(() => new Float32Array(edges.length * 2 * 3), [edges]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  // Traveling Data Signal Pulses along the neural mesh
  const pulses = useMemo(() => {
    const list: { edgeIdx: number; progress: number; speed: number }[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      list.push({
        edgeIdx: Math.floor(Math.random() * edges.length),
        progress: Math.random(),
        speed: 0.12 + Math.random() * 0.16
      });
    }
    return list;
  }, [edges]);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const zeroMatrix = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  // Guarantee ZERO uninitialized stray instances at (0, 0, 0)
  React.useEffect(() => {
    if (nodesInstancedRef.current) {
      for (let i = 0; i < standardNodeIndices.length; i++) {
        nodesInstancedRef.current.setMatrixAt(i, zeroMatrix);
      }
      nodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
    if (hotNodesInstancedRef.current) {
      for (let i = 0; i < hotNodeIndices.length; i++) {
        hotNodesInstancedRef.current.setMatrixAt(i, zeroMatrix);
      }
      hotNodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [standardNodeIndices.length, hotNodeIndices.length, zeroMatrix]);

  // 60 FPS Autonomous Continuous Harmonic Wave Simulation
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Calculate undulating 3D harmonic wave surface
    for (let i = 0; i < TOTAL_NODES; i++) {
      const node = baseGrid[i];
      const x = node.x;
      const z = node.z;

      // Biological wave formula: gentle ocean of neural synapses
      const wave1 = Math.sin(x * 0.22 + t * 0.55 + node.phase) * 1.35;
      const wave2 = Math.cos(z * 0.26 + t * 0.48) * 1.10;
      const wave3 = Math.sin((x + z) * 0.16 + t * 0.38) * 0.75;
      const y = wave1 + wave2 + wave3 + 1.2;

      currentPositions[i * 3 + 0] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;
    }

    // Update standard cyan nodes (exact 1-to-1 index mapping)
    if (nodesInstancedRef.current) {
      for (let s = 0; s < standardNodeIndices.length; s++) {
        const idx = standardNodeIndices[s];
        const px = currentPositions[idx * 3 + 0];
        const py = currentPositions[idx * 3 + 1];
        const pz = currentPositions[idx * 3 + 2];
        tempMatrix.makeScale(0.038, 0.038, 0.038);
        tempMatrix.setPosition(px, py, pz);
        nodesInstancedRef.current.setMatrixAt(s, tempMatrix);
      }
      nodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update hot golden-white super nodes (exact 1-to-1 index mapping)
    if (hotNodesInstancedRef.current) {
      for (let h = 0; h < hotNodeIndices.length; h++) {
        const idx = hotNodeIndices[h];
        const px = currentPositions[idx * 3 + 0];
        const py = currentPositions[idx * 3 + 1];
        const pz = currentPositions[idx * 3 + 2];
        tempMatrix.makeScale(0.065, 0.065, 0.065);
        tempMatrix.setPosition(px, py, pz);
        hotNodesInstancedRef.current.setMatrixAt(h, tempMatrix);
      }
      hotNodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Update all line segments connecting vertices
    for (let e = 0; e < edges.length; e++) {
      const [iA, iB] = edges[e];
      const pAx = currentPositions[iA * 3 + 0];
      const pAy = currentPositions[iA * 3 + 1];
      const pAz = currentPositions[iA * 3 + 2];

      const pBx = currentPositions[iB * 3 + 0];
      const pBy = currentPositions[iB * 3 + 1];
      const pBz = currentPositions[iB * 3 + 2];

      const offset = e * 6;
      linePositions[offset + 0] = pAx;
      linePositions[offset + 1] = pAy;
      linePositions[offset + 2] = pAz;

      linePositions[offset + 3] = pBx;
      linePositions[offset + 4] = pBy;
      linePositions[offset + 5] = pBz;
    }

    if (meshLinesRef.current) {
      meshLinesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update traveling data impulses along the mesh edges
    if (pulsesInstancedRef.current) {
      for (let p = 0; p < pulses.length; p++) {
        const pulse = pulses[p];
        pulse.progress += delta * pulse.speed;

        if (pulse.progress > 1.0) {
          pulse.progress = 0.0;
          pulse.edgeIdx = Math.floor(Math.random() * edges.length);
        }

        const [iA, iB] = edges[pulse.edgeIdx];
        const pAx = currentPositions[iA * 3 + 0];
        const pAy = currentPositions[iA * 3 + 1];
        const pAz = currentPositions[iA * 3 + 2];

        const pBx = currentPositions[iB * 3 + 0];
        const pBy = currentPositions[iB * 3 + 1];
        const pBz = currentPositions[iB * 3 + 2];

        tempVec.set(
          pAx + (pBx - pAx) * pulse.progress,
          pAy + (pBy - pAy) * pulse.progress,
          pAz + (pBz - pAz) * pulse.progress
        );

        const pulseScale = 0.08 + Math.sin(pulse.progress * Math.PI) * 0.04;
        tempMatrix.makeScale(pulseScale, pulseScale, pulseScale);
        tempMatrix.setPosition(tempVec);
        pulsesInstancedRef.current.setMatrixAt(p, tempMatrix);
      }
      pulsesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    // Elevated wave network positioned across the upper-mid space
    <group position={[0, 0.8, -4.8]} rotation={[-0.22, 0, 0]}>
      {/* ─── Glowing Plexus Filaments (Rich Teal/Emerald for high contrast on light bg) ─── */}
      <lineSegments ref={meshLinesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#0D9488"
          transparent
          opacity={0.45}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* ─── Standard Network Nodes (Cyan-Emerald) ─── */}
      <instancedMesh
        ref={nodesInstancedRef}
        args={[undefined, undefined, standardNodeIndices.length]}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color="#0284C7"
          transparent
          opacity={0.85}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>

      {/* ─── Glowing Super Nodes (Emerald Accent) ─── */}
      <instancedMesh
        ref={hotNodesInstancedRef}
        args={[undefined, undefined, hotNodeIndices.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#059669"
          transparent
          opacity={0.92}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>

      {/* ─── Traveling Data Signals ─── */}
      <instancedMesh
        ref={pulsesInstancedRef}
        args={[undefined, undefined, pulses.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.95}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>
    </group>
  );
};

// ─── 2. FLOATING HOLOGRAPHIC SQUARE DATA BOXES (THE CUBE LAYER) ───
const FloatingDataCubes: React.FC = () => {
  const cubeConfigs = useMemo(() => [
    { pos: [-9.5, -3.2, -6.5], size: 1.1, rotSpeed: [0.3, 0.4], color: '#10B981' },
    { pos: [-5.8, -2.6, -8.0], size: 0.85, rotSpeed: [-0.25, 0.35], color: '#F59E0B' },
    { pos: [-2.2, -3.4, -6.0], size: 1.25, rotSpeed: [0.2, -0.3], color: '#059669' },
    { pos: [1.2, -3.4, -7.5], size: 0.95, rotSpeed: [-0.3, -0.2], color: '#0284C7' },
    { pos: [7.2, -4.7, -5.2], size: 1.3, rotSpeed: [0.35, 0.25], color: '#10B981' },
    { pos: [13.2, -2.8, -7.2], size: 1.15, rotSpeed: [-0.2, 0.4], color: '#D97706' },
    { pos: [-8.0, -1.8, -12.0], size: 1.4, rotSpeed: [0.15, 0.2], color: '#059669' },
    { pos: [3.6, -4.6, -6.2], size: 1.35, rotSpeed: [-0.18, -0.22], color: '#0284C7' }
  ], []);

  return (
    <group>
      {cubeConfigs.map((cube, idx) => (
        <Float
          key={`data-cube-${idx}`}
          speed={1.5}
          rotationIntensity={1.2}
          floatIntensity={1.8}
          position={cube.pos as [number, number, number]}
        >
          <mesh>
            <boxGeometry args={[cube.size, cube.size, cube.size]} />
            {/* Frosted Crystalline Glass Faces */}
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.15}
              metalness={0.1}
              transparent
              opacity={0.35}
            />
            {/* Glowing Wireframe Square Edges */}
            <Edges
              scale={1.01}
              threshold={15}
              color={cube.color}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

interface CanvasBackgroundProps {
  activeTab?: string;
}

// ─── 3. MASTER CANVAS BACKGROUND (GRID BOXES + FLOATING CUBES + UNDULATING PLEXUS) ───
export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ activeTab = 'home' }) => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);

  // Deep background soft bokeh particles (Depth of Field in Reference Image)
  const bokehField = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyanBio = new THREE.Color('#38BDF8');
    const goldBio = new THREE.Color('#FACC15');
    const blueBio = new THREE.Color('#00D2FF');

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 2] = -5 - Math.random() * 22;

      const r = Math.random();
      const col = r < 0.6 ? cyanBio : r < 0.85 ? goldBio : blueBio;
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // 60 FPS Interactive Mouse Parallax & Smooth Celestial Drift
  useFrame((state) => {
    if (activeTab === 'clusters') return;
    const time = state.clock.elapsedTime;

    // Smooth whole-world tilt & mouse parallax
    if (masterGroupRef.current) {
      const targetRotY = (state.pointer.x * Math.PI) / 32 + Math.sin(time * 0.03) * 0.015;
      const targetRotX = (-state.pointer.y * Math.PI) / 36 + Math.cos(time * 0.025) * 0.012;
      masterGroupRef.current.rotation.y = THREE.MathUtils.lerp(masterGroupRef.current.rotation.y, targetRotY, 0.035);
      masterGroupRef.current.rotation.x = THREE.MathUtils.lerp(masterGroupRef.current.rotation.x, targetRotX, 0.035);
    }

    // Floor Cyber Grid reactive perspective tilt
    if (gridRef.current) {
      const targetX = (state.pointer.x * Math.PI) / 16;
      const targetY = (state.pointer.y * Math.PI) / 18;
      gridRef.current.rotation.y = THREE.MathUtils.lerp(gridRef.current.rotation.y, targetX, 0.04);
      gridRef.current.rotation.x = THREE.MathUtils.lerp(gridRef.current.rotation.x, -targetY + 1.25, 0.04);
    }
  });

  // When on clusters page, restore deep space background atmosphere with celestial stars & nebula lighting
  if (activeTab === 'clusters') {
    return (
      <>
        {/* ─── DEEP CINEMATIC SPACE ATMOSPHERE FOR CLUSTERS PAGE ─── */}
        <color attach="background" args={['#020612']} />
        <fog attach="fog" args={['#020612', 12, 45]} />

        {/* Ambient & Directed Celestial Space Lighting */}
        <ambientLight intensity={0.5} color="#061a28" />
        <directionalLight position={[10, 14, 6]} intensity={1.8} color="#FACC15" />
        <directionalLight position={[-12, -8, -5]} intensity={2.2} color="#00D2FF" />
        <pointLight position={[0, -2, -6]} intensity={3.0} color="#10B981" distance={20} />

        {/* Floating Space Bokeh Stars / Cosmic Dust */}
        <points geometry={bokehField}>
          <pointsMaterial
            size={0.12}
            vertexColors
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </>
    );
  }

  return (
    <>
      {/* ─── SOFT FROST WHITE CYBER ATMOSPHERE ─── */}
      <color attach="background" args={['#F4F7FB']} />
      <fog attach="fog" args={['#F4F7FB', 14, 42]} />

      {/* Daylight & Emerald Ambient/Direct Lighting */}
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[10, 14, 6]} intensity={1.2} color="#D97706" />
      <directionalLight position={[-12, -8, -5]} intensity={1.0} color="#0D9488" />
      <pointLight position={[0, -2, -6]} intensity={1.6} color="#10B981" distance={15} />

      {/* Floating Subtle Ambient Particles */}
      <points geometry={bokehField}>
        <pointsMaterial
          size={0.10}
          vertexColors
          transparent
          opacity={0.35}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Master 3D Transform Group */}
      <group ref={masterGroupRef}>
        
        {/* ─── LOWER BASE LAYER: 3D CYBER CERAMIC GRID ─── */}
        <group ref={gridRef} position={[0, -4.5, -9]}>
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            fadeDistance={34}
            fadeStrength={4.5}
            cellColor="#CBD5E1"
            sectionColor="#10B981"
            sectionSize={3.5}
            cellSize={0.7}
          />
        </group>

        {/* ─── MID LAYER: FLOATING HOLOGRAPHIC SQUARE DATA CUBES ─── */}
        <FloatingDataCubes />

        {/* ─── UPPER LAYER: UNDULATING 3D NEURAL PLEXUS WAVE (REFERENCE IMAGE) ─── */}
        {/* Removed strictly for the 'clusters' network section as requested */}
        {activeTab !== 'clusters' && <NeuralPlexusLandscape />}

      </group>
    </>
  );
};
