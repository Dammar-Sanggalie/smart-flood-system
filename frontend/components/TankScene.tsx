// ──────────────────────────────────────────────────
// components/TankScene.tsx — R3F 3D Aquarium Tank Scene
// Must be loaded with dynamic import (ssr: false)
// ──────────────────────────────────────────────────
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { TankConfig, WaterStatus } from '@/types';

// ── Status Colors ─────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  DANGER: '#dc2626',
  WARNING: '#d97706',
  SAFE: '#0891b2',
  UNKNOWN: '#94a3b8',
  INVALID: '#94a3b8',
};

function getWaterColor(status: WaterStatus): string {
  return STATUS_COLORS[status] ?? '#0891b2';
}

// ── Gravel / Substrate at bottom ──────────────────
function Gravel({ w, d }: { w: number; d: number }) {
  const stones = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; color: string }[] = [];
    const colors = ['#94a3b8', '#a8a29e', '#cbd5e1', '#bcaaa4', '#d6d3d1'];
    const count = Math.floor((w * d) / 0.003);
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: [
          (Math.random() - 0.5) * w * 0.9,
          -0.005,
          (Math.random() - 0.5) * d * 0.9,
        ],
        scale: 0.006 + Math.random() * 0.008,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return arr;
  }, [w, d]);

  return (
    <group>
      {/* Substrate base layer */}
      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[w * 0.96, 0.015, d * 0.96]} />
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

// ── Animated Water Surface (ripple plane) ─────────
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
    const g = new THREE.PlaneGeometry(width, depth, 24, 24);
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
        Math.sin(x * 12 + t * 2.5) * 0.003 +
        Math.cos(z * 12 + t * 2) * 0.003;
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={surfaceRef} geometry={geom}>
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.65}
        roughness={0.02}
        metalness={0.1}
        transmission={0.5}
        clearcoat={1}
        clearcoatRoughness={0.05}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Water Body (fills from bottom) ────────────────
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
  const colorRef = useRef(new THREE.Color(getWaterColor(status)));
  const targetColorRef = useRef(new THREE.Color(getWaterColor(status)));

  const waterColor = getWaterColor(status);

  useFrame(() => {
    if (!meshRef.current) return;
    targetColorRef.current.set(getWaterColor(status));

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

  const innerW = tankW * 0.94;
  const innerD = tankD * 0.94;

  return (
    <>
      <mesh ref={meshRef} position={[0, -tankH / 2, 0]}>
        <boxGeometry args={[innerW, tankH, innerD]} />
        <meshPhysicalMaterial
          color={waterColor}
          transparent
          opacity={0.5}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
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

// ── Aquarium Tank Structure ───────────────────────
function TankStructure({ w, h, d }: { w: number; h: number; d: number }) {
  const t = 0.012;

  return (
    <group>
      {/* Glass walls — blue-green tinted */}
      {/* Front */}
      <mesh position={[0, 0, d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshPhysicalMaterial
          color="#a5d8e6"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.98}
          ior={1.33}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0, -d / 2]}>
        <boxGeometry args={[w, h, t]} />
        <meshPhysicalMaterial
          color="#a5d8e6"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.98}
          ior={1.33}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial
          color="#a5d8e6"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.98}
          ior={1.33}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2, 0, 0]}>
        <boxGeometry args={[t, h, d]} />
        <meshPhysicalMaterial
          color="#a5d8e6"
          transparent
          opacity={0.12}
          roughness={0}
          metalness={0}
          transmission={0.98}
          ior={1.33}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Black silicone corners (aquarium style) */}
      {[
        [-w / 2, -d / 2],
        [w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, d / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}>
          <boxGeometry args={[t * 2.5, h, t * 2.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Top rim */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + t, t * 1.8, d + t]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Bottom rim */}
      <mesh position={[0, -h / 2, 0]}>
        <boxGeometry args={[w + t, t * 1.8, d + t]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Glass edges */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <Edges color="#67e8f9" lineWidth={1} />
      </mesh>
    </group>
  );
}

// ── Sensor Housing ────────────────────────────────
function SensorHousing({ tankH, sensorOffset }: { tankH: number; sensorOffset: number }) {
  const y = tankH / 2 + sensorOffset;
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#374151" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.06]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[-0.03, 0.045, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.03, 0.045, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 16]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.6} />
      </mesh>
      <Text
        position={[0.15, 0, 0]}
        fontSize={0.06}
        color="#64748b"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.003}
        outlineColor="#ffffff"
      >
        HC-SR04
      </Text>
    </group>
  );
}

