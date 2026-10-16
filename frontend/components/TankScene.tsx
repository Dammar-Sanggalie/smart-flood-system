// ──────────────────────────────────────────────────
// components/TankScene.tsx — Precision Industrial 3D Digital Twin
// ──────────────────────────────────────────────────
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { TankConfig, WaterStatus } from '@/types';

// ── Water Color Palette ───────────────────────────
const WATER_COLORS: Record<string, string> = {
  SAFE: '#0284c7',       // Sky/Ocean Blue
  WARNING: '#d97706',    // Amber
  DANGER: '#e11d48',     // Rose / Red
  UNKNOWN: '#94a3b8',    // Slate
  INVALID: '#94a3b8',
};

function getWaterHex(status: WaterStatus): string {
  return WATER_COLORS[status] ?? '#0284c7';
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
    const g = new THREE.PlaneGeometry(width, depth, 32, 32);
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
      pos.array[ix + 1] =
        Math.sin(x * 10 + t * 2.2) * 0.0025 +
        Math.cos(z * 10 + t * 1.8) * 0.0025;
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={surfaceRef} geometry={geom}>
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.75}
        roughness={0.03}
        metalness={0.05}
        transmission={0.4}
        clearcoat={1}
        clearcoatRoughness={0.04}
        side={THREE.DoubleSide}
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

    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.color.copy(colorRef.current);
  });

  const innerW = tankW * 0.96;
  const innerD = tankD * 0.96;

  return (
    <>
      <mesh ref={meshRef} position={[0, -tankH / 2, 0]}>
        <boxGeometry args={[innerW, tankH, innerD]} />
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={0.58}
          roughness={0.04}
          metalness={0.05}
          transmission={0.65}
          side={THREE.DoubleSide}
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

// ── Precision Reservoir Structure ─────────────────
function ReservoirChamber({ w, h, d }: { w: number; h: number; d: number }) {
  const t = 0.01;

  return (
    <group>
      {/* Front Optical Glass */}
      <mesh position={[0, 0, d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0}
          transmission={0.96}
          ior={1.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Back Glass */}
      <mesh position={[0, 0, -d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0}
          transmission={0.96}
          ior={1.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left Glass */}
      <mesh position={[-w / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0}
          transmission={0.96}
          ior={1.45}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Right Glass */}
      <mesh position={[w / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0}
          transmission={0.96}
          ior={1.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Reservoir Base Plate (Brushed Titanium / Satin Steel) */}
      <mesh position={[0, -h / 2 - 0.008, 0]}>
        <boxGeometry args={[w + 0.04, 0.016, d + 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Top Frame Rim */}
      <mesh position={[0, h / 2 + 0.005, 0]}>
        <boxGeometry args={[w + 0.03, 0.01, d + 0.03]} />
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

      {/* Subtle edge guide */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
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
  const points = useMemo(() => {
    return [new THREE.Vector3(0, sensorY - 0.02, 0), new THREE.Vector3(0, waterY, 0)];
  }, [sensorY, waterY]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const beamColor = status === 'DANGER' ? '#e11d48' : status === 'WARNING' ? '#d97706' : '#0284c7';

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
      {/* Ripple ring on water target point */}
      <mesh position={[0, waterY + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.03, 24]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.6} side={THREE.DoubleSide} />
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

        {/* Dynamic Water Fluid Body */}
        <WaterBody
          targetFill={sensorValid && !isStale ? fillPercentage / 100 : 0}
          tankW={tankW}
          tankD={tankD}
          tankH={tankH}
          status={status}
          frozen={frozen}
        />

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
