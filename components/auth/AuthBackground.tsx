
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles: React.FC<{ count: number }> = ({ count }) => {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() / 200;
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      temp.push({ time, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if(!mesh.current) return;

    particles.forEach((particle, i) => {
      let { factor, speed, x, y, z } = particle;
      const t = (particle.time += speed);
      dummy.position.set(
        x + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        y + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        z + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.setScalar(0.15 + Math.sin(t*speed*10) * 0.1);
      dummy.rotation.set(t, t, t);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    
    if(light.current) {
        light.current.position.set(state.pointer.x * 20, state.pointer.y * 20, 0);
    }
  });

  return (
    <>
      <pointLight ref={light} distance={50} intensity={20} color="#00f5ff" />
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#e040fb" roughness={0.5} emissive="#e040fb" emissiveIntensity={2} />
      </instancedMesh>
    </>
  );
};

const AuthBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 bg-brand-bg">
      <Canvas camera={{ position: [0, 0, 40], fov: 75 }}>
        <ambientLight intensity={0.2} />
        <Particles count={300} />
      </Canvas>
    </div>
  );
};

export default AuthBackground;
