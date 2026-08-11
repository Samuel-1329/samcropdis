import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export interface FarmSceneProps {
  risk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  raining: boolean;
  compact?: boolean;
  interactive?: boolean;
}

const RISK_COLOR: Record<FarmSceneProps["risk"], string> = {
  LOW: "#6fdc8c",
  MODERATE: "#f2c14e",
  HIGH: "#f0883e",
  CRITICAL: "#e5534b",
};

function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(60, 60, 80, 80);
    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const h =
        Math.sin(x * 0.16) * 0.5 + Math.cos(y * 0.13) * 0.45 + Math.sin((x + y) * 0.05) * 0.6;
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#1c3324" roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

function CropRows({ color }: { color: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 22 * 22;

  useMemo(() => undefined, []);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let x = 0; x < 22; x++) {
      for (let z = 0; z < 22; z++) {
        const px = (x - 11) * 1.15;
        const pz = (z - 11) * 1.15;
        const sway = Math.sin(t * 1.1 + x * 0.4 + z * 0.2) * 0.06;
        dummy.position.set(px, 0.42, pz);
        dummy.rotation.set(sway, (x + z) * 0.3, sway * 0.6);
        dummy.scale.set(0.14, 0.85 + ((x * z) % 5) * 0.05, 0.14);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.7} emissive={color} emissiveIntensity={0.12} />
    </instancedMesh>
  );
}

function Trees() {
  const positions = useMemo(
    () =>
      [
        [-16, -13],
        [-14, 9],
        [15, -10],
        [17, 12],
        [-19, 0],
        [12, 17],
      ] as [number, number][],
    [],
  );
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.13, 0.19, 1.8, 6]} />
            <meshStandardMaterial color="#3d2f22" roughness={1} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <icosahedronGeometry args={[1.15, 0]} />
            <meshStandardMaterial color="#245c33" roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Marker({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() % 2.4;
    if (ring.current) {
      const s = 1 + t * 1.6;
      ring.current.scale.set(s, s, s);
      const mat = ring.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.55 - t * 0.24);
    }
  });
  return (
    <group position={[0, 0.1, 0]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.35, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <coneGeometry args={[0.32, 0.9, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color={color} intensity={9} distance={12} />
    </group>
  );
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.position.x = ((group.current.position.x + delta * 0.25) % 40) - 20;
  });
  const puffs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        p: [(i % 7) * 6 - 18, 10 + (i % 3) * 1.4, Math.sin(i) * 12] as [number, number, number],
        s: 1.8 + ((i * 7) % 5) * 0.45,
      })),
    [],
  );
  return (
    <group ref={group}>
      {puffs.map((c, i) => (
        <mesh key={i} position={c.p} scale={[c.s * 1.7, c.s * 0.7, c.s]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#7c8f96" transparent opacity={0.22} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Rain() {
  const ref = useRef<THREE.Points>(null);
  const count = 900;
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 55;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 55;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const attr = pts.geometry.attributes["position"] as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 1;
      arr[idx] = (arr[idx] ?? 0) - delta * 14;
      if ((arr[idx] ?? 0) < 0) arr[idx] = 20;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#8fc7ea" size={0.09} transparent opacity={0.55} />
    </points>
  );
}

export default function FarmScene({ risk, raining, compact, interactive = true }: FarmSceneProps) {
  const color = RISK_COLOR[risk];
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.6]}
      camera={{ position: compact ? [16, 12, 18] : [20, 14, 22], fov: 42 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#0d1a14"]} />
      <fog attach="fog" args={["#0d1a14", 28, 70]} />
      <hemisphereLight args={["#9fd6b4", "#0e1a13", 0.55]} />
      <directionalLight position={[12, 18, 8]} intensity={raining ? 0.7 : 1.4} color="#ffe9c4" />
      <ambientLight intensity={0.25} />
      <Terrain />
      <CropRows color={risk === "LOW" ? "#4fae5a" : color} />
      <Trees />
      <Marker color={color} />
      <Clouds />
      {raining && <Rain />}
      <gridHelper args={[60, 30, "#20402e", "#162b1f"]} position={[0, 0.02, 0]} />
      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={12}
          maxDistance={46}
          maxPolarAngle={Math.PI / 2.35}
          autoRotate
          autoRotateSpeed={0.35}
        />
      )}
    </Canvas>
  );
}
