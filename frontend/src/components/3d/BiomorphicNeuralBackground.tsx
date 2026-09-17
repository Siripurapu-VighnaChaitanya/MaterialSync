import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── TYPES FOR BIOMORPHIC NEURON ARCHITECTURE ───
interface DendriteBranch {
  curve: THREE.CatmullRomCurve3;
  tubeGeo: THREE.TubeGeometry;
  terminalPos: THREE.Vector3;
  pulses: {
    progress: number;
    speed: number;
    intensity: number;
  }[];
}

interface NeuronData {
  id: number;
  somaPos: THREE.Vector3;
  somaRadius: number;
  nucleusColor: string;
  branches: DendriteBranch[];
  subBranches: DendriteBranch[];
  myelinBeads: { pos: THREE.Vector3; rot: THREE.Euler }[];
}

export const BiomorphicNeuralBackground: React.FC = () => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const sparkInstancedRef = useRef<THREE.InstancedMesh>(null);
  const sparkHaloInstancedRef = useRef<THREE.InstancedMesh>(null);
  const boutonInstancedRef = useRef<THREE.InstancedMesh>(null);
  const somaRefs = useRef<(THREE.Group | null)[]>([]);

  // ─── 1. PROCEDURAL BIOLOGICAL NEURON GENERATION ───
  const { neurons, totalPulses, totalBoutons } = useMemo(() => {
    // 5 Neurons at varying depths (Hero foreground, midground, background)
    const neuronConfigs = [
      // 1. Hero Foreground Right Neuron (Like Image 1 & 2 right side)
      {
        id: 1,
        pos: new THREE.Vector3(4.8, -0.6, -4.5),
        radius: 1.25,
        nucleusColor: '#9333ea', // Deep purple nucleus as in Image 2
        branchAngles: [
          { theta: Math.PI * 0.95, phi: 0.1, length: 7.5, curl: new THREE.Vector3(-1.2, 0.8, -1.0) }, // Main axon reaching left
          { theta: Math.PI * 0.65, phi: 0.35, length: 5.5, curl: new THREE.Vector3(-0.6, 1.4, -0.8) },  // Upper-left dendrite
          { theta: Math.PI * 0.35, phi: -0.2, length: 4.8, curl: new THREE.Vector3(0.5, 1.2, 0.4) },   // Top dendrite
          { theta: -Math.PI * 0.6, phi: -0.3, length: 5.8, curl: new THREE.Vector3(-0.8, -1.5, -0.6) }, // Lower-left dendrite
          { theta: -Math.PI * 0.2, phi: 0.2, length: 4.2, curl: new THREE.Vector3(1.0, -1.2, 0.5) },  // Bottom-right root
          { theta: Math.PI * 0.1, phi: -0.15, length: 3.8, curl: new THREE.Vector3(1.2, 0.5, -0.4) }   // Far right branch
        ],
        hasMyelin: true
      },
      // 2. Midground Left Neuron (Reaching towards the right across center)
      {
        id: 2,
        pos: new THREE.Vector3(-5.2, 1.8, -8.5),
        radius: 1.05,
        nucleusColor: '#0284c7', // Bio-cyan nucleus
        branchAngles: [
          { theta: -Math.PI * 0.15, phi: -0.1, length: 6.8, curl: new THREE.Vector3(1.5, -0.6, 1.2) }, // Axon reaching towards hero
          { theta: -Math.PI * 0.45, phi: 0.25, length: 5.2, curl: new THREE.Vector3(0.8, -1.2, -0.8) }, // Downward-right branch
          { theta: Math.PI * 0.25, phi: -0.3, length: 4.5, curl: new THREE.Vector3(0.4, 1.2, 0.5) },   // Upper branch
          { theta: Math.PI * 0.8, phi: 0.15, length: 4.0, curl: new THREE.Vector3(-1.0, 0.6, -0.5) },  // Left branch
          { theta: -Math.PI * 0.85, phi: -0.2, length: 3.6, curl: new THREE.Vector3(-0.8, -1.0, 0.4) } // Bottom-left root
        ],
        hasMyelin: true
      },
      // 3. Lower Midground Neuron
      {
        id: 3,
        pos: new THREE.Vector3(-0.8, -4.2, -11.5),
        radius: 0.95,
        nucleusColor: '#d97706', // Golden amber nucleus
        branchAngles: [
          { theta: Math.PI * 0.45, phi: 0.1, length: 5.5, curl: new THREE.Vector3(-0.4, 1.6, 1.0) },
          { theta: Math.PI * 0.15, phi: -0.2, length: 4.8, curl: new THREE.Vector3(1.2, 1.0, -0.6) },
          { theta: -Math.PI * 0.35, phi: 0.3, length: 4.2, curl: new THREE.Vector3(0.6, -1.2, 0.8) },
          { theta: Math.PI * 0.85, phi: -0.15, length: 4.6, curl: new THREE.Vector3(-1.2, -0.4, -0.8) }
        ],
        hasMyelin: false
      },
      // 4. Deep Background Upper-Left Neuron (Blurred by depth fog)
      {
        id: 4,
        pos: new THREE.Vector3(-8.5, 4.5, -18.0),
        radius: 0.75,
        nucleusColor: '#0369a1',
        branchAngles: [
          { theta: -Math.PI * 0.25, phi: 0.1, length: 6.0, curl: new THREE.Vector3(1.5, -0.8, 1.0) },
          { theta: Math.PI * 0.5, phi: -0.2, length: 4.8, curl: new THREE.Vector3(0.3, 1.4, -0.5) },
          { theta: -Math.PI * 0.75, phi: 0.2, length: 4.2, curl: new THREE.Vector3(-1.0, -0.8, 0.4) }
        ],
        hasMyelin: false
      },
      // 5. Deep Background Right-Center Neuron
      {
        id: 5,
        pos: new THREE.Vector3(6.5, 3.8, -21.0),
        radius: 0.7,
        nucleusColor: '#9333ea',
        branchAngles: [
          { theta: Math.PI * 0.85, phi: 0.1, length: 6.5, curl: new THREE.Vector3(-1.6, -0.5, 1.2) },
          { theta: -Math.PI * 0.5, phi: -0.15, length: 5.2, curl: new THREE.Vector3(-0.4, -1.4, -0.6) },
          { theta: Math.PI * 0.2, phi: 0.25, length: 4.0, curl: new THREE.Vector3(0.8, 1.0, 0.5) }
        ],
        hasMyelin: false
      }
    ];

    let pulseCounter = 0;
    let boutonCounter = 0;

    const generatedNeurons: NeuronData[] = neuronConfigs.map(cfg => {
      const branches: DendriteBranch[] = [];
      const subBranches: DendriteBranch[] = [];
      const myelinBeads: { pos: THREE.Vector3; rot: THREE.Euler }[] = [];

      cfg.branchAngles.forEach((bConf, bIdx) => {
        // Build 3D organic curve with 5 smooth control points
        const startDir = new THREE.Vector3(
          Math.cos(bConf.theta) * Math.cos(bConf.phi),
          Math.sin(bConf.phi) * 1.5,
          Math.sin(bConf.theta) * Math.cos(bConf.phi)
        ).normalize();

        const p0 = cfg.pos.clone().add(startDir.clone().multiplyScalar(cfg.radius * 0.85));
        const p1 = cfg.pos.clone().add(startDir.clone().multiplyScalar(bConf.length * 0.25)).add(bConf.curl.clone().multiplyScalar(0.3));
        const p2 = cfg.pos.clone().add(startDir.clone().multiplyScalar(bConf.length * 0.55)).add(bConf.curl.clone().multiplyScalar(0.7));
        const p3 = cfg.pos.clone().add(startDir.clone().multiplyScalar(bConf.length * 0.8)).add(bConf.curl.clone().multiplyScalar(1.0));
        const p4 = cfg.pos.clone().add(startDir.clone().multiplyScalar(bConf.length)).add(bConf.curl.clone().multiplyScalar(1.25));

        const mainCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, 'centripetal');
        const radius = bIdx === 0 ? 0.095 : 0.065; // Main axon is slightly thicker
        const tubeGeo = new THREE.TubeGeometry(mainCurve, 40, radius, 8, false);

        // Generate myelin sheath segments along main axon if enabled (Reference Image 2)
        if (cfg.hasMyelin && bIdx === 0) {
          for (let m = 0.15; m < 0.75; m += 0.12) {
            const beadPos = mainCurve.getPointAt(m);
            const tangent = mainCurve.getTangentAt(m);
            const rot = new THREE.Euler(
              Math.atan2(tangent.y, Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z)),
              Math.atan2(-tangent.x, -tangent.z),
              0
            );
            myelinBeads.push({ pos: beadPos, rot });
          }
        }

        // Each branch has 2-3 electrical sparks traveling along it
        const branchPulses = [
          { progress: Math.random(), speed: 0.2 + Math.random() * 0.25, intensity: 0.8 + Math.random() * 0.4 },
          { progress: (Math.random() + 0.5) % 1.0, speed: 0.2 + Math.random() * 0.25, intensity: 0.8 + Math.random() * 0.4 }
        ];
        pulseCounter += branchPulses.length;
        boutonCounter += 1; // Terminal bouton

        branches.push({
          curve: mainCurve,
          tubeGeo,
          terminalPos: p4,
          pulses: branchPulses
        });

        // Generate 1-2 secondary daughter sub-branches (Dendritic arborization)
        if (bConf.length > 4.5) {
          const splitT = 0.45 + Math.random() * 0.2;
          const subStart = mainCurve.getPointAt(splitT);
          const subTangent = mainCurve.getTangentAt(splitT);

          // Diverge outward at an organic angle
          const normal = new THREE.Vector3(-subTangent.y, subTangent.x, subTangent.z * 0.5).normalize();
          const subEnd = subStart.clone().add(subTangent.clone().multiplyScalar(2.4)).add(normal.multiplyScalar(1.2));
          const subMid = subStart.clone().lerp(subEnd, 0.5).add(new THREE.Vector3(0.2, 0.3, -0.2));

          const subCurve = new THREE.CatmullRomCurve3([subStart, subMid, subEnd], false, 'centripetal');
          const subTubeGeo = new THREE.TubeGeometry(subCurve, 24, 0.04, 6, false);

          const subPulses = [
            { progress: Math.random(), speed: 0.25 + Math.random() * 0.25, intensity: 0.9 }
          ];
          pulseCounter += subPulses.length;
          boutonCounter += 1;

          subBranches.push({
            curve: subCurve,
            tubeGeo: subTubeGeo,
            terminalPos: subEnd,
            pulses: subPulses
          });
        }
      });

      return {
        id: cfg.id,
        somaPos: cfg.pos,
        somaRadius: cfg.radius,
        nucleusColor: cfg.nucleusColor,
        branches,
        subBranches,
        myelinBeads
      };
    });

    return {
      neurons: generatedNeurons,
      totalPulses: pulseCounter,
      totalBoutons: boutonCounter
    };
  }, []);

  // ─── 2. FLOATING CYTOPLASM / MICRO-VESICLE PARTICLES ───
  const cytoplasmParticles = useMemo(() => {
    const count = 280;
    const posArr = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);

    const goldColor = new THREE.Color('#FACC15');
    const cyanColor = new THREE.Color('#38BDF8');
    const whiteColor = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 0] = (Math.random() - 0.5) * 36;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 24;
      posArr[i * 3 + 2] = -2 - Math.random() * 26;

      const r = Math.random();
      const col = r < 0.45 ? goldColor : r < 0.85 ? cyanColor : whiteColor;
      colorArr[i * 3 + 0] = col.r;
      colorArr[i * 3 + 1] = col.g;
      colorArr[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    return geo;
  }, []);

  // Reusable matrix and vector objects for 60 FPS animation loop
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // Set initial colors for boutons (synaptic terminals)
  React.useEffect(() => {
    if (boutonInstancedRef.current) {
      const warmGold = new THREE.Color('#FACC15');
      for (let b = 0; b < totalBoutons; b++) {
        boutonInstancedRef.current.setColorAt(b, warmGold);
      }
      if (boutonInstancedRef.current.instanceColor) {
        boutonInstancedRef.current.instanceColor.needsUpdate = true;
      }
    }
    if (sparkInstancedRef.current) {
      const brightYellow = new THREE.Color('#FFFBEB');
      for (let p = 0; p < totalPulses; p++) {
        sparkInstancedRef.current.setColorAt(p, brightYellow);
      }
      if (sparkInstancedRef.current.instanceColor) {
        sparkInstancedRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [totalBoutons, totalPulses]);

  // ─── 3. 60 FPS BIOLOGICAL ANIMATION LOOP ───
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // A. Majestic Global Drift of the Microscopic Field
    if (masterGroupRef.current) {
      masterGroupRef.current.rotation.y = Math.sin(time * 0.08) * 0.04;
      masterGroupRef.current.rotation.x = Math.cos(time * 0.06) * 0.03;
      masterGroupRef.current.position.y = Math.sin(time * 0.2) * 0.15;
    }

    // B. Organic Somas Breathing / Pulsation
    neurons.forEach((neuron, idx) => {
      const somaGroup = somaRefs.current[idx];
      if (somaGroup) {
        const pulse = 1.0 + Math.sin(time * 1.8 + idx * 1.2) * 0.035;
        somaGroup.scale.set(pulse, pulse, pulse);
      }
    });

    // C. Traveling Action Potential Sparks (Electric Impulses)
    let pulseIdx = 0;
    let boutonIdx = 0;

    neurons.forEach(neuron => {
      // Main branches
      neuron.branches.forEach(branch => {
        // Place terminal synaptic bouton
        if (boutonInstancedRef.current) {
          // Bouton flares when an impulse reaches the end
          const isFiring = branch.pulses.some(p => p.progress > 0.88);
          const boutonScale = isFiring
            ? 0.16 + Math.sin(time * 15) * 0.04
            : 0.12 + Math.sin(time * 2.5 + boutonIdx) * 0.015;

          tempMatrix.makeScale(boutonScale, boutonScale, boutonScale);
          tempMatrix.setPosition(branch.terminalPos);
          boutonInstancedRef.current.setMatrixAt(boutonIdx, tempMatrix);
          boutonIdx++;
        }

        // Travel along curve
        branch.pulses.forEach(pulse => {
          pulse.progress += delta * pulse.speed;
          if (pulse.progress >= 1.0) {
            pulse.progress = 0.0;
          }

          const pt = branch.curve.getPointAt(pulse.progress);
          const sparkScale = 0.12 + Math.sin(pulse.progress * Math.PI) * 0.07;
          tempMatrix.setPosition(pt);

          if (sparkInstancedRef.current) {
            tempMatrix.makeScale(sparkScale, sparkScale, sparkScale);
            sparkInstancedRef.current.setMatrixAt(pulseIdx, tempMatrix);
          }
          if (sparkHaloInstancedRef.current) {
            const haloScale = sparkScale * 2.4;
            tempMatrix.makeScale(haloScale, haloScale, haloScale);
            sparkHaloInstancedRef.current.setMatrixAt(pulseIdx, tempMatrix);
          }
          pulseIdx++;
        });
      });

      // Secondary sub-branches
      neuron.subBranches.forEach(subBranch => {
        if (boutonInstancedRef.current) {
          const isFiring = subBranch.pulses.some(p => p.progress > 0.88);
          const boutonScale = isFiring ? 0.14 : 0.09;
          tempMatrix.makeScale(boutonScale, boutonScale, boutonScale);
          tempMatrix.setPosition(subBranch.terminalPos);
          boutonInstancedRef.current.setMatrixAt(boutonIdx, tempMatrix);
          boutonIdx++;
        }

        subBranch.pulses.forEach(pulse => {
          pulse.progress += delta * pulse.speed;
          if (pulse.progress >= 1.0) {
            pulse.progress = 0.0;
          }
          const pt = subBranch.curve.getPointAt(pulse.progress);
          const sparkScale = 0.09 + Math.sin(pulse.progress * Math.PI) * 0.05;
          tempMatrix.setPosition(pt);

          if (sparkInstancedRef.current) {
            tempMatrix.makeScale(sparkScale, sparkScale, sparkScale);
            sparkInstancedRef.current.setMatrixAt(pulseIdx, tempMatrix);
          }
          if (sparkHaloInstancedRef.current) {
            const haloScale = sparkScale * 2.4;
            tempMatrix.makeScale(haloScale, haloScale, haloScale);
            sparkHaloInstancedRef.current.setMatrixAt(pulseIdx, tempMatrix);
          }
          pulseIdx++;
        });
      });
    });

    if (sparkInstancedRef.current) {
      sparkInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
    if (sparkHaloInstancedRef.current) {
      sparkHaloInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
    if (boutonInstancedRef.current) {
      boutonInstancedRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* ─── MICROSCOPIC DEEP DARK-BLUE CELLULAR ATMOSPHERE ─── */}
      <color attach="background" args={['#020714']} />
      <fog attach="fog" args={['#020714', 11, 40]} />

      {/* Fluorescent Microscope Key & Rim Lighting */}
      <ambientLight intensity={0.65} color="#0c4a6e" />
      
      {/* Golden Key Light */}
      <directionalLight position={[10, 12, 6]} intensity={1.8} color="#FEF08A" />
      
      {/* Bio-Cyan Intense Rim Light (Creates the glowing biological nerve silhouette) */}
      <directionalLight position={[-12, -8, -6]} intensity={2.8} color="#06B6D4" />
      
      {/* Hero Soma Backlight */}
      <pointLight position={[4.8, -0.6, -2.5]} intensity={2.2} color="#FACC15" distance={12} />
      
      {/* Midground Soma Backlight */}
      <pointLight position={[-5.2, 1.8, -6.5]} intensity={2.0} color="#0284C7" distance={14} />

      {/* Floating Microscopic Cytoplasm Bokeh Particles */}
      <points geometry={cytoplasmParticles}>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Master 3D Biological Neural Network */}
      <group ref={masterGroupRef}>
        {neurons.map((neuron, nIdx) => (
          <group key={neuron.id}>
            
            {/* ─── A. NEURON SOMA (CELL BODY & INNER NUCLEUS) ─── */}
            <group
              ref={el => { somaRefs.current[nIdx] = el; }}
              position={neuron.somaPos}
            >
              {/* Outer Translucent Biological Cell Membrane */}
              <mesh>
                <sphereGeometry args={[neuron.somaRadius, 32, 32]} />
                <meshStandardMaterial
                  color="#082F49"
                  emissive="#0369A1"
                  emissiveIntensity={0.5}
                  roughness={0.2}
                  metalness={0.4}
                  transparent
                  opacity={0.88}
                />
              </mesh>

              {/* Glowing Inner Nucleus (Reference Image 2) */}
              <mesh>
                <sphereGeometry args={[neuron.somaRadius * 0.42, 24, 24]} />
                <meshBasicMaterial
                  color={neuron.nucleusColor}
                  transparent
                  opacity={0.85}
                />
              </mesh>

              {/* Soma Root Cones (Smooth transition from soma into branching roots) */}
              {neuron.branches.map((b, bIdx) => {
                const rootTangent = b.curve.getTangentAt(0);
                const pos = rootTangent.clone().multiplyScalar(neuron.somaRadius * 0.7);
                return (
                  <mesh key={bIdx} position={pos}>
                    <sphereGeometry args={[neuron.somaRadius * 0.28, 16, 16]} />
                    <meshStandardMaterial
                      color="#0E7490"
                      emissive="#0284C7"
                      emissiveIntensity={0.6}
                      roughness={0.25}
                      metalness={0.35}
                    />
                  </mesh>
                );
              })}
            </group>

            {/* ─── B. BRANCHING DENDRITES & AXON TUBES ─── */}
            {neuron.branches.map((b, bIdx) => (
              <mesh key={`b-${bIdx}`} geometry={b.tubeGeo}>
                <meshStandardMaterial
                  color="#082F49"
                  emissive="#0284C7"
                  emissiveIntensity={0.55}
                  roughness={0.18}
                  metalness={0.45}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            ))}

            {/* ─── C. SECONDARY DENDRITIC SUB-BRANCHES ─── */}
            {neuron.subBranches.map((sb, sbIdx) => (
              <mesh key={`sb-${sbIdx}`} geometry={sb.tubeGeo}>
                <meshStandardMaterial
                  color="#0E7490"
                  emissive="#06B6D4"
                  emissiveIntensity={0.65}
                  roughness={0.2}
                  metalness={0.4}
                  transparent
                  opacity={0.88}
                />
              </mesh>
            ))}

            {/* ─── D. MYELIN SHEATH BEADS (Reference Image 2) ─── */}
            {neuron.myelinBeads.map((m, mIdx) => (
              <mesh key={`myelin-${mIdx}`} position={m.pos} rotation={m.rot}>
                <cylinderGeometry args={[0.13, 0.13, 0.28, 16]} />
                <meshStandardMaterial
                  color="#38BDF8"
                  emissive="#0284C7"
                  emissiveIntensity={0.4}
                  roughness={0.3}
                  metalness={0.5}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* ─── E. GLOWING SYNAPTIC BOUTONS (Terminal Bulbs) ─── */}
        <instancedMesh
          ref={boutonInstancedRef}
          args={[undefined, undefined, totalBoutons]}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#EAB308"
            emissiveIntensity={1.4}
            roughness={0.15}
            metalness={0.2}
          />
        </instancedMesh>

        {/* ─── F. GLOWING ACTION POTENTIAL SPARKS (Electrical Impulses) ─── */}
        {/* Core Hot White-Gold Spark */}
        <instancedMesh
          ref={sparkInstancedRef}
          args={[undefined, undefined, totalPulses]}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.98}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>

        {/* Outer Glowing Golden Corona (Reference Image 1 & 2) */}
        <instancedMesh
          ref={sparkHaloInstancedRef}
          args={[undefined, undefined, totalPulses]}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </instancedMesh>
      </group>
    </>
  );
};
