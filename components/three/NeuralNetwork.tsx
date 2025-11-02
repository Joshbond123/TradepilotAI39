import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

const COUNT = 50;
const RADIUS = 2;

// FIX: Changed Node to a React.FC to correctly handle the 'key' prop during list rendering.
const Node: React.FC<{ position: THREE.Vector3 }> = ({ position }) => (
    <mesh position={position}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00f5ff" toneMapped={false} />
    </mesh>
);

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

    return <>{nodes.map((pos, i) => <Node key={i} position={pos} />)}</>;
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
                const dist = new THREE.Vector3(pos[i*3], pos[i*3+1], pos[i*3+2]).distanceTo(new THREE.Vector3(pos[j*3], pos[j*3+1], pos[j*3+2]));
                if (dist < 1.2) {
                    ind.push(i, j);
                }
            }
        }
        return [new Float32Array(pos), new Uint16Array(ind)];
    }, []);

    return (
        <lineSegments ref={linesRef}>
            <bufferGeometry>
                <bufferAttribute attach="position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="index" count={indices.length} array={indices} itemSize={1} />
            </bufferGeometry>
            <lineBasicMaterial color="#e040fb" transparent opacity={0.3} toneMapped={false} />
        </lineSegments>
    );
};

const Scene = () => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame(({ clock }) => {
        if(groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
            groupRef.current.rotation.x = clock.getElapsedTime() * 0.05;
        }
    });
    return <group ref={groupRef}><Nodes /><Lines /></group>;
}

const NeuralNetwork = () => {
    return (
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Scene />
            <EffectComposer>
                <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} intensity={1.5} />
            </EffectComposer>
        </Canvas>
    );
};

export default NeuralNetwork;
