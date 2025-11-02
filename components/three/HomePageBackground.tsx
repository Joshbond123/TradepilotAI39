import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const Particles: React.FC<{ count: number }> = ({ count }) => {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 10 + Math.random() * 100;
      const speed = 0.002 + Math.random() / 500;
      const x = (Math.random() - 0.5) * viewport.width * 2;
      const y = (Math.random() - 0.5) * viewport.height * 2;
      const z = (Math.random() - 0.5) * 20;
      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count, viewport.width, viewport.height]);

  useFrame(() => {
    if(!mesh.current) return;
    
    mesh.current.rotation.y += 0.0001;

    particles.forEach((particle, i) => {
      let { factor, speed, x, y, z } = particle;
      const t = (particle.time += speed);
      dummy.position.set(
        x + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 5,
        y + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 5,
        z + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 5
      );
      const s = Math.max(0.1, Math.cos(t) * 0.3 + 0.3);
      dummy.scale.set(s,s,s);
      dummy.rotation.set(t, t, t);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshStandardMaterial color="#00f5ff" emissive="#00f5ff" emissiveIntensity={1.5} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
};

const HomePageBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-40">
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#e040fb" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#00f5ff" />
        <Particles count={150} />
         <EffectComposer>
            <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default HomePageBackground;