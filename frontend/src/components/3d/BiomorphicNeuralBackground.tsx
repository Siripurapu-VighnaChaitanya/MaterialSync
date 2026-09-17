import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── 1. PROCEDURAL TAPERED BIOLOGICAL DENDRITE GEOMETRY ───
// Generates zero-twist, organically tapering biological nerve fibers using Parallel Transport Frames
function createTaperedDendriteGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments = 46,
  startRadius = 0.24,
  endRadius = 0.022,
  radialSegments = 10
): THREE.BufferGeometry {
  const points = curve.getPoints(tubularSegments);
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    tangents.push(curve.getTangentAt(i / tubularSegments).normalize());
  }

  const initialNormal = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tangents[0].dot(initialNormal)) > 0.9) {
    initialNormal.set(1, 0, 0);
  }
  const n0 = new THREE.Vector3().crossVectors(tangents[0], initialNormal).normalize();
  normals.push(n0);
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], n0).normalize());

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

  const vertices: number[] = [];
  const normalBuffer: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const progress = i / tubularSegments;
    // Biological non-linear taper: robust cellular root, thinning to whisper-fine terminal tendril
    const currentRadius = THREE.MathUtils.lerp(startRadius, endRadius, Math.pow(progress, 0.68));
    const p = points[i];
    const n = normals[i];
    const b = binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const angle = v * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const rX = n.x * cosA + b.x * sinA;
      const rY = n.y * cosA + b.y * sinA;
      const rZ = n.z * cosA + b.z * sinA;

      vertices.push(p.x + rX * currentRadius, p.y + rY * currentRadius, p.z + rZ * currentRadius);
      normalBuffer.push(rX, rY, rZ);
      uvs.push(progress, v);
    }
  }

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

// ─── 2. BIOLOGICAL FRESNEL SHADER (CELLULAR RIM GLOW + SINGLE INTERNAL WAVE) ───
const BioNerveShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uRimColor;
    uniform vec3 uPulseColor;
    uniform float uPulseProgress; // 0.0 to 1.0; negative during resting refractory pause
    uniform float uTime;
    uniform float uOpacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Microscopic Darkfield Fresnel Rim Effect (Reference Image 1 & 2)
      float NdotV = max(dot(normal, viewDir), 0.0);
      float fresnel = pow(1.0 - NdotV, 2.2);

      // Translucent biological tissue with glowing electric bio-cyan outline
      vec3 membrane = mix(uBaseColor, uRimColor, fresnel * 0.88 + 0.12);

      // EXACTLY ONE Action Potential wave flowing inside the fiber
      float electricPulse = 0.0;
      if (uPulseProgress >= 0.0 && uPulseProgress <= 1.0) {
        float dist = abs(vUv.x - uPulseProgress);
        electricPulse = exp(-dist * dist * 35.0) * 2.2;
      }

      // Subtle biological membrane micro-texture shimmer
      float shimmer = sin(vUv.y * 22.0 + uTime * 1.5) * 0.035;
      vec3 finalColor = membrane + electricPulse * uPulseColor + shimmer * uRimColor;

      float alpha = clamp(uOpacity * (0.65 + fresnel * 0.35 + electricPulse * 0.35), 0.0, 1.0);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// ─── 3. DATA STRUCTURES ───
interface DendriteBranch {
  curve: THREE.CatmullRomCurve3;
  geo: THREE.BufferGeometry;
  terminalPos: THREE.Vector3;
  material: THREE.ShaderMaterial;
  // STRICTLY ONE signal per branch with slow velocity and refractory rest
  pulse: {
    progress: number;
    speed: number;
    restPeriod: number;
  };
}

interface BioNeuron {
  id: number;
  pos: THREE.Vector3;
  radius: number;
  somaGeo: THREE.BufferGeometry;
  somaMaterial: THREE.ShaderMaterial;
  nucleusColor: string;
  branches: DendriteBranch[];
  subBranches: DendriteBranch[];
}

