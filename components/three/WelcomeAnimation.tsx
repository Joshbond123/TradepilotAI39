
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 100 }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 10 + Math.random() * 20;
      const speed = 0.01 + Math.random() / 200;
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      temp.push({ t, factor, speed, x, y, z });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      let { factor, speed, x, y, z } = particle;
      particle.t += speed;
      const a = Math.cos(particle.t) + Math.sin(particle.t * 1) / 10;
      const b = Math.sin(particle.t) + Math.cos(particle.t * 2) / 10;
      const s = Math.max(0.1, Math.cos(particle.t) * 0.2 + 0.2);
      dummy.position.set(
        x + a * (factor / 5),
        y + b * (factor / 5),
        z + b * (factor / 5)
      );
      dummy.scale.set(s,s,s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05]} />
      <meshStandardMaterial color="#e040fb" emissive="#e040fb" emissiveIntensity={3} />
    </instancedMesh>
  );
}

const Crystal: React.FC = () => {
    const ref = useRef<THREE.Mesh>(null!);
    useFrame(({ clock }) => {
        if(ref.current) {
            ref.current.rotation.y = clock.getElapsedTime() * 0.2;
            ref.current.rotation.x = clock.getElapsedTime() * 0.1;
        }
    });

    return (
        <Icosahedron ref={ref} args={[1, 1]}>
            <meshStandardMaterial 
                color="#00f5ff" 
                emissive="#00f5ff"
                emissiveIntensity={1}
                transparent
                opacity={0.7}
                roughness={0.1}
                metalness={0.9}
            />
        </Icosahedron>
    )
}

const WelcomeAnimation = () => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#00f5ff" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#e040fb" />
      <Crystal />
      <Particles />
    </Canvas>
  );
};

export default WelcomeAnimation;
