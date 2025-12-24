import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FormulaTunnelProps {
  isActive: boolean;
  progress: number; // 0 to 1
  targetPosition: [number, number, number];
  color: string;
}

const TUNNEL_FORMULAS = [
  '∫∇×F·dA', 'ψ→ψ²+c', 'λ=∂x/∂t', 'Σφᵢ→∞',
  '∂ρ/∂t=0', 'H|ψ⟩=E', 'e^iπ+1', '∮B·dl',
  'δS=0', 'dE=TdS', '∇²φ=ρ', 'F=ma',
  'E=mc²', 'ΔxΔp≥ℏ', 'S=klnW', '∂ψ/∂t',
  '∇·E=ρ', 'Ĥψ=Eψ', 'ds²=c²dt²', 'ω=2πf',
];

// Single ring of formulas - now more prominent
const TunnelRing = ({
  radius,
  zPosition,
  rotation,
  opacity,
  color,
  time,
  ringIndex,
}: {
  radius: number;
  zPosition: number;
  rotation: number;
  opacity: number;
  color: string;
  time: number;
  ringIndex: number;
}) => {
  const formulaCount = 8 + (ringIndex % 4);
  
  return (
    <group position={[0, 0, zPosition]} rotation={[0, 0, rotation]}>
      {Array.from({ length: formulaCount }).map((_, i) => {
        const angle = (i / formulaCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const formula = TUNNEL_FORMULAS[(ringIndex * formulaCount + i) % TUNNEL_FORMULAS.length];
        
        // Stronger shimmer effect
        const shimmer = 0.6 + Math.sin(time * 6 + i * 0.8 + ringIndex * 0.3) * 0.4;
        
        return (
          <Text
            key={i}
            position={[x, y, 0]}
            fontSize={0.06 + Math.sin(time * 3 + i) * 0.01}
            color={color}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * shimmer}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            {formula}
          </Text>
        );
      })}
      
      {/* Ring glow line */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[radius - 0.01, radius + 0.01, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export const FormulaTunnel = ({ isActive, progress, targetPosition, color }: FormulaTunnelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  useFrame((_, delta) => {
    if (isActive) {
      timeRef.current += delta * 2; // Faster animation
      if (groupRef.current) {
        groupRef.current.rotation.z += delta * 1.5; // Faster rotation
      }
    }
  });
  
  const rings = useMemo(() => {
    const ringCount = 20; // More rings
    return Array.from({ length: ringCount }).map((_, i) => {
      const t = i / ringCount;
      return {
        id: i,
        baseZ: -t * 5, // Longer tunnel
        baseRadius: 0.15 + t * 0.8, // Bigger expansion
        rotationOffset: i * 0.4,
      };
    });
  }, []);
  
  if (!isActive) return null;
  
  // Stronger visibility
  const tunnelOpacity = Math.sin(progress * Math.PI) * 1.5;
  
  return (
    <group ref={groupRef} position={targetPosition}>
      {rings.map((ring) => {
        // Move rings toward camera as progress increases
        const zOffset = ring.baseZ + progress * 6;
        // Wider visible range
        if (zOffset < -4 || zOffset > 1) return null;
        
        const depthFade = 1 - Math.abs(zOffset) / 4;
        const ringOpacity = Math.min(1, tunnelOpacity * depthFade);
        
        // Radius expands more dramatically
        const dynamicRadius = ring.baseRadius * (1 + (zOffset + 4) * 0.4);
        
        return (
          <TunnelRing
            key={ring.id}
            radius={dynamicRadius}
            zPosition={zOffset}
            rotation={ring.rotationOffset + timeRef.current * 0.5}
            opacity={ringOpacity}
            color={color}
            time={timeRef.current}
            ringIndex={ring.id}
          />
        );
      })}
      
      {/* Central vortex glow - bigger */}
      <mesh>
        <circleGeometry args={[0.1 + progress * 0.2, 24]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={tunnelOpacity * 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh>
        <ringGeometry args={[0.08 + progress * 0.15, 0.15 + progress * 0.25, 32]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={tunnelOpacity * 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
