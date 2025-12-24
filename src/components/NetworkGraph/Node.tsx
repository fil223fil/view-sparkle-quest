import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NodeProps {
  position: [number, number, number];
  scale: number;
  opacity: number;
  pulseOffset?: number;
}

export const Node = ({ position, scale, opacity, pulseOffset = 0 }: NodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && glowRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2 + pulseOffset) * 0.1;
      meshRef.current.scale.setScalar(scale * pulse);
      glowRef.current.scale.setScalar(scale * pulse * 2.5);
    }
  });

  return (
    <group position={position}>
      {/* Core sphere */}
      <Sphere ref={meshRef} args={[0.08, 32, 32]}>
        <meshBasicMaterial
          color="#58C4DD"
          transparent
          opacity={opacity}
        />
      </Sphere>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[0.08, 16, 16]}>
        <meshBasicMaterial
          color="#58C4DD"
          transparent
          opacity={opacity * 0.15}
        />
      </Sphere>
    </group>
  );
};
