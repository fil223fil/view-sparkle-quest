// Ambient background with subtle grid and atmosphere
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Background: React.FC = () => {
  const gridRef = useRef<THREE.Points>(null);
  
  // Create subtle dot grid
  const gridPoints = useMemo(() => {
    const points: number[] = [];
    const gridSize = 20;
    const spacing = 0.5;
    
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let y = -gridSize; y <= gridSize; y++) {
        points.push(x * spacing, y * spacing, -2);
      }
    }
    
    return new Float32Array(points);
  }, []);

  // Subtle animation for atmosphere
  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <group>
      {/* Gradient background plane - removed to allow HTML glassmorphism background to show through */}
      


      {/* Dot grid */}
      <points ref={gridRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={gridPoints.length / 3}
            array={gridPoints}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#CBD5E1"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>

      {/* Ambient light for subtle depth */}
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={0.3} color="#58C4DD" />
      <pointLight position={[-5, -3, 3]} intensity={0.2} color="#FF6B9D" />
    </group>
  );
};
