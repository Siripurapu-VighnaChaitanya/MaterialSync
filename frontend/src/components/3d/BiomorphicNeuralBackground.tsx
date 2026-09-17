import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── 1. PROCEDURAL TAPERED ORGANIC TUBE GEOMETRY GENERATOR ───
// Uses Parallel Transport Frames to create silky-smooth, zero-twist, organically tapering biological dendrites
function createTaperedDendriteGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments = 40,
  startRadius = 0.16,
  endRadius = 0.025,
  radialSegments = 10
): THREE.BufferGeometry {
  const points = curve.getPoints(tubularSegments);
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  // Compute curve tangents
  for (let i = 0; i <= tubularSegments; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegments).normalize());
  }

  // Initial normal using non-parallel vector
  const initialNormal = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tangents[0].dot(initialNormal)) > 0.9) {
    initialNormal.set(1, 0, 0);
  }
  const n0 = new THREE.Vector3().crossVectors(tangents[0], initialNormal).normalize();
  normals.push(n0);
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], n0).normalize());

  // Parallel transport along the curve (guarantees zero twisting)
  for (let i = 1; i <= tubularSegments; i++) {
    const t0 = tangents[i - 1];
    const t1 = tangents[i];
    const axis = new THREE.Vector3().crossVectors(t0, t1);
    const angle = Math.acos(THREE.MathUtils.clamp(t0.dot(t1), -1, 1));

    const n = normals[i - 1].clone();
    if (axis.lengthSq() > 1e-6) {
      axis.normalize();
      n.applyAxisAngle(axis, angle);
    }
    normals.push(n.normalize());
    binormals.push(new THREE.Vector3().crossVectors(t1, n).normalize());
  }

  // Build vertex, normal, and UV buffers
  const vertices: number[] = [];
  const normalBuffer: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const progress = i / tubularSegments;
    // Organic non-linear taper: thick at soma root, gracefully thinning to fine synaptic terminal
    const currentRadius = THREE.MathUtils.lerp(startRadius, endRadius, Math.pow(progress, 0.75));
    const p = points[i];
    const n = normals[i];
    const b = binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Radial vector
      const rX = (n.x * cosA + b.x * sinA);
      const rY = (n.y * cosA + b.y * sinA);
      const rZ = (n.z * cosA + b.z * sinA);

      vertices.push(p.x + rX * currentRadius, p.y + rY * currentRadius, p.z + rZ * currentRadius);
      normalBuffer.push(rX, rY, rZ);
      uvs.push(progress, v);
    }
  }

  // Generate face indices
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalBuffer, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ─── 2. BIOLOGICAL NEURAL FRESNEL + ELECTRICAL PULSE SHADER ───
// Gives biological translucent membrane with electric cyan rim glow and internal golden action potentials
const BiologicalNerveShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uRimColor;
    uniform vec3 uPulseColor;
    uniform float uPulse1;
    uniform float uPulse2;
    uniform float uTime;
    uniform float uOpacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Microscopic Fluorescent Darkfield Fresnel Rim Effect
      float NdotV = max(dot(normal, viewDir), 0.0);
      float fresnel = pow(1.0 - NdotV, 2.2);

      // Biological Membrane Color: Deep bio-indigo interior, electric bio-cyan translucent glow on rim
      vec3 membrane = mix(uBaseColor, uRimColor, fresnel * 0.85 + 0.12);

      // Internal Traveling Action Potential Waves (Glow surges from inside nerve fibers)
      float dist1 = abs(vUv.x - uPulse1);
      float dist2 = abs(vUv.x - uPulse2);

      float p1 = exp(-dist1 * dist1 * 28.0) * 1.8;
      float p2 = exp(-dist2 * dist2 * 28.0) * 1.8;
      vec3 electricPulse = (p1 + p2) * uPulseColor;

      // Subtle biological membrane micro-texture shimmer
      float shimmer = sin(vUv.y * 30.0 + uTime * 2.0) * 0.04;
      vec3 finalColor = membrane + electricPulse + shimmer * uRimColor;

      // Rim transparency (center semi-translucent, outer rim vibrant)
      float alpha = clamp(uOpacity * (0.65 + fresnel * 0.35 + (p1 + p2) * 0.4), 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// ─── 3. DATA STRUCTURES FOR NEURAL ARBORIZATION ───
interface BranchInfo {
  curve: THREE.CatmullRomCurve3;
  geo: THREE.BufferGeometry;
  terminalPos: THREE.Vector3;
  pulses: { progress: number; speed: number }[];
  material: THREE.ShaderMaterial;
}

interface BioNeuron {
  id: number;
  pos: THREE.Vector3;
  radius: number;
  somaGeo: THREE.BufferGeometry;
  somaMaterial: THREE.ShaderMaterial;
  nucleusColor: string;
  branches: BranchInfo[];
  subBranches: BranchInfo[];
}

export const BiomorphicNeuralBackground: React.FC = () => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const sparkCoreRef = useRef<THREE.InstancedMesh>(null);
  const sparkHaloRef = useRef<THREE.InstancedMesh>(null);
  const boutonRef = useRef<THREE.InstancedMesh>(null);
  const somaGroupRefs = useRef<(THREE.Group | null)[]>([]);

  // ─── 4. PROCEDURAL BIOLOGICAL NETWORK ARCHITECTURE ───
  const { neurons, totalSparks, totalBoutons, allCurves } = useMemo(() => {
    // 5 Neurons strategically placed around viewport perimeter to avoid clashing with UI
    const configs = [
      // 1. Hero Upper-Right Neuron (Prominent, branches flow across upper screen)
      {
        id: 1,
        pos: new THREE.Vector3(7.2, 3.2, -7.0),
        radius: 1.35,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.95, -0.25, 0.15), len: 8.5, startR: 0.18, endR: 0.03, curls: [new THREE.Vector3(-0.5, 0.8, -0.6), new THREE.Vector3(-0.8, -0.4, 0.8)] },
          { dir: new THREE.Vector3(-0.7, -0.65, 0.2), len: 7.2, startR: 0.15, endR: 0.025, curls: [new THREE.Vector3(-0.4, -0.8, 0.5), new THREE.Vector3(-0.6, 0.4, -0.5)] },
          { dir: new THREE.Vector3(-0.4, 0.85, -0.3), len: 5.5, startR: 0.13, endR: 0.025, curls: [new THREE.Vector3(-0.3, 0.5, 0.4)] },
          { dir: new THREE.Vector3(0.5, -0.8, 0.2), len: 5.0, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(0.4, -0.5, -0.3)] },
          { dir: new THREE.Vector3(0.8, 0.45, -0.2), len: 4.5, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.2, 0.3)] }
        ]
      },
      // 2. Left Mid-Upper Neuron (Behind title, branching gracefully down & center)
      {
        id: 2,
        pos: new THREE.Vector3(-8.5, 3.8, -11.0),
        radius: 1.15,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#38BDF8'),
        branches: [
          { dir: new THREE.Vector3(0.85, -0.45, 0.2), len: 8.8, startR: 0.16, endR: 0.025, curls: [new THREE.Vector3(0.8, -0.5, 0.6), new THREE.Vector3(0.6, 0.5, -0.5)] },
          { dir: new THREE.Vector3(0.6, 0.75, -0.2), len: 6.0, startR: 0.13, endR: 0.025, curls: [new THREE.Vector3(0.4, 0.6, -0.4)] },
          { dir: new THREE.Vector3(0.2, -0.9, 0.3), len: 6.5, startR: 0.14, endR: 0.025, curls: [new THREE.Vector3(0.3, -0.7, 0.4)] },
          { dir: new THREE.Vector3(-0.8, 0.5, -0.2), len: 4.5, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(-0.4, 0.3, 0.3)] }
        ]
      },
      // 3. Lower-Left Deep Neuron (Anchoring bottom left)
      {
        id: 3,
        pos: new THREE.Vector3(-6.0, -5.5, -14.0),
        radius: 1.05,
        nucleusColor: '#d97706',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#06B6D4'),
        branches: [
          { dir: new THREE.Vector3(0.7, 0.65, 0.2), len: 8.0, startR: 0.15, endR: 0.025, curls: [new THREE.Vector3(0.5, 0.8, -0.5), new THREE.Vector3(0.8, -0.3, 0.4)] },
          { dir: new THREE.Vector3(0.9, 0.2, -0.3), len: 7.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(0.6, 0.3, -0.4)] },
          { dir: new THREE.Vector3(-0.5, 0.8, 0.2), len: 5.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(-0.3, 0.6, 0.3)] }
        ]
      },
      // 4. Deep Background Upper-Center Neuron (Soft depth-of-field focal blur)
      {
        id: 4,
        pos: new THREE.Vector3(1.5, 6.0, -19.0),
        radius: 0.85,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#010c1a'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(-0.6, -0.75, 0.2), len: 7.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.6, 0.4)] },
          { dir: new THREE.Vector3(0.7, -0.65, -0.2), len: 6.8, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(0.5, -0.5, -0.3)] }
        ]
      },
      // 5. Far Right Deep Background Connector
      {
        id: 5,
        pos: new THREE.Vector3(8.5, -4.5, -22.0),
        radius: 0.8,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#010c1a'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.85, 0.45, 0.2), len: 8.0, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(-0.6, 0.5, 0.3)] },
          { dir: new THREE.Vector3(-0.4, 0.85, -0.3), len: 6.0, startR: 0.10, endR: 0.02, curls: [new THREE.Vector3(-0.3, 0.6, -0.4)] }
        ]
      }
    ];

    let sparkCount = 0;
    let boutonCount = 0;
    const curveList: { curve: THREE.CatmullRomCurve3; pulses: { progress: number; speed: number }[]; mat: THREE.ShaderMaterial }[] = [];

    const neuronList: BioNeuron[] = configs.map(cfg => {
      // ── Build Organic Multi-Rooted Soma Geometry ──
      const somaGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const posAttr = somaGeo.attributes.position;
      const v = new THREE.Vector3();
      // Displace sphere vertices with smooth 3D noise to create biological amoeboid cell body
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        const noise = Math.sin(v.x * 3.0) * Math.cos(v.y * 3.0) * Math.sin(v.z * 3.0) * 0.14;
        v.multiplyScalar(1.0 + noise);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      somaGeo.computeVertexNormals();

      const somaMat = new THREE.ShaderMaterial({
        vertexShader: BiologicalNerveShader.vertexShader,
        fragmentShader: BiologicalNerveShader.fragmentShader,
        uniforms: {
          uBaseColor: { value: cfg.baseColor },
          uRimColor: { value: cfg.rimColor },
          uPulseColor: { value: new THREE.Color('#FACC15') },
          uPulse1: { value: -1.0 },
          uPulse2: { value: -1.0 },
          uTime: { value: 0 },
          uOpacity: { value: 0.92 }
        },
        transparent: true,
        side: THREE.FrontSide
      });

      const branches: BranchInfo[] = [];
      const subBranches: BranchInfo[] = [];

      cfg.branches.forEach((bConf, bIdx) => {
        // Compute 5 smooth organic control points
        const dir = bConf.dir.clone().normalize();
        const p0 = cfg.pos.clone().add(dir.clone().multiplyScalar(cfg.radius * 0.8));
        const c1 = bConf.curls[0] || new THREE.Vector3();
        const c2 = bConf.curls[1] || c1;

        const p1 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.25)).add(c1.clone().multiplyScalar(0.4));
        const p2 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.55)).add(c2.clone().multiplyScalar(0.8));
        const p3 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.8)).add(c1.clone().multiplyScalar(1.2));
        const p4 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len)).add(c2.clone().multiplyScalar(1.5));

        const mainCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, 'centripetal');
        const mainGeo = createTaperedDendriteGeometry(mainCurve, 42, bConf.startR, bConf.endR, 10);

        const branchMat = new THREE.ShaderMaterial({
          vertexShader: BiologicalNerveShader.vertexShader,
          fragmentShader: BiologicalNerveShader.fragmentShader,
          uniforms: {
            uBaseColor: { value: cfg.baseColor },
            uRimColor: { value: cfg.rimColor },
            uPulseColor: { value: new THREE.Color('#FACC15') },
            uPulse1: { value: 0.2 },
            uPulse2: { value: 0.7 },
            uTime: { value: 0 },
            uOpacity: { value: 0.88 }
          },
          transparent: true,
          side: THREE.FrontSide
        });

        const branchPulses = [
          { progress: (bIdx * 0.23) % 1.0, speed: 0.22 + Math.random() * 0.16 },
          { progress: (bIdx * 0.23 + 0.52) % 1.0, speed: 0.22 + Math.random() * 0.16 }
        ];
        sparkCount += branchPulses.length;
        boutonCount += 1; // Terminal synaptic bulb

        branches.push({
          curve: mainCurve,
          geo: mainGeo,
          terminalPos: p4,
          pulses: branchPulses,
          material: branchMat
        });
        curveList.push({ curve: mainCurve, pulses: branchPulses, mat: branchMat });

        // Generate fine dendritic arborization sub-branch
        if (bConf.len > 5.5) {
          const splitT = 0.42 + Math.random() * 0.2;
          const subStart = mainCurve.getPointAt(splitT);
          const subTangent = mainCurve.getTangentAt(splitT);
          const sideVec = new THREE.Vector3(-subTangent.y, subTangent.x, subTangent.z * 0.6).normalize();

          const subMid = subStart.clone().add(subTangent.clone().multiplyScalar(1.6)).add(sideVec.clone().multiplyScalar(1.1));
          const subEnd = subMid.clone().add(subTangent.clone().multiplyScalar(1.5)).add(sideVec.clone().multiplyScalar(0.8));

          const subCurve = new THREE.CatmullRomCurve3([subStart, subMid, subEnd], false, 'centripetal');
          const subGeo = createTaperedDendriteGeometry(subCurve, 26, bConf.startR * 0.65, bConf.endR * 0.8, 8);

          const subMat = branchMat.clone();
          const subPulses = [{ progress: Math.random(), speed: 0.28 + Math.random() * 0.18 }];
          sparkCount += subPulses.length;
          boutonCount += 1;

          subBranches.push({
            curve: subCurve,
            geo: subGeo,
            terminalPos: subEnd,
            pulses: subPulses,
            material: subMat
          });
          curveList.push({ curve: subCurve, pulses: subPulses, mat: subMat });
        }
      });

      return {
        id: cfg.id,
        pos: cfg.pos,
        radius: cfg.radius,
        somaGeo,
        somaMaterial: somaMat,
        nucleusColor: cfg.nucleusColor,
        branches,
        subBranches
      };
    });

    return {
      neurons: neuronList,
      totalSparks: sparkCount,
      totalBoutons: boutonCount,
      allCurves: curveList
    };
  }, []);

  // ─── 5. FLOATING CYTOPLASM BOKEH MICRO-VESICLES (Deep Fluid Atmosphere) ───
  const cytoplasmField = useMemo(() => {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyanBio = new THREE.Color('#38BDF8');
    const goldBio = new THREE.Color('#FACC15');
    const whiteBio = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 2] = -4 - Math.random() * 26;

      const r = Math.random();
      const col = r < 0.55 ? cyanBio : r < 0.85 ? goldBio : whiteBio;
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Reusable matrix and vectors to eliminate garbage collection at 60 FPS
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const zeroMatrix = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  // Initialize all instanced matrices to 0 to prevent any stray white sphere artifacts
  React.useEffect(() => {
    if (sparkCoreRef.current) {
      for (let i = 0; i < totalSparks; i++) {
        sparkCoreRef.current.setMatrixAt(i, zeroMatrix);
      }
      sparkCoreRef.current.instanceMatrix.needsUpdate = true;
    }
    if (sparkHaloRef.current) {
      for (let i = 0; i < totalSparks; i++) {
        sparkHaloRef.current.setMatrixAt(i, zeroMatrix);
      }
      sparkHaloRef.current.instanceMatrix.needsUpdate = true;
    }
    if (boutonRef.current) {
      for (let i = 0; i < totalBoutons; i++) {
        boutonRef.current.setMatrixAt(i, zeroMatrix);
      }
      boutonRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [totalSparks, totalBoutons, zeroMatrix]);

  // ─── 6. 60 FPS REAL-TIME BIOLOGICAL SIMULATION ───
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // A. Majestic Global Drift of the Microscopic Field (Smooth & subtle)
    if (masterGroupRef.current) {
      masterGroupRef.current.rotation.y = Math.sin(time * 0.07) * 0.035;
      masterGroupRef.current.rotation.x = Math.cos(time * 0.05) * 0.025;
      masterGroupRef.current.position.y = Math.sin(time * 0.15) * 0.12;
    }

    // B. Organic Somas Breathing with Metabolic Expansion
    neurons.forEach((neuron, idx) => {
      const g = somaGroupRefs.current[idx];
      if (g) {
        const pulse = 1.0 + Math.sin(time * 1.6 + idx * 1.4) * 0.03;
        g.scale.set(pulse, pulse, pulse);
      }
      neuron.somaMaterial.uniforms.uTime.value = time;
    });

    // C. Propagate Action Potentials & Light Waves Along Dendrites
    let sparkIdx = 0;
    let boutonIdx = 0;

    allCurves.forEach(item => {
      // Advance pulse progresses
      item.pulses.forEach((p, pIdx) => {
        p.progress += delta * p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0.0;
        }

        // Update shader uniforms so nerve fiber illuminates from inside as pulse travels
        if (pIdx === 0) item.mat.uniforms.uPulse1.value = p.progress;
        if (pIdx === 1) item.mat.uniforms.uPulse2.value = p.progress;

        const pos = item.curve.getPointAt(p.progress);

        // Core Spark (Hot White-Gold Energy Node)
        if (sparkCoreRef.current) {
          const coreScale = 0.13 + Math.sin(p.progress * Math.PI) * 0.06;
          tempMatrix.makeScale(coreScale, coreScale, coreScale);
          tempMatrix.setPosition(pos);
          sparkCoreRef.current.setMatrixAt(sparkIdx, tempMatrix);
        }

        // Radiant Golden Halo (Atmospheric Bloom)
        if (sparkHaloRef.current) {
          const haloScale = (0.13 + Math.sin(p.progress * Math.PI) * 0.06) * 3.0;
          tempMatrix.makeScale(haloScale, haloScale, haloScale);
          tempMatrix.setPosition(pos);
          sparkHaloRef.current.setMatrixAt(sparkIdx, tempMatrix);
        }

        sparkIdx++;
      });
      item.mat.uniforms.uTime.value = time;
    });

    // D. Update Synaptic Terminal Boutons (Flare up when impulse arrives)
    neurons.forEach(neuron => {
      const allBranches = [...neuron.branches, ...neuron.subBranches];
      allBranches.forEach(br => {
        if (boutonRef.current && boutonIdx < totalBoutons) {
          const isFiring = br.pulses.some(p => p.progress > 0.86);
          const bScale = isFiring ? 0.18 : 0.10 + Math.sin(time * 2.0 + boutonIdx) * 0.015;

          tempMatrix.makeScale(bScale, bScale, bScale);
          tempMatrix.setPosition(br.terminalPos);
          boutonRef.current.setMatrixAt(boutonIdx, tempMatrix);
          boutonIdx++;
        }
      });
    });

    // Commit instanced matrix updates to GPU
    if (sparkCoreRef.current) sparkCoreRef.current.instanceMatrix.needsUpdate = true;
    if (sparkHaloRef.current) sparkHaloRef.current.instanceMatrix.needsUpdate = true;
    if (boutonRef.current) boutonRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* ─── MICROSCOPIC CELLULAR BIO-GRADIENT ATMOSPHERE ─── */}
      <color attach="background" args={['#010612']} />
      <fog attach="fog" args={['#010612', 12, 42]} />

      {/* Fluorescent Microscope Darkfield Key & Rim Illumination */}
      <ambientLight intensity={0.7} color="#072b4a" />
      <directionalLight position={[12, 14, 8]} intensity={2.2} color="#FEF08A" />
      <directionalLight position={[-14, -10, -8]} intensity={3.4} color="#00B4D8" />
      
      {/* Subtle Warm Bioluminescent Point Glows */}
      <pointLight position={[7.2, 3.2, -5.0]} intensity={2.5} color="#FACC15" distance={15} />
      <pointLight position={[-8.5, 3.8, -9.0]} intensity={2.2} color="#00B4D8" distance={15} />

      {/* Floating Microscopic Cytoplasm Bokeh Particles */}
      <points geometry={cytoplasmField}>
        <pointsMaterial
          size={0.14}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Master 3D Biological Neural Cortex */}
      <group ref={masterGroupRef}>
        {neurons.map((neuron, nIdx) => (
          <group key={neuron.id}>
            {/* ─── SOMA (AMOEBIC CELL BODY & BIO-NUCLEUS) ─── */}
            <group
              ref={el => { somaGroupRefs.current[nIdx] = el; }}
              position={neuron.pos}
            >
              {/* Outer Translucent Biological Cell Membrane with Fresnel Shader */}
              <mesh geometry={neuron.somaGeo} material={neuron.somaMaterial} />

              {/* Glowing Inner Bio-Nucleus (Reference Image 2) */}
              <mesh>
                <sphereGeometry args={[neuron.radius * 0.44, 24, 24]} />
                <meshBasicMaterial
                  color={neuron.nucleusColor}
                  transparent
                  opacity={0.82}
                />
              </mesh>
            </group>

            {/* ─── TAPERED DENDRITES & AXONS (Silky-Smooth Organic Tubes) ─── */}
            {neuron.branches.map((b, bIdx) => (
              <mesh key={`b-${bIdx}`} geometry={b.geo} material={b.material} />
            ))}

            {/* ─── SECONDARY ARBORIZATION DAUGHTER BRANCHES ─── */}
            {neuron.subBranches.map((sb, sbIdx) => (
              <mesh key={`sb-${sbIdx}`} geometry={sb.geo} material={sb.material} />
            ))}
          </group>
        ))}

        {/* ─── GLOWING SYNAPTIC BOUTONS (Terminal Bulbs) ─── */}
        <instancedMesh
          ref={boutonRef}
          args={[undefined, undefined, totalBoutons]}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color="#FEF08A"
            emissive="#F59E0B"
            emissiveIntensity={2.5}
            roughness={0.1}
            metalness={0.2}
          />
        </instancedMesh>

        {/* ─── CORE HOT WHITE-GOLD ELECTRICAL SPARKS (Action Potentials) ─── */}
        <instancedMesh
          ref={sparkCoreRef}
          args={[undefined, undefined, totalSparks]}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.98}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>

        {/* ─── RADIANT GOLDEN CORONA HALO (Warm Plasma Aura) ─── */}
        <instancedMesh
          ref={sparkHaloRef}
          args={[undefined, undefined, totalSparks]}
        >
          <sphereGeometry args={[1, 14, 14]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </instancedMesh>
      </group>
    </>
  );
};
