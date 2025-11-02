import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

const COIN_DATA = [
  { symbol: 'BTC', color: '#F7931A', texture: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/btc.svg' },
  { symbol: 'ETH', color: '#627EEA', texture: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/eth.svg' },
  { symbol: 'USDT', color: '#26A17B', texture: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/usdt.svg' },
  { symbol: 'SOL', color: '#9945FF', texture: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons/svg/color/sol.svg' },
];

// FIX: Define a props interface for the Coin component to resolve typing issues.
interface CoinProps {
  position: [number, number, number];
  textureUrl: string;
  color: string;
}

// FIX: Converted the Coin component to a React.FC to correctly type its props,
// allowing it to accept the 'key' prop required for list rendering without type errors.
const Coin: React.FC<CoinProps> = ({ position, textureUrl, color }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const texture = useMemo(() => new THREE.TextureLoader().load(textureUrl), [textureUrl]);

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
        <mesh position={position} ref={meshRef}>
            <cylinderGeometry args={[0.5, 0.5, 0.1, 64]} />
            {/* Side material */}
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
             {/* Front face */}
            <meshStandardMaterial map={texture} attach="material-1" roughness={0.5} metalness={0.5} />
            {/* Back face */}
            <meshStandardMaterial map={texture} attach="material-2" roughness={0.5} metalness={0.5} />
        </mesh>
    </Float>
  );
};

function Particles({ count = 200 }) {
    const mesh = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);
  
    const particles = useMemo(() => {
      const temp = [];
      for (let i = 0; i < count; i++) {
        const t = Math.random() * 100;
        const factor = 20 + Math.random() * 100;
        const speed = 0.01 + Math.random() / 200;
        const x = (Math.random() - 0.5) * 30;
        const y = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        temp.push({ t, factor, speed, x, y, z });
      }
      return temp;
    }, [count]);
  
    useFrame(() => {
      if (!mesh.current) return;
      particles.forEach((particle, i) => {
        let { factor, speed, x, y, z } = particle;
        particle.t += speed;
        dummy.position.set(
          x + Math.cos((particle.t / 10) * factor) + (Math.sin(particle.t * 1) * factor) / 10,
          y + Math.sin((particle.t / 10) * factor) + (Math.cos(particle.t * 2) * factor) / 10,
          z + Math.cos((particle.t / 10) * factor) + (Math.sin(particle.t * 3) * factor) / 10
        );
        const s = Math.cos(particle.t) * 0.1 + 0.1;
        dummy.scale.set(s,s,s);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    });
  
    return (
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={2} />
      </instancedMesh>
    );
  }

const FloatingCoins = () => {
  const coinPositions = useMemo(() => Array.from({ length: 12 }, () => [
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10 - 5,
  ] as [number, number, number]), []);

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#e040fb" />
      <pointLight position={[-10, -10, 10]} intensity={2} color="#00f5ff" />
      <Suspense fallback={null}>
        {coinPositions.map((pos, i) => {
          const coinData = COIN_DATA[i % COIN_DATA.length];
          return <Coin key={i} position={pos} textureUrl={coinData.texture} color={coinData.color} />;
        })}
        <Particles />
      </Suspense>
    </Canvas>
  );
};

export default FloatingCoins;