// ── Measurement Line ──────────────────────────────
function MeasurementLine({ sensorY, waterY }: { sensorY: number; waterY: number }) {
  const points = useMemo(
    () => [
      new THREE.Vector3(0, sensorY, 0),
      new THREE.Vector3(0, waterY, 0),
    ],
    [sensorY, waterY],
  );
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <lineSegments geometry={geometry}>
      <lineDashedMaterial
        color="#d97706"
        dashSize={0.04}
        gapSize={0.03}
        transparent
        opacity={0.5}
      />
    </lineSegments>
  );
}

// ── Scene Labels ──────────────────────────────────
function SceneLabels({
  fillPercentage,
  waterLevelCm,
  distanceCm,
  tankW,
  tankH,
  sensorValid,
  isStale,
}: {
  fillPercentage: number;
  waterLevelCm: number;
  distanceCm: number;
  tankW: number;
  tankH: number;
  sensorValid: boolean;
  isStale: boolean;
}) {
  const showValues = sensorValid && !isStale;
  const labelX = tankW / 2 + 0.12;
  const waterY = -tankH / 2 + (fillPercentage / 100) * tankH;

  return (
    <group>
      <Text
        position={[labelX, waterY, 0]}
        fontSize={0.07}
        color={showValues ? '#16a34a' : '#94a3b8'}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor="#ffffff"
      >
        {showValues ? `${fillPercentage.toFixed(1)}%` : '—%'}
      </Text>
      <Text
        position={[labelX, -tankH / 2, 0]}
        fontSize={0.06}
        color="#64748b"
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.003}
        outlineColor="#ffffff"
      >
        {showValues ? `${waterLevelCm.toFixed(1)} cm` : '— cm'}
      </Text>
      <Text
        position={[-labelX, tankH / 2 + 0.15, 0]}
        fontSize={0.06}
        color="#d97706"
        anchorX="right"
        anchorY="middle"
        outlineWidth={0.003}
        outlineColor="#ffffff"
      >
        {showValues ? `D: ${distanceCm.toFixed(1)} cm` : 'D: —'}
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
  const SCALE = 1 / 100;
  const tankW = tankConfig.widthCm * SCALE;
  const tankH = tankConfig.depthCm * SCALE;
  const tankD = tankConfig.lengthCm * SCALE;
  const sensorOffset = Math.max(
    (tankConfig.sensorHeightCm - tankConfig.depthCm) * SCALE,
    0.1,
  );
  const sensorY = tankH / 2 + sensorOffset;
  const waterY = -tankH / 2 + (fillPercentage / 100) * tankH;
  const frozen = !sensorValid || isStale;

  return (
    <>
      {/* Aquarium-style lighting: bright from above */}
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[0, 6, 0]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[3, 3, 3]} intensity={0.6} />
      <pointLight position={[-2, 1, -2]} intensity={0.3} color="#67e8f9" />

      <group position={[0, 0, 0]}>
        <TankStructure w={tankW} h={tankH} d={tankD} />

        <WaterBody
          targetFill={sensorValid && !isStale ? fillPercentage / 100 : 0}
          tankW={tankW}
          tankD={tankD}
          tankH={tankH}
          status={status}
          frozen={frozen}
        />

        <Gravel w={tankW} d={tankD} />

        <SensorHousing tankH={tankH} sensorOffset={sensorOffset} />
        <MeasurementLine sensorY={sensorY} waterY={waterY} />
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

      {/* Ground platform — light */}
      <mesh
        position={[0, -tankH / 2 - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} metalness={0} />
      </mesh>
      <mesh
        position={[0, -tankH / 2 - 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.2, 1.25, 64]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.6} />
      </mesh>

      <OrbitControls
        enablePan={false}
        minDistance={0.8}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
        autoRotate={!frozen}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function TankScene(props: TankSceneProps) {
  return (
    <Canvas
      camera={{ position: [1.8, 1.2, 2.2], fov: 45 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
