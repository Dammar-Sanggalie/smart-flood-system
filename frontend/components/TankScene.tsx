// ──────────────────────────────────────────────────
// components/TankScene.tsx — Precision Industrial 3D Digital Twin
// Enhanced with aquarium water effects: bubbles, gravel, caustics
// ──────────────────────────────────────────────────
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { TankConfig, WaterStatus } from '@/types';

// ── Water Color Palette ───────────────────────────
// Always blue — water color does not change with status
const WATER_BLUE = '#0284c7';
const WATER_COLORS: Record<string, string> = {
  SAFE: WATER_BLUE,
  WARNING: WATER_BLUE,
  DANGER: WATER_BLUE,
  UNKNOWN: WATER_BLUE,
  INVALID: WATER_BLUE,
};

function getWaterHex(_status: WaterStatus): string {
  return WATER_BLUE;
}

// ── Rising Bubbles ─────────────────────────────────
function Bubbles({
  width,
  depth,
  tankH,
  waterHeight,
  count = 18,
}: {
  width: number;
  depth: number;
  tankH: number;
  waterHeight: number;
  count?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bubbles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * width * 0.8,
      z: (Math.random() - 0.5) * depth * 0.8,
      speed: 0.015 + Math.random() * 0.025,
      size: 0.004 + Math.random() * 0.006,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.002 + Math.random() * 0.004,
      startY: Math.random(),
    }));
  }, [width, depth, count]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const surfaceY = -tankH / 2 + waterHeight;
    const bottomY = -tankH / 2 + 0.01;

    groupRef.current.children.forEach((child, i) => {
      const b = bubbles[i];
      if (!b) return;
      // progress from bottom (0) to surface (1)
      let progress = (b.startY + t * b.speed * 2) % 1;
      const y = bottomY + progress * (surfaceY - bottomY);

      child.position.y = y;
      child.position.x = b.x + Math.sin(t * 1.5 + b.wobblePhase) * b.wobbleAmp;
      child.position.z = b.z + Math.cos(t * 1.2 + b.wobblePhase) * b.wobbleAmp;

      // Scale: small at bottom, grow slightly, shrink at surface
      const scaleMod = 1 + Math.sin(progress * Math.PI) * 0.3;
      child.scale.setScalar(b.size * scaleMod);

      // Opacity: fade in at bottom, fade out near surface
      const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
      if (mat) {
        mat.opacity = Math.sin(progress * Math.PI) * 0.6;
      }
    });
  });

  if (waterHeight < 0.02) return null;

  return (
    <group ref={groupRef}>
      {bubbles.map((b, i) => (
        <mesh key={i} position={[b.x, 0, b.z]} scale={b.size}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.4}
            roughness={0}
            metalness={0}
            transmission={0.9}
            ior={1.33}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Gravel / Substrate at bottom ──────────────────
function Gravel({ w, d }: { w: number; d: number }) {
  const stones = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; color: string }[] = [];
    const colors = ['#94a3b8', '#a8a29e', '#cbd5e1', '#bcaaa4', '#d6d3d1', '#78716c'];
    const count = Math.floor((w * d) / 0.0025);
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: [
          (Math.random() - 0.5) * w * 0.92,
          -0.004,
          (Math.random() - 0.5) * d * 0.92,
        ],
        scale: 0.005 + Math.random() * 0.007,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return arr;
  }, [w, d]);

  return (
    <group>
      {/* Substrate base layer */}
      <mesh position={[0, -0.008, 0]}>
        <boxGeometry args={[w * 0.96, 0.012, d * 0.96]} />
        <meshStandardMaterial color="#a8a29e" roughness={1} metalness={0} />
      </mesh>
      {/* Individual stones */}
      {stones.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.scale}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={s.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Caustics Light Pattern on floor ────────────────
function CausticsLight({
  width,
  depth,
  tankH,
  waterHeight,
}: {
  width: number;
  depth: number;
  tankH: number;
  waterHeight: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(width * 0.94, depth * 0.94, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, depth]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    // Animate opacity for shimmering caustics effect
    matRef.current.opacity = 0.04 + Math.sin(t * 0.8) * 0.02 + Math.cos(t * 1.3) * 0.015;
  });

  if (waterHeight < 0.02) return null;

  return (
    <mesh ref={meshRef} geometry={geom} position={[0, -tankH / 2 + 0.001, 0]}>
      <meshBasicMaterial
        ref={matRef}
        color="#7dd3fc"
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Animated Water Surface Wave ───────────────────
function WaterSurface({
  meshRef,
  width,
  depth,
  tankH,
  color,
}: {
  meshRef: React.RefObject<THREE.Mesh>;
  width: number;
  depth: number;
  tankH: number;
  color: string;
}) {
  const surfaceRef = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 40, 40);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, depth]);

  const basePositions = useMemo(() => {
    return geom.attributes.position.array.slice();
  }, [geom]);

  useFrame(({ clock }) => {
    if (!surfaceRef.current || !meshRef.current) return;
    const t = clock.getElapsedTime();

    const waterScaleY = meshRef.current.scale.y;
    const waterY = -tankH / 2 + tankH * waterScaleY;
    surfaceRef.current.position.y = waterY;

    const pos = surfaceRef.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = basePositions[ix];
      const z = basePositions[ix + 2];
      // Multi-frequency wave for realistic water surface
      pos.array[ix + 1] =
        Math.sin(x * 8 + t * 2.2) * 0.004 +
        Math.cos(z * 8 + t * 1.8) * 0.004 +
        Math.sin((x + z) * 12 + t * 3) * 0.002 +
        Math.cos(x * 5 - z * 7 + t * 1.5) * 0.002;
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <mesh ref={surfaceRef} geometry={geom}>
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.85}
        roughness={0.05}
        metalness={0.15}
        side={THREE.DoubleSide}
        emissive={color}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

// ── Water Body (Dynamic Fluid Mesh) ───────────────
function WaterBody({
  targetFill,
  tankW,
  tankD,
  tankH,
  status,
  frozen,
}: {
  targetFill: number;
  tankW: number;
  tankD: number;
  tankH: number;
  status: WaterStatus;
  frozen: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentFillRef = useRef(targetFill);
  const colorRef = useRef(new THREE.Color(getWaterHex(status)));
  const targetColorRef = useRef(new THREE.Color(getWaterHex(status)));

  const waterColor = getWaterHex(status);

  useFrame(() => {
    if (!meshRef.current) return;
    targetColorRef.current.set(getWaterHex(status));

    if (!frozen) {
      currentFillRef.current += (targetFill - currentFillRef.current) * 0.06;
      colorRef.current.lerp(targetColorRef.current, 0.06);
    }

    const waterHeight = Math.max(currentFillRef.current * tankH, 0.001);
    meshRef.current.scale.y = waterHeight / tankH;
    meshRef.current.position.y = -tankH / 2 + waterHeight / 2;

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color.copy(colorRef.current);
  });

  const innerW = tankW * 0.96;
  const innerD = tankD * 0.96;

  return (
    <>
      <mesh ref={meshRef} position={[0, -tankH / 2, 0]}>
        <boxGeometry args={[innerW, tankH, innerD]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.72}
          roughness={0.1}
          metalness={0.05}
          side={THREE.DoubleSide}
          emissive={waterColor}
          emissiveIntensity={0.06}
          depthWrite={true}
        />
      </mesh>
      {!frozen && targetFill > 0.01 && (
        <WaterSurface
          meshRef={meshRef}
          width={innerW}
          depth={innerD}
          tankH={tankH}
          color={waterColor}
        />
      )}
    </>
  );
}

// ── Water Line Glow Ring ───────────────────────────
function WaterLineGlow({
  width,
  depth,
  tankH,
  waterHeight,
  color,
}: {
  width: number;
  depth: number;
  tankH: number;
  waterHeight: number;
  color: string;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    matRef.current.opacity = 0.15 + Math.sin(t * 2) * 0.05;
  });

  if (waterHeight < 0.01) return null;
  const y = -tankH / 2 + waterHeight;

  return (
    <>
      {/* Front glow line */}
      <mesh position={[0, y, depth / 2 - 0.001]}>
        <planeGeometry args={[width * 0.96, 0.006]} />
        <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ── Precision Reservoir Structure ─────────────────
function ReservoirChamber({ w, h, d }: { w: number; h: number; d: number }) {
  const t = 0.01;

  return (
    <group>
      {/* Reservoir Base Plate (Brushed Titanium / Satin Steel) */}
      <mesh position={[0, -h / 2 - 0.008, 0]}>
        <boxGeometry args={[w + 0.04, 0.016, d + 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Precision corner pillars (Stainless Steel) */}
      {[
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.014, h + 0.01, 0.014]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.75} />
        </mesh>
      ))}

      {/* Subtle edge guide — transparent box, only edges visible */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#38bdf8" lineWidth={1} />
      </mesh>
    </group>
  );
}

// ── Graduated Measurement Scale (Etched Rulers) ────
function MetricScale({
  w,
  h,
  d,
  depthCm,
}: {
  w: number;
  h: number;
  d: number;
  depthCm: number;
}) {
  const steps = 10;
  const ticks = useMemo(() => {
    const arr: { pct: number; y: number; isMajor: boolean; label?: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const pct = (i / steps) * 100;
      const y = -h / 2 + (i / steps) * h;
      const isMajor = i % 2 === 0;
      const label = isMajor ? `${Math.round((pct / 100) * depthCm)}cm` : undefined;
      arr.push({ pct, y, isMajor, label });
    }
    return arr;
  }, [h, depthCm]);

  const scaleX = w / 2 + 0.01;
  const scaleZ = d / 2 + 0.002;

  return (
    <group position={[scaleX, 0, scaleZ]}>
      {ticks.map((t, idx) => (
        <group key={idx} position={[0, t.y, 0]}>
          {/* Tick marker */}
          <mesh position={[t.isMajor ? -0.015 : -0.008, 0, 0]}>
            <boxGeometry args={[t.isMajor ? 0.03 : 0.016, 0.002, 0.001]} />
            <meshBasicMaterial color={t.isMajor ? '#475569' : '#94a3b8'} />
          </mesh>
          {/* Text label */}
          {t.label && (
            <Text
              position={[0.025, 0, 0]}
              fontSize={0.036}
              color="#475569"
              anchorX="left"
              anchorY="middle"
            >
              {t.label}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}

// ── HC-SR04 Ultrasonic Transducer & Mount ─────────
function SensorTransducer({
  tankH,
  sensorOffset,
}: {
  tankH: number;
  sensorOffset: number;
}) {
  const y = tankH / 2 + sensorOffset;

  return (
    <group position={[0, y, 0]}>
      {/* Sensor mounting bracket crossbar */}
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[0.28, 0.008, 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Sensor PCB Body (Engineering Blue) */}
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[0.11, 0.028, 0.045]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Ultrasonic Transmitter & Receiver Transducers */}
      <mesh position={[-0.03, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.022, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.03, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.022, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Transducer mesh face (black centers) */}
      <mesh position={[-0.03, -0.0115, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.002, 24]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.03, -0.0115, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.002, 24]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Sensor label */}
      <Text
        position={[0, 0.052, 0]}
        fontSize={0.032}
        color="#64748b"
        anchorX="center"
        anchorY="bottom"
      >
        HC-SR04 SENSOR
      </Text>
    </group>
  );
}

// ── Ultrasonic Acoustic Measurement Beam ──────────
function UltrasonicBeam({
  sensorY,
  waterY,
  status,
}: {
  sensorY: number;
  waterY: number;
  status: WaterStatus;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const points = useMemo(() => {
    return [new THREE.Vector3(0, sensorY - 0.02, 0), new THREE.Vector3(0, waterY, 0)];
  }, [sensorY, waterY]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const beamColor = status === 'DANGER' ? '#e11d48' : status === 'WARNING' ? '#d97706' : '#0284c7';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const pulse = 1 + Math.sin(t * 4) * 0.15;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity = 0.4 + Math.sin(t * 4) * 0.2;
    }
  });

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineDashedMaterial
          color={beamColor}
          dashSize={0.03}
          gapSize={0.02}
          transparent
          opacity={0.65}
        />
      </lineSegments>
      {/* Pulsing ripple ring on water target point */}
      <mesh ref={ringRef} position={[0, waterY + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.03, 32]} />
        <meshBasicMaterial ref={ringMatRef} color={beamColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Precision 3D Scene Assembly ───────────────────
interface TankSceneProps {
  distanceCm: number;
  waterLevelCm: number;
  fillPercentage: number;
  tankConfig: TankConfig;
  sensorValid: boolean;
  isStale: boolean;
  status: WaterStatus;
}

function Scene({
  fillPercentage,
  tankConfig,
  sensorValid,
  isStale,
  status,
}: TankSceneProps) {
  const SCALE = 1 / 100;
  const tankW = tankConfig.widthCm * SCALE;
  const tankH = tankConfig.depthCm * SCALE;
  const tankD = tankConfig.lengthCm * SCALE;
  const sensorOffset = Math.max(
    (tankConfig.sensorHeightCm - tankConfig.depthCm) * SCALE,
    0.08,
  );
  const sensorY = tankH / 2 + sensorOffset;
  const waterY = -tankH / 2 + (fillPercentage / 100) * tankH;
  const frozen = !sensorValid || isStale;

  // Track current water height for bubbles/caustics
  const waterHeightRef = useRef(0);
  const actualFill = sensorValid && !isStale ? fillPercentage / 100 : 0;
  waterHeightRef.current = actualFill * tankH;
  const waterColor = getWaterHex(status);

  return (
    <>
      {/* Pure Studio Lighting */}
      <ambientLight intensity={1.15} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 4, -4]} intensity={0.65} color="#f0f9ff" />
      <pointLight position={[0, sensorY + 0.2, 0]} intensity={0.4} color="#38bdf8" />

      <group position={[0, 0, 0]}>
        {/* Reservoir Chamber */}
        <ReservoirChamber w={tankW} h={tankH} d={tankD} />

        {/* Gravel substrate at bottom */}
        <Gravel w={tankW} d={tankD} />

        {/* Caustics light pattern on floor */}
        <CausticsLight
          width={tankW}
          depth={tankD}
          tankH={tankH}
          waterHeight={waterHeightRef.current}
        />

        {/* Dynamic Water Fluid Body */}
        <WaterBody
          targetFill={actualFill}
          tankW={tankW}
          tankD={tankD}
          tankH={tankH}
          status={status}
          frozen={frozen}
        />

        {/* Rising bubbles inside water */}
        {!frozen && actualFill > 0.02 && (
          <Bubbles
            width={tankW * 0.96}
            depth={tankD * 0.96}
            tankH={tankH}
            waterHeight={waterHeightRef.current}
            count={20}
          />
        )}

        {/* Water line glow */}
        {!frozen && actualFill > 0.01 && (
          <WaterLineGlow
            width={tankW}
            depth={tankD}
            tankH={tankH}
            waterHeight={waterHeightRef.current}
            color={waterColor}
          />
        )}

        {/* Graduated Metric Scale */}
        <MetricScale
          w={tankW}
          h={tankH}
          d={tankD}
          depthCm={tankConfig.depthCm}
        />

        {/* Ultrasonic Sensor & Beam */}
        <SensorTransducer tankH={tankH} sensorOffset={sensorOffset} />
        {!frozen && (
          <UltrasonicBeam sensorY={sensorY} waterY={waterY} status={status} />
        )}
      </group>

      {/* Clean Studio Floor Shadow Ring */}
      <mesh
        position={[0, -tankH / 2 - 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[Math.max(tankW, tankD) * 1.5, 48]} />
        <meshBasicMaterial color="#f1f5f9" transparent opacity={0.8} />
      </mesh>
      <mesh
        position={[0, -tankH / 2 - 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[tankW * 0.9, tankW * 0.92, 48]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={0.7}
        maxDistance={4.5}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
        autoRotate={!frozen}
        autoRotateSpeed={0.35}
        dampingFactor={0.05}
      />
    </>
  );
}

export default function TankScene(props: TankSceneProps) {
  return (
    <Canvas
      camera={{ position: [1.6, 1.0, 1.8], fov: 40 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
