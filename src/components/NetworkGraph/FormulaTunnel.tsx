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
];

// Single ring of formulas
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
  const formulaCount = 6 + (ringIndex % 3);
  
  return (
    <group position={[0, 0, zPosition]} rotation={[0, 0, rotation]}>
      {Array.from({ length: formulaCount }).map((_, i) => {
        const angle = (i / formulaCount) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const formula = TUNNEL_FORMULAS[(ringIndex * formulaCount + i) % TUNNEL_FORMULAS.length];
        
        // Shimmer effect
        const shimmer = 0.5 + Math.sin(time * 4 + i + ringIndex * 0.5) * 0.5;
        
        return (
          <Text
            key={i}
            position={[x, y, 0]}
            fontSize={0.04 + (1 - opacity) * 0.02}
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
    </group>
  );
};

export const FormulaTunnel = ({ isActive, progress, targetPosition, color }: FormulaTunnelProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  
  useFrame((_, delta) => {
    if (isActive) {
      timeRef.current += delta;
      if (groupRef.current) {
        // Gentle rotation of the whole tunnel
        groupRef.current.rotation.z += delta * 0.5;
      }
    }
  });
  
  const rings = useMemo(() => {
    const ringCount = 12;
    return Array.from({ length: ringCount }).map((_, i) => {
      const t = i / ringCount;
      return {
        id: i,
        baseZ: -t * 3, // Spread along z-axis
        baseRadius: 0.1 + t * 0.5, // Expand outward
        rotationOffset: i * 0.3,
      };
    });
  }, []);
  
  if (!isActive) return null;
  
  // Calculate visibility based on progress
  const tunnelOpacity = Math.sin(progress * Math.PI); // Fade in and out
  
  return (
    <group ref={groupRef} position={targetPosition}>
      {rings.map((ring) => {
        // Move rings toward camera as progress increases
        const zOffset = ring.baseZ + progress * 4;
        // Only show rings in visible range
        if (zOffset < -3 || zOffset > 0.5) return null;
        
        const depthFade = 1 - Math.abs(zOffset) / 3;
        const ringOpacity = tunnelOpacity * depthFade * 0.8;
        
        // Radius expands as ring approaches
        const dynamicRadius = ring.baseRadius * (1 + (zOffset + 3) * 0.3);
        
        return (
          <TunnelRing
            key={ring.id}
            radius={dynamicRadius}
            zPosition={zOffset}
            rotation={ring.rotationOffset + timeRef.current * 0.3}
            opacity={ringOpacity}
            color={color}
            time={timeRef.current}
            ringIndex={ring.id}
          />
        );
      })}
      
      {/* Central vortex glow */}
      <mesh>
        <circleGeometry args={[0.05 + progress * 0.1, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={tunnelOpacity * 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
