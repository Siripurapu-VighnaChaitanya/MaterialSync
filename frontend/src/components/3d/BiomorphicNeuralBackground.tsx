import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── 1. PROCEDURAL TAPERED BIOLOGICAL DENDRITE GEOMETRY ───
// Uses Parallel Transport Frames for zero-twist, organically tapering biological nerve fibers
function createTaperedDendriteGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments = 44,
  startRadius = 0.22,
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
    // Organic power curve: thick root, gradual tapering, ultra-fine terminal tendril
    const currentRadius = THREE.MathUtils.lerp(startRadius, endRadius, Math.pow(progress, 0.7));
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

// ─── 2. BIOLOGICAL FRESNEL SHADER WITH SINGLE ACTION POTENTIAL WAVE ───
const BioAxonShader = {
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
    uniform float uPulseProgress; // -1.0 to 1.0 (negative during resting refractory period)
    uniform float uTime;
    uniform float uOpacity;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Microscopic Darkfield Fresnel Rim Illumination
      float NdotV = max(dot(normal, viewDir), 0.0);
      float fresnel = pow(1.0 - NdotV, 2.3);

      // Biological Membrane: Deep bio-indigo interior with translucent electric cyan rim
      vec3 membrane = mix(uBaseColor, uRimColor, fresnel * 0.88 + 0.12);

      // Single Traveling Action Potential (fiber lights up from inside as pulse passes)
      float electricPulse = 0.0;
      if (uPulseProgress >= 0.0 && uPulseProgress <= 1.0) {
        float dist = abs(vUv.x - uPulseProgress);
        electricPulse = exp(-dist * dist * 32.0) * 2.2;
      }

      // Subtle biological membrane micro-shimmer
      float shimmer = sin(vUv.y * 24.0 + uTime * 1.5) * 0.035;
      vec3 finalColor = membrane + electricPulse * uPulseColor + shimmer * uRimColor;

      float alpha = clamp(uOpacity * (0.65 + fresnel * 0.35 + electricPulse * 0.35), 0.0, 1.0);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// ─── 3. DATA TYPES ───
interface AxonBranch {
  curve: THREE.CatmullRomCurve3;
  geo: THREE.BufferGeometry;
  terminalPos: THREE.Vector3;
  material: THREE.ShaderMaterial;
  // EXACTLY ONE signal per axon
  pulse: {
    progress: number; // >= 0: traveling; < 0: resting in refractory period
    speed: number;    // Slow, graceful biological speed
    restDuration: number;
  };
  myelinSheaths?: { pos: THREE.Vector3; rot: THREE.Euler }[];
}

interface BioNeuron {
  id: number;
  pos: THREE.Vector3;
  radius: number;
  somaGeo: THREE.BufferGeometry;
  somaMaterial: THREE.ShaderMaterial;
  nucleusColor: string;
  branches: AxonBranch[];
}

export const BiomorphicNeuralBackground: React.FC = () => {
  const masterGroupRef = useRef<THREE.Group>(null);
  const sparkCoreRef = useRef<THREE.InstancedMesh>(null);
  const sparkHaloRef = useRef<THREE.InstancedMesh>(null);
  const boutonRef = useRef<THREE.InstancedMesh>(null);
  const somaRefs = useRef<(THREE.Group | null)[]>([]);

  // ─── 4. BUILD EXPANDED 12-NEURON BIOLOGICAL CORTEX ───
  const { neurons, totalAxons, totalBoutons, allAxons } = useMemo(() => {
    // 12 Neurons in 3 Depth Layers (Foreground, Midground, Deep Background)
    const configs = [
      // ── FOREGROUND LAYER (Sharp, prominent, detailed somas & axons) ──
      // 1. Hero Upper-Right Multipolar Neuron (Reference 1 & 2 Right Side)
      {
        id: 1,
        pos: new THREE.Vector3(6.5, 2.2, -6.5),
        radius: 1.45,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.95, -0.3, 0.2), len: 9.2, startR: 0.24, endR: 0.03, curls: [new THREE.Vector3(-0.6, 0.8, -0.7), new THREE.Vector3(-0.9, -0.5, 0.7)], hasMyelin: true },
          { dir: new THREE.Vector3(-0.65, -0.75, 0.15), len: 8.0, startR: 0.18, endR: 0.025, curls: [new THREE.Vector3(-0.5, -0.7, 0.6)] },
          { dir: new THREE.Vector3(-0.35, 0.9, -0.2), len: 6.2, startR: 0.16, endR: 0.025, curls: [new THREE.Vector3(-0.3, 0.6, 0.5)] },
          { dir: new THREE.Vector3(0.6, -0.75, 0.2), len: 5.5, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(0.5, -0.4, -0.4)] },
          { dir: new THREE.Vector3(0.85, 0.35, -0.2), len: 5.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(0.4, 0.3, 0.4)] }
        ]
      },
      // 2. Foreground Left Neuron
      {
        id: 2,
        pos: new THREE.Vector3(-7.2, -0.5, -7.5),
        radius: 1.35,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#38BDF8'),
        branches: [
          { dir: new THREE.Vector3(0.9, 0.4, 0.15), len: 9.5, startR: 0.22, endR: 0.03, curls: [new THREE.Vector3(0.7, -0.6, 0.7), new THREE.Vector3(0.9, 0.5, -0.6)], hasMyelin: true },
          { dir: new THREE.Vector3(0.7, -0.7, 0.2), len: 7.5, startR: 0.17, endR: 0.025, curls: [new THREE.Vector3(0.5, -0.6, 0.5)] },
          { dir: new THREE.Vector3(0.3, 0.95, -0.2), len: 6.5, startR: 0.15, endR: 0.025, curls: [new THREE.Vector3(0.3, 0.7, -0.4)] },
          { dir: new THREE.Vector3(-0.8, -0.5, 0.3), len: 5.2, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(-0.4, -0.4, 0.3)] }
        ]
      },
      // 3. Foreground Top-Center Neuron
      {
        id: 3,
        pos: new THREE.Vector3(-1.2, 5.0, -8.5),
        radius: 1.25,
        nucleusColor: '#d97706',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#06B6D4'),
        branches: [
          { dir: new THREE.Vector3(0.65, -0.75, 0.15), len: 8.2, startR: 0.20, endR: 0.025, curls: [new THREE.Vector3(0.5, -0.8, 0.6)] },
          { dir: new THREE.Vector3(-0.75, -0.65, 0.2), len: 7.8, startR: 0.18, endR: 0.025, curls: [new THREE.Vector3(-0.6, -0.5, -0.5)] },
          { dir: new THREE.Vector3(0.3, 0.8, -0.3), len: 5.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(0.3, 0.5, 0.3)] }
        ]
      },

      // ── MIDGROUND LAYER (Connecting neural pathways & synapses) ──
      // 4. Midground Right-Bottom
      {
        id: 4,
        pos: new THREE.Vector3(4.2, -4.5, -11.5),
        radius: 1.1,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.8, 0.6, 0.2), len: 7.8, startR: 0.16, endR: 0.025, curls: [new THREE.Vector3(-0.6, 0.7, -0.5)] },
          { dir: new THREE.Vector3(0.5, 0.85, -0.2), len: 6.5, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(0.4, 0.6, 0.4)] },
          { dir: new THREE.Vector3(-0.5, -0.85, 0.15), len: 5.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(-0.3, -0.5, 0.3)] }
        ]
      },
      // 5. Midground Left-Top
      {
        id: 5,
        pos: new THREE.Vector3(-5.5, 3.6, -12.5),
        radius: 1.05,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#38BDF8'),
        branches: [
          { dir: new THREE.Vector3(0.85, -0.5, 0.2), len: 8.0, startR: 0.16, endR: 0.025, curls: [new THREE.Vector3(0.6, -0.6, 0.5)] },
          { dir: new THREE.Vector3(-0.6, 0.8, -0.2), len: 6.0, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(-0.4, 0.5, 0.3)] },
          { dir: new THREE.Vector3(0.4, 0.9, 0.15), len: 5.2, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(0.3, 0.6, -0.4)] }
        ]
      },
      // 6. Midground Bottom-Left
      {
        id: 6,
        pos: new THREE.Vector3(-2.8, -5.2, -13.5),
        radius: 1.0,
        nucleusColor: '#d97706',
        baseColor: new THREE.Color('#021124'),
        rimColor: new THREE.Color('#06B6D4'),
        branches: [
          { dir: new THREE.Vector3(0.7, 0.7, 0.2), len: 7.5, startR: 0.15, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.6, -0.4)] },
          { dir: new THREE.Vector3(-0.8, 0.55, -0.2), len: 6.8, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(-0.5, 0.4, 0.3)] }
        ]
      },
      // 7. Midground Center-Right
      {
        id: 7,
        pos: new THREE.Vector3(1.8, -0.8, -14.5),
        radius: 0.95,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#031528'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.7, -0.7, 0.2), len: 7.2, startR: 0.14, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.5, 0.4)] },
          { dir: new THREE.Vector3(0.8, 0.6, -0.2), len: 6.5, startR: 0.13, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.4, -0.3)] }
        ]
      },

      // ── DEEP BACKGROUND LAYER (Soft blurred depth-of-field silhouettes) ──
      // 8. Deep Upper-Right
      {
        id: 8,
        pos: new THREE.Vector3(8.5, 5.5, -19.0),
        radius: 0.85,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(-0.8, -0.6, 0.2), len: 7.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(-0.5, -0.5, 0.4)] },
          { dir: new THREE.Vector3(-0.3, -0.9, -0.2), len: 6.2, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(-0.2, -0.6, -0.3)] }
        ]
      },
      // 9. Deep Upper-Left
      {
        id: 9,
        pos: new THREE.Vector3(-9.0, 5.0, -21.0),
        radius: 0.8,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(0.85, -0.5, 0.2), len: 7.5, startR: 0.12, endR: 0.02, curls: [new THREE.Vector3(0.5, -0.4, 0.4)] },
          { dir: new THREE.Vector3(0.5, 0.85, -0.2), len: 5.8, startR: 0.10, endR: 0.02, curls: [new THREE.Vector3(0.3, 0.5, -0.3)] }
        ]
      },
      // 10. Deep Bottom-Center
      {
        id: 10,
        pos: new THREE.Vector3(0.0, -6.5, -23.0),
        radius: 0.8,
        nucleusColor: '#d97706',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(0.6, 0.8, 0.2), len: 7.0, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(0.4, 0.5, -0.3)] },
          { dir: new THREE.Vector3(-0.6, 0.8, -0.2), len: 6.5, startR: 0.11, endR: 0.02, curls: [new THREE.Vector3(-0.4, 0.5, 0.3)] }
        ]
      },
      // 11. Deep Far-Right
      {
        id: 11,
        pos: new THREE.Vector3(9.2, -2.5, -25.0),
        radius: 0.75,
        nucleusColor: '#0284c7',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#00B4D8'),
        branches: [
          { dir: new THREE.Vector3(-0.85, 0.5, 0.2), len: 7.2, startR: 0.10, endR: 0.02, curls: [new THREE.Vector3(-0.5, 0.4, 0.3)] }
        ]
      },
      // 12. Deep Far-Left
      {
        id: 12,
        pos: new THREE.Vector3(-9.5, -3.0, -26.0),
        radius: 0.75,
        nucleusColor: '#9333ea',
        baseColor: new THREE.Color('#010e1c'),
        rimColor: new THREE.Color('#0284C7'),
        branches: [
          { dir: new THREE.Vector3(0.85, 0.5, 0.2), len: 7.0, startR: 0.10, endR: 0.02, curls: [new THREE.Vector3(0.5, 0.4, -0.3)] }
        ]
      }
    ];

    let axonCounter = 0;
    let boutonCounter = 0;
    const axonList: AxonBranch[] = [];

    const neuronList: BioNeuron[] = configs.map((cfg, cIdx) => {
      // ── Organic Multi-Lobed Biological Soma ──
      const somaGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const posAttr = somaGeo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        // Smooth metabolic cellular deformation
        const noise = Math.sin(v.x * 2.8) * Math.cos(v.y * 2.8) * Math.sin(v.z * 2.8) * 0.15;
        v.multiplyScalar(1.0 + noise);
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      somaGeo.computeVertexNormals();

      const somaMat = new THREE.ShaderMaterial({
        vertexShader: BioAxonShader.vertexShader,
        fragmentShader: BioAxonShader.fragmentShader,
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

      const branches: AxonBranch[] = [];

      cfg.branches.forEach((bConf, bIdx) => {
        const dir = bConf.dir.clone().normalize();
        const p0 = cfg.pos.clone().add(dir.clone().multiplyScalar(cfg.radius * 0.85));
        const c1 = bConf.curls[0] || new THREE.Vector3();
        const c2 = bConf.curls[1] || c1;

        const p1 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.25)).add(c1.clone().multiplyScalar(0.4));
        const p2 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.55)).add(c2.clone().multiplyScalar(0.8));
        const p3 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len * 0.8)).add(c1.clone().multiplyScalar(1.2));
        const p4 = cfg.pos.clone().add(dir.clone().multiplyScalar(bConf.len)).add(c2.clone().multiplyScalar(1.5));

        const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, 'centripetal');
        const geo = createTaperedDendriteGeometry(curve, 44, bConf.startR, bConf.endR, 10);

        // Segmented Myelin Sheaths along main axons (Reference Image 2)
        const myelinSheaths: { pos: THREE.Vector3; rot: THREE.Euler }[] = [];
        if (bConf.hasMyelin) {
          for (let m = 0.16; m <= 0.72; m += 0.11) {
            const pt = curve.getPointAt(m);
            const tan = curve.getTangentAt(m);
            const rot = new THREE.Euler(
              Math.atan2(tan.y, Math.sqrt(tan.x * tan.x + tan.z * tan.z)),
              Math.atan2(-tan.x, -tan.z),
              0
            );
            myelinSheaths.push({ pos: pt, rot });
          }
        }

        const branchMat = new THREE.ShaderMaterial({
          vertexShader: BioAxonShader.vertexShader,
          fragmentShader: BioAxonShader.fragmentShader,
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

        // ── EXACTLY ONE SIGNAL PER AXON: Slow, graceful, biological rhythm ──
        // Spreads out initial progress so signals fire sequentially rather than all at once
        const initialProgress = ((cIdx * 7 + bIdx * 3) % 10) / 10 - 0.2;
        const branchPulse = {
          progress: initialProgress,
          speed: 0.065 + Math.random() * 0.035, // Slow, majestic biological velocity (~14s per cycle)
          restDuration: 0.35 + Math.random() * 0.45 // Natural refractory period
        };

        axonCounter++;
        boutonCounter++;

        const branchItem: AxonBranch = {
          curve,
          geo,
          terminalPos: p4,
          material: branchMat,
          pulse: branchPulse,
          myelinSheaths
        };

        branches.push(branchItem);
        axonList.push(branchItem);
      });

      return {
        id: cfg.id,
        pos: cfg.pos,
        radius: cfg.radius,
        somaGeo,
        somaMaterial: somaMat,
        nucleusColor: cfg.nucleusColor,
        branches
      };
    });

    return {
      neurons: neuronList,
      totalAxons: axonCounter,
      totalBoutons: boutonCounter,
      allAxons: axonList
    };
  }, []);

  // ─── 5. FLOATING MICRO-CYTOPLASM BOKEH PARTICLES (Bio-fluid Depth) ───
  const cytoplasmField = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const cyanBio = new THREE.Color('#38BDF8');
    const goldBio = new THREE.Color('#FACC15');
    const whiteBio = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 28;
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

  // Initialize all instanced matrices to 0 to prevent any stray artifacts
  React.useEffect(() => {
    if (sparkCoreRef.current) {
      for (let i = 0; i < totalAxons; i++) {
        sparkCoreRef.current.setMatrixAt(i, zeroMatrix);
      }
      sparkCoreRef.current.instanceMatrix.needsUpdate = true;
    }
    if (sparkHaloRef.current) {
      for (let i = 0; i < totalAxons; i++) {
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
  }, [totalAxons, totalBoutons, zeroMatrix]);

  // ─── 6. 60 FPS BIOLOGICAL SIMULATION LOOP ───
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // A. Slow, majestic global fluid drift
    if (masterGroupRef.current) {
      masterGroupRef.current.rotation.y = Math.sin(time * 0.05) * 0.03;
      masterGroupRef.current.rotation.x = Math.cos(time * 0.04) * 0.02;
      masterGroupRef.current.position.y = Math.sin(time * 0.12) * 0.10;
    }

    // B. Somas Organic Respiration / Pulsation
    neurons.forEach((neuron, idx) => {
      const g = somaRefs.current[idx];
      if (g) {
        const pulse = 1.0 + Math.sin(time * 1.4 + idx * 1.1) * 0.025;
        g.scale.set(pulse, pulse, pulse);
      }
      neuron.somaMaterial.uniforms.uTime.value = time;
    });

    // C. Propagate Exactly ONE Action Potential per Axon (Slow & Graceful)
    let axonIdx = 0;
    let boutonIdx = 0;

    allAxons.forEach(axon => {
      const p = axon.pulse;
      p.progress += delta * p.speed;

      // When impulse completes journey, trigger terminal flash and refractory rest
      if (p.progress > 1.05) {
        p.progress = -p.restDuration; // Refractory delay before next action potential
      }

      // Update shader uniform to light up nerve fiber as pulse glides along it
      axon.material.uniforms.uPulseProgress.value = p.progress;
      axon.material.uniforms.uTime.value = time;

      // ── Position the Single Traveling Electrical Spark ──
      if (p.progress >= 0.0 && p.progress <= 1.0) {
        const pos = axon.curve.getPointAt(p.progress);

        // Hot White-Gold Core (Luminous particle)
        if (sparkCoreRef.current) {
          const coreScale = 0.14 + Math.sin(p.progress * Math.PI) * 0.06;
          tempMatrix.makeScale(coreScale, coreScale, coreScale);
          tempMatrix.setPosition(pos);
          sparkCoreRef.current.setMatrixAt(axonIdx, tempMatrix);
        }

        // Radiant Warm Golden Halo (Plasma Corona)
        if (sparkHaloRef.current) {
          const haloScale = (0.14 + Math.sin(p.progress * Math.PI) * 0.06) * 3.2;
          tempMatrix.makeScale(haloScale, haloScale, haloScale);
          tempMatrix.setPosition(pos);
          sparkHaloRef.current.setMatrixAt(axonIdx, tempMatrix);
        }
      } else {
        // Hide spark during refractory rest period
        if (sparkCoreRef.current) sparkCoreRef.current.setMatrixAt(axonIdx, zeroMatrix);
        if (sparkHaloRef.current) sparkHaloRef.current.setMatrixAt(axonIdx, zeroMatrix);
      }

      // ── Synaptic Bouton (Flashes brightly when impulse arrives at tip) ──
      if (boutonRef.current && boutonIdx < totalBoutons) {
        const isFiring = p.progress >= 0.92 && p.progress <= 1.05;
        const bScale = isFiring ? 0.20 : 0.09 + Math.sin(time * 1.8 + boutonIdx) * 0.012;

        tempMatrix.makeScale(bScale, bScale, bScale);
        tempMatrix.setPosition(axon.terminalPos);
        boutonRef.current.setMatrixAt(boutonIdx, tempMatrix);
        boutonIdx++;
      }

      axonIdx++;
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
      <directionalLight position={[12, 14, 8]} intensity={2.4} color="#FEF08A" />
      <directionalLight position={[-14, -10, -8]} intensity={3.6} color="#00B4D8" />
      
      {/* Local Bioluminescent Highlights */}
      <pointLight position={[6.5, 2.2, -4.5]} intensity={2.5} color="#FACC15" distance={16} />
      <pointLight position={[-7.2, -0.5, -5.5]} intensity={2.4} color="#00B4D8" distance={16} />
      <pointLight position={[-1.2, 5.0, -6.5]} intensity={2.0} color="#FACC15" distance={14} />

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

              {/* Smooth Flared Root Cones connecting soma to axons */}
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

            {/* ─── MYELIN SHEATH CYLINDERS (Reference Image 2) ─── */}
            {neuron.branches.map(b =>
              b.myelinSheaths?.map((m, mIdx) => (
                <mesh key={`myelin-${mIdx}`} position={m.pos} rotation={m.rot}>
                  <cylinderGeometry args={[0.15, 0.15, 0.32, 16]} />
                  <meshStandardMaterial
                    color="#38BDF8"
                    emissive="#0284C7"
                    emissiveIntensity={0.45}
                    roughness={0.25}
                    metalness={0.45}
                  />
                </mesh>
              ))
            )}
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
          args={[undefined, undefined, totalAxons]}
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
          args={[undefined, undefined, totalAxons]}
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
