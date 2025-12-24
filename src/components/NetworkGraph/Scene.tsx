import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Node } from './Node';
import { FormulaEdge } from './FormulaEdge';
import { useNetworkAnimation } from './useNetworkAnimation';

interface SceneProps {
  isPaused: boolean;
  onReset: () => void;
  resetTrigger: number;
}

export const Scene = ({ isPaused, resetTrigger }: SceneProps) => {
  const { nodes, edges, reset } = useNetworkAnimation(isPaused);
  const groupRef = useRef<THREE.Group>(null);
  const lastResetRef = useRef(resetTrigger);

  // Handle reset trigger
  if (resetTrigger !== lastResetRef.current) {
    lastResetRef.current = resetTrigger;
    reset();
  }

  // Auto-rotation when not paused
  useFrame(({ clock }) => {
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return (
    <>
      {/* Ambient atmosphere */}
      <Stars
        radius={100}
        depth={50}
        count={1000}
        factor={2}
        saturation={0}
        fade
        speed={0.5}
      />
      
      {/* Subtle ambient light */}
      <ambientLight intensity={0.2} />
      
      {/* Point light at center for glow effect */}
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#58C4DD" />
      
      {/* Network group */}
      <group ref={groupRef}>
        {/* Render edges first (behind nodes) */}
        {edges.map((edge, i) => {
          const startNode = nodes.find((n) => n.id === edge.from);
          const endNode = nodes.find((n) => n.id === edge.to);
          
          if (!startNode || !endNode) return null;
          
          return (
            <FormulaEdge
              key={`edge-${i}`}
              start={startNode.position}
              end={endNode.position}
              opacity={edge.opacity}
              formulaIndex={i}
            />
          );
        })}
        
        {/* Render nodes */}
        {nodes.map((node) => (
          <Node
            key={`node-${node.id}`}
            position={node.position}
            scale={node.scale}
            opacity={node.opacity}
            pulseOffset={node.id * 0.7}
          />
        ))}
      </group>
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={!isPaused}
        autoRotateSpeed={0.5}
      />
    </>
  );
};
