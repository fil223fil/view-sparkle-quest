import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface NodeProps {
  position: [number, number, number];
  scale: number;
  opacity: number;
  pulseOffset?: number;
  depth?: number;
  onFractalClick?: (position: [number, number, number], depth: number) => void;
}

export const Node = ({ 
  position, 
  scale, 
  opacity, 
  pulseOffset = 0,
  depth = 0,
  onFractalClick
}: NodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickEffect, setClickEffect] = useState(0);

  useFrame(({ clock }) => {
    if (meshRef.current && glowRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2 + pulseOffset) * 0.1;
      const hoverScale = isHovered ? 1.3 : 1;
      const clickScale = 1 + clickEffect * 0.5;
      meshRef.current.scale.setScalar(scale * pulse * hoverScale * clickScale);
      glowRef.current.scale.setScalar(scale * pulse * 2.5 * hoverScale * clickScale);
      
      // Decay click effect
      if (clickEffect > 0) {
        setClickEffect(prev => Math.max(0, prev - 0.05));
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setClickEffect(1);
    if (onFractalClick && depth < 3) {
      onFractalClick(position, depth);
    }
  };

  // Color based on depth for fractal visualization
  const depthColors = ['#58C4DD', '#FF6B9D', '#9B59B6', '#F39C12'];
  const nodeColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <group position={position}>
      {/* Core sphere */}
      <Sphere 
        ref={meshRef} 
        args={[0.08, 32, 32]}
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={opacity}
        />
      </Sphere>
      {/* Glow effect */}
      <Sphere ref={glowRef} args={[0.08, 16, 16]}>
        <meshBasicMaterial
          color={nodeColor}
          transparent
          opacity={opacity * 0.15}
        />
      </Sphere>
    </group>
  );
};
