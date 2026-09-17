import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SynapseNode {
  basePos: THREE.Vector3;
  currentPos: THREE.Vector3;
  freq: THREE.Vector3;
  phase: THREE.Vector3;
  amp: THREE.Vector3;
  color: THREE.Color;
  size: number;
}

interface SynapseEdge {
  from: number;
  to: number;
}

interface DataPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
  color: THREE.Color;
}

export const CanvasBackground: React.FC = () => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesInstancedRef = useRef<THREE.InstancedMesh>(null);
  const nodesInstancedRef = useRef<THREE.InstancedMesh>(null);

  // 1. Generate 46 Interconnected Neural Synapse Nodes
  const { nodes, edges, pulses } = useMemo(() => {
    const nodeCount = 46;
    const nodeList: SynapseNode[] = [];

    const goldColor = new THREE.Color('#FACC15');
    const emeraldColor = new THREE.Color('#22C55E');
    const limeColor = new THREE.Color('#A3E635');

    // Distribute nodes organically in a 3D field behind foreground elements
    for (let i = 0; i < nodeCount; i++) {
      const isGold = i % 2 === 0;
      const col = isGold ? (i % 4 === 0 ? limeColor : goldColor) : emeraldColor;

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 16
      );

      nodeList.push({
        basePos: basePos.clone(),
        currentPos: basePos.clone(),
        freq: new THREE.Vector3(
          0.3 + Math.random() * 0.4,
          0.25 + Math.random() * 0.35,
          0.2 + Math.random() * 0.3
        ),
        phase: new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        amp: new THREE.Vector3(
          0.5 + Math.random() * 0.7,
          0.6 + Math.random() * 0.8,
          0.4 + Math.random() * 0.6
        ),
        color: col,
        size: 0.16 + (i % 3) * 0.06
      });
    }

    // Connect nearby nodes to form organic neural synapses (max 3 connections per node)
    const edgeList: SynapseEdge[] = [];
    const connectionCounts = new Array(nodeCount).fill(0);
    const maxDist = 7.5;

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (connectionCounts[i] >= 3 || connectionCounts[j] >= 3) continue;
        const d = nodeList[i].basePos.distanceTo(nodeList[j].basePos);
        if (d < maxDist) {
          edgeList.push({ from: i, to: j });
          connectionCounts[i]++;
          connectionCounts[j]++;
        }
      }
    }

    // Initialize 18 continuous Data Pulses traveling along synapses
    const pulseCount = 18;
    const pulseList: DataPulse[] = [];
    for (let p = 0; p < pulseCount; p++) {
      const edge = edgeList[p % edgeList.length] || { from: 0, to: 1 };
      const reverse = p % 2 === 1;
      pulseList.push({
        fromNode: reverse ? edge.to : edge.from,
        toNode: reverse ? edge.from : edge.to,
        progress: (p / pulseCount),
        speed: 0.25 + Math.random() * 0.25,
        color: p % 2 === 0 ? new THREE.Color('#FEF08A') : new THREE.Color('#86EFAC')
      });
    }

    return { nodes: nodeList, edges: edgeList, pulses: pulseList };
  }, []);

  // Pre-allocate BufferGeometry for lines (positions and vertex colors)
  const { lineGeo, linePositions, lineColors } = useMemo(() => {
    const posArr = new Float32Array(edges.length * 2 * 3);
    const colArr = new Float32Array(edges.length * 2 * 3);

    edges.forEach((edge, idx) => {
      const cA = nodes[edge.from].color;
      const cB = nodes[edge.to].color;

      colArr[idx * 6 + 0] = cA.r;
      colArr[idx * 6 + 1] = cA.g;
      colArr[idx * 6 + 2] = cA.b;

      colArr[idx * 6 + 3] = cB.r;
      colArr[idx * 6 + 4] = cB.g;
      colArr[idx * 6 + 5] = cB.b;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    return { lineGeo: geo, linePositions: posArr, lineColors: colArr };
  }, [edges, nodes]);

  // Ambient Stardust Particles (Deep space atmosphere)
  const stardustPositions = useMemo(() => {
    const pts = new Float32Array(320 * 3);
    for (let i = 0; i < 320; i++) {
      pts[i * 3 + 0] = (Math.random() - 0.5) * 45;
      pts[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pts[i * 3 + 2] = -5 - Math.random() * 25;
    }
    return pts;
  }, []);

  // Temporary transform matrix & vectors to avoid GC pressure in 60fps loop
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // Initialize individual node & pulse colors
  React.useEffect(() => {
    if (nodesInstancedRef.current) {
      nodes.forEach((node, i) => {
        nodesInstancedRef.current?.setColorAt(i, node.color);
      });
      if (nodesInstancedRef.current.instanceColor) {
        nodesInstancedRef.current.instanceColor.needsUpdate = true;
      }
    }
    if (pulsesInstancedRef.current) {
      pulses.forEach((pulse, p) => {
        pulsesInstancedRef.current?.setColorAt(p, pulse.color);
      });
      if (pulsesInstancedRef.current.instanceColor) {
        pulsesInstancedRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [nodes, pulses]);

  // 60 FPS Autonomous Continuous Animation
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // 1. Gentle continuous global drift (no cursor tracking)
    if (masterGroupRef.current) {
      masterGroupRef.current.rotation.y += delta * 0.025;
      masterGroupRef.current.rotation.x = Math.sin(time * 0.15) * 0.04;
    }

    // 2. Update Node Positions with smooth organic harmonic breathing
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.currentPos.x = node.basePos.x + Math.sin(time * node.freq.x + node.phase.x) * node.amp.x;
      node.currentPos.y = node.basePos.y + Math.cos(time * node.freq.y + node.phase.y) * node.amp.y;
      node.currentPos.z = node.basePos.z + Math.sin(time * node.freq.z + node.phase.z) * node.amp.z;

      // Update instanced node mesh
      if (nodesInstancedRef.current) {
        tempMatrix.makeScale(node.size, node.size, node.size);
        tempMatrix.setPosition(node.currentPos);
        nodesInstancedRef.current.setMatrixAt(i, tempMatrix);
      }
    }
    if (nodesInstancedRef.current) {
      nodesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Synapse Line Segments connecting active nodes
    for (let e = 0; e < edges.length; e++) {
      const edge = edges[e];
      const pA = nodes[edge.from].currentPos;
      const pB = nodes[edge.to].currentPos;

      const idx = e * 6;
      linePositions[idx + 0] = pA.x;
      linePositions[idx + 1] = pA.y;
      linePositions[idx + 2] = pA.z;

      linePositions[idx + 3] = pB.x;
      linePositions[idx + 4] = pB.y;
      linePositions[idx + 5] = pB.z;
    }
    if (linesRef.current) {
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Update Traveling Data Signal Pulses
    if (pulsesInstancedRef.current) {
      for (let p = 0; p < pulses.length; p++) {
        const pulse = pulses[p];
        pulse.progress += delta * pulse.speed;

        if (pulse.progress >= 1.0) {
          pulse.progress = 0.0;
          // Find next adjacent edge from the destination node
          const candidateEdges = edges.filter(
            ed => ed.from === pulse.toNode || ed.to === pulse.toNode
          );
          if (candidateEdges.length > 0) {
            const nextEdge = candidateEdges[Math.floor(Math.random() * candidateEdges.length)];
            pulse.fromNode = pulse.toNode;
            pulse.toNode = nextEdge.from === pulse.toNode ? nextEdge.to : nextEdge.from;
          }
        }

        const pStart = nodes[pulse.fromNode].currentPos;
        const pEnd = nodes[pulse.toNode].currentPos;
        tempVec.lerpVectors(pStart, pEnd, pulse.progress);

        // Pulse size swells gently mid-journey
        const pulseScale = 0.12 + Math.sin(pulse.progress * Math.PI) * 0.08;
        tempMatrix.makeScale(pulseScale, pulseScale, pulseScale);
        tempMatrix.setPosition(tempVec);
        pulsesInstancedRef.current.setMatrixAt(p, tempMatrix);
      }
      pulsesInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <color attach="background" args={['#030509']} />
      <fog attach="fog" args={['#030509', 14, 42]} />

      {/* Atmospheric Space Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[12, 12, 6]} intensity={1.2} color="#FACC15" />
      <pointLight position={[-12, -10, -8]} intensity={1.4} color="#22C55E" />

      {/* Ambient Stardust Field */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={320}
            array={stardustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#FEF08A"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Master Neural Synapse Group */}
      <group ref={masterGroupRef}>
        {/* Synapse Lines (Golden-Emerald Energy Filaments) */}
        <lineSegments ref={linesRef} geometry={lineGeo}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.32}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* Instanced Synapse Nodes */}
        <instancedMesh
          ref={nodesInstancedRef}
          args={[undefined, undefined, nodes.length]}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.25}
            metalness={0.7}
          />
        </instancedMesh>

        {/* Instanced Glowing Data Pulses */}
        <instancedMesh
          ref={pulsesInstancedRef}
          args={[undefined, undefined, pulses.length]}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      </group>
    </>
  );
};

