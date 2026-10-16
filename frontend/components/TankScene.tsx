// ──────────────────────────────────────────────────
// components/TankScene.tsx — Precision Industrial 3D Digital Twin
// Clear Optical Tank with Sensor-Responsive Water Level
// ──────────────────────────────────────────────────
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { TankConfig, WaterStatus } from '@/types';

// ── Water Color (Always Consistent Ocean Blue) ────
const WATER_COLOR = '#0284c7';

// ── Water Body (Dynamic Fluid Mesh Following Sensor) ──
function WaterBody({
  targetFill,
  tankW,
  tankD,
  tankH,
  frozen,
}: {
  targetFill: number;
  tankW: number;
  tankD: number;
  tankH: number;
  frozen: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const currentFillRef = useRef(targetFill);

  // Inner water dimensions slightly inside glass walls
  const innerW = tankW * 0.98;
  const innerD = tankD * 0.98;

  useFrame((_, delta) => {
    if (!meshRef.current || !surfaceRef.current) return;

    // Smoothly interpolate water level to sensor target (responsive & stable)
    if (!frozen) {
      const lerpSpeed = Math.min(delta * 4.5, 0.2);
      currentFillRef.current += (targetFill - currentFillRef.current) * lerpSpeed;
    }

    const fill = Math.max(currentFillRef.current, 0.001);
    const waterHeight = fill * tankH;
    const waterY = -tankH / 2 + waterHeight / 2;
    const surfaceY = -tankH / 2 + waterHeight;

    // Scale volumetric water block
    meshRef.current.scale.y = waterHeight / tankH;
    meshRef.current.position.y = waterY;

    // Position top surface plane
    surfaceRef.current.position.y = surfaceY;
  });

  return (
    <group>
      {/* 1. Volumetric Water Body (Always Blue) */}
      <mesh ref={meshRef} position={[0, -tankH / 2, 0]}>
        <boxGeometry args={[innerW, tankH, innerD]} />
        <meshPhysicalMaterial
          color={WATER_COLOR}
          transparent
          opacity={0.82}
          roughness={0.06}
          metalness={0.08}
          transmission={0.3}
          ior={1.333}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Distinct Water Top Surface Plane (Always Blue) */}
      <mesh
        ref={surfaceRef}
        position={[0, -tankH / 2 + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[innerW, innerD]} />
        <meshPhysicalMaterial
          color={WATER_COLOR}
          transparent
          opacity={0.92}
          roughness={0.03}
          metalness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
        />
        {/* Crisp Surface Rim Line */}
        <Edges color="#bae6fd" lineWidth={1.5} />
      </mesh>
    </group>
  );
}

// ── Open Optical Reservoir Chamber (100% Transparent Glass) ──
function ReservoirChamber({ w, h, d }: { w: number; h: number; d: number }) {
  const glassThickness = 0.004;

  return (
    <group>
      {/* Front Optical Glass Wall */}
      <mesh position={[0, 0, d / 2]}>
        <boxGeometry args={[w, h, glassThickness]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0}
          transmission={0.96}
          ior={1.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Back Optical Glass Wall */}
      <mesh position={[0, 0, -d / 2]}>
        <boxGeometry args={[w, h, glassThickness]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0}
          transmission={0.96}
          ior={1.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left Optical Glass Wall */}
      <mesh position={[-w / 2, 0, 0]}>
        <boxGeometry args={[glassThickness, h, d]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0}
          transmission={0.96}
          ior={1.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Optical Glass Wall */}
      <mesh position={[w / 2, 0, 0]}>
        <boxGeometry args={[glassThickness, h, d]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0}
          transmission={0.96}
          ior={1.48}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Heavy Base Plate (Brushed Titanium / Steel) */}
      <mesh position={[0, -h / 2 - 0.008, 0]}>
        <boxGeometry args={[w + 0.03, 0.016, d + 0.03]} />
        <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Top Open Frame Rim (Open Center so water is visible from above) */}
      <group position={[0, h / 2 + 0.004, 0]}>
        {/* Front Bar */}
        <mesh position={[0, 0, d / 2]}>
          <boxGeometry args={[w + 0.02, 0.008, 0.014]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Back Bar */}
        <mesh position={[0, 0, -d / 2]}>
          <boxGeometry args={[w + 0.02, 0.008, 0.014]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Left Bar */}
        <mesh position={[-w / 2, 0, 0]}>
          <boxGeometry args={[0.014, 0.008, d - 0.014]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Right Bar */}
        <mesh position={[w / 2, 0, 0]}>
          <boxGeometry args={[0.014, 0.008, d - 0.014]} />
          <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Four Precision Stainless Steel Corner Pillars */}
      {[
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[0.014, h + 0.008, 0.014]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.25} metalness={0.75} />
        </mesh>
      ))}

      {/* Crisp Chamber Contour Outline (Invisible core with visible cyan edges) */}
      <mesh visible={false}>
        <boxGeometry args={[w, h, d]} />
        <Edges color="#0284c7" lineWidth={1.5} />
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

  const scaleX = w / 2 + 0.015;
  const scaleZ = d / 2 + 0.002;

  return (
    <group position={[scaleX, 0, scaleZ]}>
      {ticks.map((t, idx) => (
        <group key={idx} position={[0, t.y, 0]}>
          {/* Tick marker */}
          <mesh position={[t.isMajor ? -0.015 : -0.008, 0, 0]}>
            <boxGeometry args={[t.isMajor ? 0.03 : 0.016, 0.002, 0.001]} />
            <meshBasicMaterial color={t.isMajor ? '#0f172a' : '#64748b'} />
          </mesh>
          {/* Text label */}
          {t.label && (
            <Text
              position={[0.025, 0, 0]}
              fontSize={0.036}
              color="#0f172a"
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
        <boxGeometry args={[0.26, 0.008, 0.04]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Sensor PCB Body (Engineering Blue) */}
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[0.11, 0.028, 0.045]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Ultrasonic Transmitter & Receiver Transducers */}
      <mesh position={[-0.03, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.022, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.03, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.022, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Transducer mesh face (black centers) */}
      <mesh position={[-0.03, -0.0115, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.002, 24]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.03, -0.0115, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.002, 24]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Sensor label */}
      <Text
        position={[0, 0.052, 0]}
        fontSize={0.032}
        color="#475569"
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

  const beamColor =
    status === 'DANGER' ? '#e11d48' : status === 'WARNING' ? '#d97706' : '#0284c7';

  return (
    <group>
      {/* Dashed acoustic beam line */}
      <lineSegments geometry={geometry}>
        <lineDashedMaterial
          color={beamColor}
          dashSize={0.03}
          gapSize={0.02}
          transparent
          opacity={0.7}
        />
      </lineSegments>

      {/* Target ripple ring on the water surface */}
      <mesh position={[0, waterY + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.035, 24]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
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

  // Actual water level height based on sensor fill percentage
  const targetFill = sensorValid && !isStale ? Math.min(Math.max(fillPercentage / 100, 0), 1) : 0;
  const waterY = -tankH / 2 + targetFill * tankH;
  const frozen = !sensorValid || isStale;

  return (
    <>
      {/* Balanced Studio Lighting */}
      <ambientLight intensity={1.25} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 4, -4]} intensity={0.75} color="#f0f9ff" />
      <pointLight position={[0, sensorY + 0.2, 0]} intensity={0.5} color="#38bdf8" />

      <group position={[0, 0, 0]}>
        {/* 100% Transparent Optical Reservoir Glass Chamber */}
        <ReservoirChamber w={tankW} h={tankH} d={tankD} />

        {/* Dynamic Water Body Directly Driven by Sensor Height (Always Blue) */}
        <WaterBody
          targetFill={targetFill}
          tankW={tankW}
          tankD={tankD}
          tankH={tankH}
          frozen={frozen}
        />

        {/* Graduated Metric Measurement Scale */}
        <MetricScale
          w={tankW}
          h={tankH}
          d={tankD}
          depthCm={tankConfig.depthCm}
        />

        {/* HC-SR04 Ultrasonic Sensor & Active Acoustic Beam */}
        <SensorTransducer tankH={tankH} sensorOffset={sensorOffset} />
        {!frozen && targetFill > 0 && (
          <UltrasonicBeam sensorY={sensorY} waterY={waterY} status={status} />
        )}
      </group>

      {/* Clean Studio Floor Shadow */}
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