export const BiomorphicNeuralBackground: React.FC = () => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const sparkCoreRef = useRef<THREE.InstancedMesh>(null);
  const sparkHaloRef = useRef<THREE.InstancedMesh>(null);
  const boutonRef = useRef<THREE.InstancedMesh>(null);
  const somaRefs = useRef<(THREE.Group | null)[]>([]);

  // ─── 4. WIDELY EXPANDED BIOLOGICAL NEURAL CORTEX ───
  const { neurons, totalBranches, totalBoutons, allBranches } = useMemo(() => {
    // 8 Neurons distributed widely across a vast 3D canvas (X: -16 to +16, Y: -10 to +10, Z: -7 to -26)
    // Lots of breathing room, sweeping long tentacles, and delicate daughter sub-branches
    const configs = [
      // 1. Hero Upper-Right Multipolar Neuron (Reference 1 & 2 Right Side)
      {
        id: 1,
        pos: new THREE.Vector3(10.5, 4.2, -7.5),
        radius: 1.55,
        nucleusColor: '#9333ea', // Deep purple nucleus as in Image 2
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.95, -0.3, 0.2), len: 12.5, startR: 0.26, endR: 0.03, curls: [new THREE.Vector3(-0.8, 1.2, -0.8), new THREE.Vector3(-1.2, -0.6, 0.9)] },
          { dir: new THREE.Vector3(-0.65, -0.75, 0.15), len: 10.5, startR: 0.20, endR: 0.025, curls: [new THREE.Vector3(-0.6, -1.0, 0.8)] },
          { dir: new THREE.Vector3(-0.35, 0.9, -0.2), len: 8.5, startR: 0.17, endR: 0.025, curls: [new THREE.Vector3(-0.4, 0.8, 0.6)] },
          { dir: new THREE.Vector3(0.65, -0.7, 0.2), len: 7.5, startR: 0.15, endR: 0.02, curls: [new THREE.Vector3(0.6, -0.5, -0.5)] },
          { dir: new THREE.Vector3(0.85, 0.45, -0.2), len: 7.0, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.4, 0.5)] }
        ]
      },
      // 2. Far-Left Midground Neuron (Reaching vast sweeping dendrites right across center)
      {
        id: 2,
        pos: new THREE.Vector3(-11.5, 1.5, -9.5),
        radius: 1.45,
        nucleusColor: '#0284c7', // Bio-cyan nucleus
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#38BDF8'),
        branches: [
          { dir: new THREE.Vector3(0.92, 0.35, 0.15), len: 13.5, startR: 0.25, endR: 0.03, curls: [new THREE.Vector3(1.0, -0.8, 0.9), new THREE.Vector3(1.2, 0.7, -0.8)] },
          { dir: new THREE.Vector3(0.75, -0.65, 0.2), len: 11.0, startR: 0.19, endR: 0.025, curls: [new THREE.Vector3(0.7, -0.8, 0.6)] },
          { dir: new THREE.Vector3(0.35, 0.9, -0.2), len: 9.0, startR: 0.16, endR: 0.025, curls: [new THREE.Vector3(0.4, 0.9, -0.5)] },
          { dir: new THREE.Vector3(-0.8, -0.55, 0.3), len: 7.5, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.5, 0.4)] }
        ]
      },
      // 3. Lower-Center / Right Neuron
      {
        id: 3,
        pos: new THREE.Vector3(3.5, -7.0, -12.0),
        radius: 1.30,
        nucleusColor: '#d97706', // Golden amber nucleus
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#06B6D4'),
        branches: [
          { dir: new THREE.Vector3(-0.65, 0.75, 0.2), len: 11.0, startR: 0.22, endR: 0.025, curls: [new THREE.Vector3(-0.8, 0.9, -0.6)] },
          { dir: new THREE.Vector3(0.8, 0.55, -0.2), len: 9.5, startR: 0.18, endR: 0.025, curls: [new THREE.Vector3(0.7, 0.6, -0.5)] },
          { dir: new THREE.Vector3(-0.5, -0.8, 0.2), len: 7.0, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(-0.4, -0.6, 0.4)] }
        ]
      },
      // 4. Lower-Left Deep Neuron
      {
        id: 4,
        pos: new THREE.Vector3(-8.5, -6.5, -15.0),
        radius: 1.20,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(0.8, 0.6, 0.2), len: 10.5, startR: 0.19, endR: 0.025, curls: [new THREE.Vector3(0.7, 0.7, -0.5)] },
          { dir: new THREE.Vector3(0.6, -0.75, -0.2), len: 8.5, startR: 0.15, endR: 0.02, curls: [new THREE.Vector3(0.5, -0.6, 0.4)] }
        ]
      },
      // 5. Top-Center Deep Neuron (Atmospheric Depth)
      {
        id: 5,
        pos: new THREE.Vector3(-1.5, 7.5, -18.0),
        radius: 1.10,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#38BDF8'),
        branches: [
          { dir: new THREE.Vector3(0.7, -0.7, 0.2), len: 10.0, startR: 0.16, endR: 0.02, curls: [new THREE.Vector3(0.6, -0.6, 0.5)] },
          { dir: new THREE.Vector3(-0.75, -0.65, -0.2), len: 9.0, startR: 0.15, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.6, -0.4)] }
        ]
      },
      // 6. Far-Right Deep Background Neuron
      {
        id: 6,
        pos: new THREE.Vector3(12.5, -3.5, -21.0),
        radius: 1.05,
        nucleusColor: '#d97706',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.85, 0.5, 0.2), len: 10.5, startR: 0.15, endR: 0.02, curls: [new THREE.Vector3(-0.7, 0.6, 0.4)] },
          { dir: new THREE.Vector3(-0.4, -0.9, -0.2), len: 8.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(-0.3, -0.7, -0.3)] }
        ]
      },
      // 7. Center-Deep Focal Background Neuron (Soft Blurred Silhouette)
      {
        id: 7,
        pos: new THREE.Vector3(0.5, 0.0, -24.0),
        radius: 0.95,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(-0.7, -0.7, 0.2), len: 9.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.5, 0.4)] },
          { dir: new THREE.Vector3(0.7, 0.7, -0.2), len: 8.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.5, -0.4)] }
        ]
      },
      // 8. Far-Upper-Left Deep Silhouette
      {
        id: 8,
        pos: new THREE.Vector3(-11.0, 7.0, -27.0),
        radius: 0.90,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(0.85, -0.5, 0.2), len: 9.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(0.6, -0.4, 0.4)] }
        ]
      }
    ];

    let branchCounter = 0;
    let boutonCounter = 0;
    const branchList: DendriteBranch[] = [];

    const neuronList: BioNeuron[] = configs.map((cfg, cIdx) => {
      // ── Organic Multi-Lobed Biological Soma Geometry ──
      const somaGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const posAttr = somaGeo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        const noise = Math.sin(v.x * 2.6) * Math.cos(v.y * 2.6) * Math.sin(v.z * 2.6) * 0.14;
        v.multiplyScalar(1.0 + noise);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      somaGeo.computeVertexNormals();

      const somaMat = new THREE.ShaderMaterial({
        vertexShader: BioNerveShader.vertexShader,
        fragmentShader: BioNerveShader.fragmentShader,
        uniforms: {
          uBaseColor: { value: cfg.baseColor },
          uRimColor: { value: cfg.rimColor },
          uPulseColor: { value: new THREE.Color('#FACC15') },
          uPulseProgress: { value: -1.0 },
          uTime: { value: 0 },
          uOpacity: { value: 0.94 }
        },
        transparent: true,
        side: THREE.FrontSide
      });

      const branches: DendriteBranch[] = [];
      const subBranches: DendriteBranch[] = [];

      cfg.branches.forEach((bConf, bIdx) => {
        const dir = bConf.dir.clone().normalize();
        const p0 = cfg.pos.clone().add(dir.clone().multiplyScalar(cfg.radius * 0.85));
        const c1 = bConf.curls[0] || new THREE.Vector3();
        const c2 = bConf.curls[1] || c1;

        const p1 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.25)).add(c1.clone().multiplyScalar(0.4));
        const p2 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.55)).add(c2.clone().multiplyScalar(0.8));
        const p3 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.8)).add(c1.clone().multiplyScalar(1.2));
        const p4 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len)).add(c2.clone().multiplyScalar(1.5));

        const mainCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, 'centripetal');
        const mainGeo = createTaperedDendriteGeometry(mainCurve, 46, bConf.startR, bConf.endR, 10);

        const branchMat = new THREE.ShaderMaterial({
          vertexShader: BioNerveShader.vertexShader,
          fragmentShader: BioNerveShader.fragmentShader,
          uniforms: {
            uBaseColor: { value: cfg.baseColor },
            uRimColor: { value: cfg.rimColor },
            uPulseColor: { value: new THREE.Color('#FACC15') },
            uPulseProgress: { value: -1.0 },
            uTime: { value: 0 },
            uOpacity: { value: 0.90 }
          },
          transparent: true,
          side: THREE.FrontSide
        });

        // ── STRICTLY ONE SIGNAL PER BRANCH (Slow & Graceful Biological Speed) ──
        // Stagger initial progress across branches so signals fire organically
        const initialProgress = ((cIdx * 7 + bIdx * 3) % 10) / 10 - 0.2;
        const mainPulse = {
          progress: initialProgress,
          speed: 0.06 + Math.random() * 0.03, // Takes ~15 seconds to travel length of nerve
          restPeriod: 0.4 + Math.random() * 0.4 // Refractory rest pause
        };

        branchCounter++;
        boutonCounter++;

        const mainBranchItem: DendriteBranch = {
          curve: mainCurve,
          geo: mainGeo,
          terminalPos: p4,
          material: branchMat,
          pulse: mainPulse
        };

        branches.push(mainBranchItem);
        branchList.push(mainBranchItem);

        // ── DENDRITIC ARBORIZATION: Realistic Fine Daughter Sub-Branches ──
        if (bConf.len > 7.5) {
          const splitT = 0.45 + Math.random() * 0.18;
          const subStart = mainCurve.getPointAt(splitT);
          const subTangent = mainCurve.getTangentAt(splitT);
          const sideVec = new THREE.Vector3(-subTangent.y, subTangent.x, subTangent.z * 0.6).normalize();

          const subMid = subStart.clone().add(subTangent.clone().multiplyScalar(2.2)).add(sideVec.clone().multiplyScalar(1.4));
          const subEnd = subMid.clone().add(subTangent.clone().multiplyScalar(2.0)).add(sideVec.clone().multiplyScalar(1.0));

          const subCurve = new THREE.CatmullRomCurve3([subStart, subMid, subEnd], false, 'centripetal');
          const subGeo = createTaperedDendriteGeometry(subCurve, 30, bConf.startR * 0.65, bConf.endR * 0.85, 8);
          const subMat = branchMat.clone();

          const subPulse = {
            progress: (initialProgress + 0.4) % 1.0 - 0.2,
            speed: 0.07 + Math.random() * 0.03,
            restPeriod: 0.45 + Math.random() * 0.4
          };

          branchCounter++;
          boutonCounter++;

          const subBranchItem: DendriteBranch = {
            curve: subCurve,
            geo: subGeo,
            terminalPos: subEnd,
            material: subMat,
            pulse: subPulse
          };

          subBranches.push(subBranchItem);
          branchList.push(subBranchItem);
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
      totalBranches: branchCounter,
      totalBoutons: boutonCounter,
      allBranches: branchList
    };
  }, []);

  // ─── 5. FLOATING MICRO-VESICLE CYTOPLASM PARTICLES (Bio-fluid Depth) ───
  const cytoplasmField = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyanBio = new THREE.Color('#38BDF8');
    const goldBio = new THREE.Color('#FACC15');
    const whiteBio = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = -4 - Math.random() * 28;

      const r = Math.random();
      const col = r < 0.6 ? cyanBio : r < 0.88 ? goldBio : whiteBio;
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const zeroMatrix = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);

  // Initialize instanced matrices to 0
  React.useEffect(() => {
    if (sparkCoreRef.current) {
      for (let i = 0; i < totalBranches; i++) {
        sparkCoreRef.current.setMatrixAt(i, zeroMatrix);
      }
      sparkCoreRef.current.instanceMatrix.needsUpdate = true;
    }
    if (sparkHaloRef.current) {
      for (let i = 0; i < totalBranches; i++) {
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
  }, [totalBranches, totalBoutons, zeroMatrix]);

  // ─── 6. 60 FPS REAL-TIME BIOLOGICAL SIMULATION LOOP ───
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // A. Slow, majestic global microscopic fluid drift
    if (masterGroupRef.current) {
      masterGroupRef.current.rotation.y = Math.sin(time * 0.05) * 0.03;
      masterGroupRef.current.rotation.x = Math.cos(time * 0.04) * 0.02;
      masterGroupRef.current.position.y = Math.sin(time * 0.12) * 0.10;
    }

    // B. Organic Somas Breathing / Respiration
    neurons.forEach((neuron, idx) => {
      const g = somaRefs.current[idx];
      if (g) {
        const pulse = 1.0 + Math.sin(time * 1.4 + idx * 1.1) * 0.025;
        g.scale.set(pulse, pulse, pulse);
      }
      neuron.somaMaterial.uniforms.uTime.value = time;
    });

    // C. Propagate EXACTLY ONE Signal Per Axon (Slow & Graceful)
    let branchIdx = 0;
    let boutonIdx = 0;

    allBranches.forEach(branch => {
      const p = branch.pulse;
      p.progress += delta * p.speed;

      // When impulse reaches the terminal, trigger flash and refractory resting pause
      if (p.progress > 1.05) {
        p.progress = -p.restPeriod; // Refractory rest pause
      }

      // Update shader uniform to light up nerve fiber from inside
      branch.material.uniforms.uPulseProgress.value = p.progress;
      branch.material.uniforms.uTime.value = time;

      // Position the Single Traveling Electrical Action Potential
      if (p.progress >= 0.0 && p.progress <= 1.0) {
        const pos = branch.curve.getPointAt(p.progress);

        // Core Hot White-Gold Spark
        if (sparkCoreRef.current) {
          const coreScale = 0.14 + Math.sin(p.progress * Math.PI) * 0.06;
          tempMatrix.makeScale(coreScale, coreScale, coreScale);
          tempMatrix.setPosition(pos);
          sparkCoreRef.current.setMatrixAt(branchIdx, tempMatrix);
        }

        // Radiant Warm Golden Corona Halo (Plasma Aura)
        if (sparkHaloRef.current) {
          const haloScale = (0.14 + Math.sin(p.progress * Math.PI) * 0.06) * 3.2;
          tempMatrix.makeScale(haloScale, haloScale, haloScale);
          tempMatrix.setPosition(pos);
          sparkHaloRef.current.setMatrixAt(branchIdx, tempMatrix);
        }
      } else {
        // Inactive during refractory rest
        if (sparkCoreRef.current) sparkCoreRef.current.setMatrixAt(branchIdx, zeroMatrix);
        if (sparkHaloRef.current) sparkHaloRef.current.setMatrixAt(branchIdx, zeroMatrix);
      }

      // Synaptic Bouton (Flashes brightly when impulse arrives at tip)
      if (boutonRef.current && boutonIdx < totalBoutons) {
        const isFiring = p.progress >= 0.92 && p.progress <= 1.05;
        const bScale = isFiring ? 0.22 : 0.09 + Math.sin(time * 1.8 + boutonIdx) * 0.012;

        tempMatrix.makeScale(bScale, bScale, bScale);
        tempMatrix.setPosition(branch.terminalPos);
        boutonRef.current.setMatrixAt(boutonIdx, tempMatrix);
        boutonIdx++;
      }

      branchIdx++;
    });

    if (sparkCoreRef.current) sparkCoreRef.current.instanceMatrix.needsUpdate = true;
    if (sparkHaloRef.current) sparkHaloRef.current.instanceMatrix.needsUpdate = true;
    if (boutonRef.current) boutonRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* ─── MICROSCOPIC DARKFIELD CELLULAR ATMOSPHERE ─── */}
      <color attach="background" args={['#010716']} />
      <fog attach="fog" args={['#010716', 12, 44]} />

      {/* Fluorescent Darkfield Microscope Lighting */}
      <ambientLight intensity={0.75} color="#072b4a" />
      <directionalLight position={[14, 16, 8]} intensity={2.4} color="#FEF08A" />
      <directionalLight position={[-16, -12, -8]} intensity={3.6} color="#00B4D8" />
      
      {/* Local Bioluminescent Highlights */}
      <pointLight position={[10.5, 4.2, -5.5]} intensity={2.5} color="#FACC15" distance={18} />
      <pointLight position={[-11.5, 1.5, -7.5]} intensity={2.4} color="#00B4D8" distance={18} />
      <pointLight position={[3.5, -7.0, -9.5]} intensity={2.0} color="#FACC15" distance={16} />

      {/* Floating Microscopic Cytoplasm Bokeh Particles */}
      <points geometry={cytoplasmField}>
        <pointsMaterial
          size={0.13}
          vertexColors
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Master 3D Biological Neural Cortex */}
      <group ref={masterGroupRef}>
        {neurons.map((neuron, nIdx) => (
          <group key={neuron.id}>
            {/* ─── SOMA (AMOEBIC MULTIPOLAR CELL BODY & NUCLEUS) ─── */}
            <group
              ref={el => { somaRefs.current[nIdx] = el; }}
              position={neuron.pos}
            >
              {/* Outer Translucent Biological Cell Membrane with Fresnel Shader */}
              <mesh geometry={neuron.somaGeo} material={neuron.somaMaterial} />

              {/* Glowing Inner Bio-Nucleus (Reference Image 2) */}
              <mesh>
                <sphereGeometry args={[neuron.radius * 0.45, 24, 24]} />
                <meshBasicMaterial
                  color={neuron.nucleusColor}
                  transparent
                  opacity={0.85}
                />
              </mesh>

              {/* Smooth Flared Root Cones connecting soma to dendrites */}
              {neuron.branches.map((b, bIdx) => {
                const tangent = b.curve.getTangentAt(0);
                const rootPos = tangent.clone().multiplyScalar(neuron.radius * 0.72);
                return (
                  <mesh key={`root-${bIdx}`} position={rootPos}>
                    <sphereGeometry args={[neuron.radius * 0.30, 16, 16]} />
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

            {/* ─── TAPERED DENDRITES & AXONS (Smooth Tapered Meshes) ─── */}
            {neuron.branches.map((b, bIdx) => (
              <mesh key={`b-${bIdx}`} geometry={b.geo} material={b.material} />
            ))}

            {/* ─── DENDRITIC ARBORIZATION (Fine Daughter Sub-Branches) ─── */}
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
            emissiveIntensity={2.8}
            roughness={0.1}
            metalness={0.2}
          />
        </instancedMesh>

        {/* ─── SINGLE ACTION POTENTIAL CORE (Hot White-Gold Energy Spark) ─── */}
        <instancedMesh
          ref={sparkCoreRef}
          args={[undefined, undefined, totalBranches]}
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
          args={[undefined, undefined, totalBranches]}
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
