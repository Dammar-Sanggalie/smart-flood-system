// ──────────────────────────────────────────────────
// components/TankScene.tsx — R3F 3D Tank Scene
// Must be loaded with dynamic import (ssr: false)
// ──────────────────────────────────────────────────
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { TankConfig, WaterStatus } from '@/types';

// ── Water Color by Status ─────────────────────────
function getWaterColor(status: WaterStatus): string {
  switch (status) {
    case 'DANGER':  return '#ef4444';
    case 'WARNING': return '#f59e0b';
    default:        return '#3b82f6';
  }
}

// ── Animated Water Mesh ───────────────────────────
interface WaterMeshProps {
  targetFill: number;      // 0..1
  tankW: number;
  tankD: number;
  tankH: number;
  status: WaterStatus;
  frozen: boolean;
}

function WaterMesh({ targetFill, tankW, tankD, tankH, status, frozen }: WaterMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentFillRef = useRef(targetFill);
  const colorRef = useRef(new THREE.Color(getWaterColor(status)));
  const targetColorRef = useRef(new THREE.Color(getWaterColor(status)));

  useFrame(() => {
    if (!meshRef.current) return;

    targetColorRef.current.set(getWaterColor(status));

    if (!frozen) {
      currentFillRef.current +=
        (targetFill - currentFillRef.current) * 0.05;
      colorRef.current.lerp(targetColorRef.current, 0.05);
    }

    const waterHeight = Math.max(currentFillRef.current * tankH, 0.001);
    meshRef.current.scale.y = waterHeight / tankH;
    meshRef.current.position.y = -tankH / 2 + waterHeight / 2;

    const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
    mat.color.copy(colorRef.current);
  });

  return (
    <mesh ref={meshRef} position={[0, -tankH / 2, 0]}>
      <boxGeometry args={[tankW - 0.02, tankH, tankD - 0.02]} />
      <meshPhysicalMaterial
        color={getWaterColor(status)}
        transparent
        opacity={0.75}
        roughness={0.05}
        metalness={0.1}
        transmission={0.3}
      />
    </mesh>
  );
}

// ── Tank Walls (glass-like box) ───────────────────
interface TankBoxProps {
  w: number;
  h: number;
  d: number;
}

function TankBox({ w, h, d }: TankBoxProps) {
  const edgesRef = useRef<THREE.LineSegments>(null);

  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(w, h, d);
    return new THREE.EdgesGeometry(geo);
  }, [w, h, d]);

  return (
    <group>
      {/* Glass walls */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial
          color="#94a3b8"
          transparent
          opacity={0.08}
          roughness={0}
          metalness={0.2}
          transmission={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Edges */}
      <lineSegments ref={edgesRef} geometry={edges}>
        <lineBasicMaterial color="#475569" linewidth={1} />
      </lineSegments>
    </group>
  );
}

// ── Sensor Indicator ──────────────────────────────
interface SensorProps {
  tankH: number;
  sensorOffset: number; // extra height above tank top
}

function SensorIndicator({ tankH, sensorOffset }: SensorProps) {
  const y = tankH / 2 + sensorOffset;
  return (
    <group position={[0, y, 0]}>
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <Text
        position={[0.2, 0, 0]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="left"
        anchorY="middle"
      >
        Sensor
      </Text>
    </group>
  );
}

// ── Distance Dashed Line ──────────────────────────
interface DistanceLineProps {
  sensorY: number;
  waterY: number;
}

function DistanceLine({ sensorY, waterY }: DistanceLineProps) {
  const points = useMemo(
    () => [new THREE.Vector3(0, sensorY, 0), new THREE.Vector3(0, waterY, 0)],
    [sensorY, waterY],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineDashedMaterial color="#fbbf24" dashSize={0.05} gapSize={0.04} />
    </lineSegments>
  );
}

// ── Scene Labels ──────────────────────────────────
interface LabelsProps {
  fillPercentage: number;
  waterLevelCm: number;
  distanceCm: number;
  tankW: number;
  tankH: number;
  sensorValid: boolean;
  isStale: boolean;
}

function SceneLabels({
  fillPercentage,
  waterLevelCm,
  distanceCm,
  tankW,
  tankH,
  sensorValid,
  isStale,
}: LabelsProps) {
  const showValues = sensorValid && !isStale;
  const x = tankW / 2 + 0.15;

  return (
    <group>
      {/* Fill % */}
      <Text
        position={[x, tankH * (fillPercentage / 100 - 0.5), 0]}
        fontSize={0.1}
        color={showValues ? '#22c55e' : '#6b7280'}
        anchorX="left"
        anchorY="middle"
      >
        {showValues ? `${fillPercentage.toFixed(1)}%` : '—%'}
      </Text>

      {/* Water level */}
      <Text
        position={[x, -tankH / 2, 0]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="left"
        anchorY="middle"
      >
        {showValues ? `H: ${waterLevelCm.toFixed(1)}cm` : 'H: —cm'}
      </Text>

      {/* Distance */}
      <Text
        position={[-x, tankH / 2 + 0.2, 0]}
        fontSize={0.08}
        color="#fbbf24"
        anchorX="right"
        anchorY="middle"
      >
        {showValues ? `D: ${distanceCm.toFixed(1)}cm` : 'D: —cm'}
      </Text>
    </group>
  );
}

// ── Full 3D Scene ─────────────────────────────────
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
  distanceCm,
  waterLevelCm,
  fillPercentage,
  tankConfig,
  sensorValid,
  isStale,
  status,
}: TankSceneProps) {
  // Scale from cm to scene units (divide by 100 for meters-ish scale)
  const SCALE = 1 / 80;
  const tankW = tankConfig.widthCm * SCALE;
  const tankH = tankConfig.depthCm * SCALE;
  const tankD = tankConfig.lengthCm * SCALE;
  const sensorOffset = (tankConfig.sensorHeightCm - tankConfig.depthCm) * SCALE;
  const sensorY = tankH / 2 + Math.max(sensorOffset, 0.1);
  const waterY = -tankH / 2 + (fillPercentage / 100) * tankH;
  const frozen = !sensorValid || isStale;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow />
      <pointLight position={[-2, 2, -2]} intensity={0.5} color="#60a5fa" />

      <group position={[0, 0, 0]}>
        <TankBox w={tankW} h={tankH} d={tankD} />

        <WaterMesh
          targetFill={sensorValid && !isStale ? fillPercentage / 100 : 0}
          tankW={tankW}
          tankD={tankD}
          tankH={tankH}
          status={status}
          frozen={frozen}
        />

        <SensorIndicator tankH={tankH} sensorOffset={Math.max(sensorOffset, 0.15)} />

        <DistanceLine sensorY={sensorY} waterY={waterY} />

        <SceneLabels
          fillPercentage={fillPercentage}
          waterLevelCm={waterLevelCm}
          distanceCm={distanceCm}
          tankW={tankW}
          tankH={tankH}
          sensorValid={sensorValid}
          isStale={isStale}
        />
      </group>

      <Grid
        position={[0, -tankH / 2 - 0.01, 0]}
        args={[4, 4]}
        cellSize={0.2}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={6}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls
        enablePan={false}
        minDistance={0.5}
        maxDistance={5}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ── Exported Canvas Wrapper ───────────────────────
export default function TankScene(props: TankSceneProps) {
  return (
    <Canvas
      camera={{ position: [1.5, 1, 2], fov: 50 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
