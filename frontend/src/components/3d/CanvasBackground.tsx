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
  const { baseGrid, edges, hotNodeIndices } = useMemo(() => {
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

    // Pick 18% prominent "hot nodes" with bright golden-white cores (matching reference photo)
    for (let i = 0; i < TOTAL_NODES; i++) {
      if ((i * 17 + 7) % 100 < 18) {
        hotSet.add(i);
      }
    }

    return { baseGrid: nodes, edges: edgeList, hotNodeIndices: hotSet };
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

  // 60 FPS Autonomous Continuous Harmonic Wave Simulation
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Calculate undulating 3D harmonic wave surface
    for (let i = 0; i < TOTAL_NODES; i++) {
      const node = baseGrid[i];
      const x = node.x;
      const z = node.z;

      // Complex biological wave formula: gentle ocean of neural synapses
      const wave1 = Math.sin(x * 0.22 + t * 0.55 + node.phase) * 1.35;
      const wave2 = Math.cos(z * 0.26 + t * 0.48) * 1.10;
      const wave3 = Math.sin((x + z) * 0.16 + t * 0.38) * 0.75;
      const y = wave1 + wave2 + wave3 + 1.2; // Elevated floating height above grid boxes

      currentPositions[i * 3 + 0] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;

      // Update instanced node spheres
      const isHot = hotNodeIndices.has(i);
      const scale = isHot ? 0.065 : 0.038;
      tempMatrix.makeScale(scale, scale, scale);
      tempMatrix.setPosition(x, y, z);

      if (isHot && hotNodesInstancedRef.current) {
        hotNodesInstancedRef.current.setMatrixAt(i, tempMatrix);
      } else if (nodesInstancedRef.current) {
        nodesInstancedRef.current.setMatrixAt(i, tempMatrix);
      }
    }

    if (nodesInstancedRef.current) nodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    if (hotNodesInstancedRef.current) hotNodesInstancedRef.current.instanceMatrix.needsUpdate = true;

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
    <group position={[0, -0.4, -4]} rotation={[-0.18, 0, 0]}>
      {/* ─── Glowing Plexus Filaments (Electric Cyan/Azure) ─── */}
      <lineSegments ref={meshLinesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#00D2FF"
          transparent
          opacity={0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* ─── Standard Cyan Network Nodes ─── */}
      <instancedMesh
        ref={nodesInstancedRef}
        args={[undefined, undefined, TOTAL_NODES]}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.88}
        />
      </instancedMesh>

      {/* ─── Glowing Golden-White Super Nodes (Reference Image Highlights) ─── */}
      <instancedMesh
        ref={hotNodesInstancedRef}
        args={[undefined, undefined, TOTAL_NODES]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#FEF08A"
          transparent
          opacity={0.98}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* ─── Luminous Traveling Data Signals ─── */}
      <instancedMesh
        ref={pulsesInstancedRef}
        args={[undefined, undefined, pulses.length]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
};

// ─── 2. FLOATING HOLOGRAPHIC SQUARE DATA BOXES (THE CUBE LAYER) ───
const FloatingDataCubes: React.FC = () => {
  const cubeConfigs = useMemo(() => [
    { pos: [-9.5, -3.2, -6.5], size: 1.1, rotSpeed: [0.3, 0.4], color: '#10B981' },
    { pos: [-5.8, -2.6, -8.0], size: 0.85, rotSpeed: [-0.25, 0.35], color: '#FACC15' },
    { pos: [-2.2, -3.4, -6.0], size: 1.25, rotSpeed: [0.2, -0.3], color: '#22C55E' },
    { pos: [2.5, -3.0, -7.5], size: 0.95, rotSpeed: [-0.3, -0.2], color: '#38BDF8' },
    { pos: [6.8, -2.5, -6.0], size: 1.3, rotSpeed: [0.35, 0.25], color: '#10B981' },
    { pos: [10.2, -3.3, -8.5], size: 1.15, rotSpeed: [-0.2, 0.4], color: '#FACC15' },
    { pos: [-8.0, -1.8, -12.0], size: 1.4, rotSpeed: [0.15, 0.2], color: '#22C55E' },
    { pos: [8.5, -1.6, -11.5], size: 1.35, rotSpeed: [-0.18, -0.22], color: '#38BDF8' }
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
            {/* Translucent Cyber Glass Faces */}
            <meshStandardMaterial
              color="#02121e"
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.45}
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

// ─── 3. MASTER CANVAS BACKGROUND (GRID BOXES + FLOATING CUBES + UNDULATING PLEXUS) ───
export const CanvasBackground: React.FC = () => {
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

  return (
    <>
      {/* ─── DEEP CINEMATIC SPACE ATMOSPHERE ─── */}
      <color attach="background" args={['#020612']} />
      <fog attach="fog" args={['#020612', 12, 38]} />

      {/* Cybernetic Yellow & Green Ambient/Direct Lighting */}
      <ambientLight intensity={0.45} color="#061a28" />
      <directionalLight position={[10, 14, 6]} intensity={1.8} color="#FACC15" />
      <directionalLight position={[-12, -8, -5]} intensity={2.2} color="#00D2FF" />
      <pointLight position={[0, -2, -6]} intensity={3.0} color="#10B981" distance={15} />

      {/* Floating Bokeh Dust Field (Depth of Field in Reference Image) */}
      <points geometry={bokehField}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Master 3D Transform Group */}
      <group ref={masterGroupRef}>
        
        {/* ─── LOWER BASE LAYER: 3D CYBER GRID (SQUARE BOXES/CELLS) ─── */}
        <group ref={gridRef} position={[0, -4.5, -9]}>
          <Grid
            renderOrder={-1}
            position={[0, 0, 0]}
            infiniteGrid
            fadeDistance={34}
            fadeStrength={4.5}
            cellColor="#10B981"
            sectionColor="#EAB308"
            sectionSize={3.5}
            cellSize={0.7}
          />
        </group>

        {/* ─── MID LAYER: FLOATING HOLOGRAPHIC SQUARE DATA CUBES ─── */}
        <FloatingDataCubes />

        {/* ─── UPPER LAYER: UNDULATING 3D NEURAL PLEXUS WAVE (REFERENCE IMAGE) ─── */}
        {/* Positioned above the square grid floor, sweeping across the viewport */}
        <NeuralPlexusLandscape />

      </group>
    </>
  );
};
