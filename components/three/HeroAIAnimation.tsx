import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const COUNT = 80;
const RADIUS = 2.5;

const Nodes = () => {
    const nodes = useMemo(() => {
        const temp = [];
        const phi = Math.PI * (3. - Math.sqrt(5.)); // golden angle in radians
        for (let i = 0; i < COUNT; i++) {
            const y = 1 - (i / (COUNT - 1)) * 2;  // y goes from 1 to -1
            const radius = Math.sqrt(1 - y * y); // radius at y
            const theta = phi * i; // golden angle increment
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            temp.push(new THREE.Vector3(x,y,z).multiplyScalar(RADIUS));
        }
        return temp;
    }, []);

    return <>{nodes.map((pos, i) => (
         <mesh key={i} position={pos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#00f5ff" toneMapped={false} />
        </mesh>
    ))}</>;
};

const Lines = () => {
    const linesRef = useRef<THREE.LineSegments>(null!);

    const [positions, indices] = useMemo(() => {
        const pos = [];
        const ind = [];
        const phi = Math.PI * (3. - Math.sqrt(5.));
        for (let i = 0; i < COUNT; i++) {
            const y = 1 - (i / (COUNT - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const theta = phi * i;
            pos.push(Math.cos(theta) * radius * RADIUS, y * RADIUS, Math.sin(theta) * radius * RADIUS);
        }

        for (let i = 0; i < COUNT; i++) {
            for (let j = i + 1; j < COUNT; j++) {
                const p1 = new THREE.Vector3(pos[i*3], pos[i*3+1], pos[i*3+2]);
                const p2 = new THREE.Vector3(pos[j*3], pos[j*3+1], pos[j*3+2]);
                const dist = p1.distanceTo(p2);
                if (dist < 1.0) { // Connect nodes that are close
                    ind.push(i, j);
                }
            }
        }
        return [new Float32Array(pos), new Uint16Array(ind)];
    }, []);

    return (
        <lineSegments ref={linesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} args={[positions, 3]} />
                <bufferAttribute attach="index" count={indices.length} array={indices} itemSize={1} args={[indices, 1]} />
            </bufferGeometry>
            <lineBasicMaterial color="#e040fb" transparent opacity={0.25} toneMapped={false} />
        </lineSegments>
    );
};

const Scene = ({ scrollProgress }: { scrollProgress: MotionValue<number> }) => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if(groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
            groupRef.current.rotation.x = clock.getElapsedTime() * 0.02;
            groupRef.current.rotation.z = clock.getElapsedTime() * 0.03;
            groupRef.current.position.y = scrollProgress.get() * 3;
        }
    });
    return (
        <group ref={groupRef}>
            <Nodes />
            <Lines />
        </group>
    );
}

const HeroAIAnimation: React.FC<{ scrollProgress: MotionValue<number> }> = ({ scrollProgress }) => {
    return (
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <fog attach="fog" args={['#0a0a1a', 10, 20]} />
            <Scene scrollProgress={scrollProgress} />
            <EffectComposer>
                <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={1.5} />
            </EffectComposer>
        </Canvas>
    );
};

export default React.memo(HeroAIAnimation);