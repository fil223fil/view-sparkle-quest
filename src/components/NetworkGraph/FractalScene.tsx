import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FractalUniverse } from './FractalUniverse';
import { FormulaTunnel } from './FormulaTunnel';

// Color palette for tunnel
const TUNNEL_COLORS = [
  '#00D9FF', '#FF2D7B', '#A855F7', '#FFB800', 
  '#00FF87', '#FF6B35', '#667EEA', '#38B2AC'
];

interface UniverseLevel {
  id: number;
  depth: number;
  position: [number, number, number];
  targetScale: number;
  currentScale: number;
  opacity: number;
}

interface FractalSceneProps {
  isPaused: boolean;
  onReset: () => void;
  resetTrigger: number;
}

export const FractalScene = ({ isPaused, resetTrigger }: FractalSceneProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [universes, setUniverses] = useState<UniverseLevel[]>([
    { id: 0, depth: 0, position: [0, 0, 0], targetScale: 1, currentScale: 0, opacity: 1 }
  ]);
  const [activeDepth, setActiveDepth] = useState(0);
  const lastResetRef = useRef(resetTrigger);

  // Handle reset
  useEffect(() => {
    if (resetTrigger !== lastResetRef.current) {
      lastResetRef.current = resetTrigger;
      setUniverses([{ id: 0, depth: 0, position: [0, 0, 0], targetScale: 1, currentScale: 0, opacity: 1 }]);
      setActiveDepth(0);
      setDivePhase('idle');
      camera.position.set(0, 0, 5);
    }
  }, [resetTrigger, camera]);

  const [divePhase, setDivePhase] = useState<'idle' | 'approaching' | 'entering' | 'expanding'>('idle');
  const diveTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const diveProgressRef = useRef(0);
  const [tunnelProgress, setTunnelProgress] = useState(0);
  const universeIdCounter = useRef(1);

  const handleDiveIn = useCallback((position: [number, number, number], newDepth: number) => {
    if (divePhase !== 'idle') return;

    const targetPos = new THREE.Vector3(...position);
    diveTargetRef.current = targetPos;
    diveProgressRef.current = 0;
    setTunnelProgress(0);
    
    setDivePhase('approaching');
    setActiveDepth(newDepth);
    
    // Create new universe with unique ID
    const newUniverse: UniverseLevel = {
      id: universeIdCounter.current++,
      depth: newDepth,
      position,
      targetScale: 0.01,
      currentScale: 0.001,
      opacity: 0,
    };

    // Remove old universes aggressively to prevent memory issues
    setUniverses(prev => {
      // Keep only current-1 and new
      const filtered = prev.filter(u => u.depth >= newDepth - 1);
      return [...filtered, newUniverse];
    });
  }, [divePhase]);

  useFrame((_, delta) => {
    const target = diveTargetRef.current;
    
    if (divePhase === 'approaching') {
      diveProgressRef.current += delta * 1.8;
      setTunnelProgress(Math.min(diveProgressRef.current * 0.5, 0.5));
      
      const eased = 1 - Math.pow(1 - Math.min(diveProgressRef.current, 1), 3);
      
      const direction = new THREE.Vector3().subVectors(target, camera.position).normalize();
      const distanceToTarget = camera.position.distanceTo(target);
      const moveSpeed = distanceToTarget * 0.12 * (1 + eased);
      camera.position.add(direction.multiplyScalar(moveSpeed));
      
      if (distanceToTarget < 0.1) {
        setDivePhase('entering');
        diveProgressRef.current = 0;
      }
    }
    
    if (divePhase === 'entering') {
      diveProgressRef.current += delta * 2.5;
      const t = Math.min(diveProgressRef.current, 1);
      setTunnelProgress(0.5 + t * 0.5);
      
      // Camera passes through
      const direction = new THREE.Vector3().subVectors(target, camera.position).normalize();
      camera.position.add(direction.multiplyScalar(delta * 2));
      
      setUniverses(prev => prev.map(u => {
        if (u.depth === activeDepth) {
          return {
            ...u,
            targetScale: 0.3 + t * 0.5,
            opacity: Math.min(u.opacity + delta * 2, 1),
          };
        }
        if (u.depth < activeDepth) {
          return { ...u, opacity: Math.max(u.opacity - delta * 3, 0) };
        }
        return u;
      }));
      
      if (t >= 1) {
        setDivePhase('expanding');
        diveProgressRef.current = 0;
        setTunnelProgress(0);
      }
    }
    
    if (divePhase === 'expanding') {
      diveProgressRef.current += delta * 2;
      
      setUniverses(prev => prev.map(u => {
        if (u.depth === activeDepth) {
          return {
            ...u,
            targetScale: 0.8,
            currentScale: THREE.MathUtils.lerp(u.currentScale, 0.8, 0.1),
            opacity: 1,
          };
        }
        // Remove old universes from rendering
        if (u.depth < activeDepth) {
          return { ...u, opacity: 0 };
        }
        return u;
      }));
      
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const idealPos = new THREE.Vector3(...activeUniverse.position).add(new THREE.Vector3(0, 0, 1.5));
        camera.position.lerp(idealPos, 0.08);
      }
      
      if (diveProgressRef.current >= 1) {
        setDivePhase('idle');
        // Clean up invisible universes
        setUniverses(prev => prev.filter(u => u.opacity > 0));
      }
    }
    
    if (divePhase === 'idle') {
      setUniverses(prev => prev.map(u => ({
        ...u,
        currentScale: THREE.MathUtils.lerp(u.currentScale, u.targetScale, 0.05),
      })));
    }

    if (controlsRef.current && universes.length > 0) {
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const targetVec = new THREE.Vector3(...activeUniverse.position);
        controlsRef.current.target.lerp(targetVec, 0.08);
      }
    }
  });

  // Handle going back
  const handleGoBack = useCallback(() => {
    if (activeDepth > 0 && divePhase === 'idle') {
      setActiveDepth(prev => prev - 1);
      setDivePhase('expanding');
      diveProgressRef.current = 0;
      
      // Update universes for going back
      setUniverses(prev => prev.map(u => {
        if (u.depth === activeDepth - 1) {
          return { ...u, targetScale: 0.8, opacity: 1 };
        }
        if (u.depth === activeDepth) {
          return { ...u, targetScale: 0.3, opacity: 0.3 };
        }
        return u;
      }));
    }
  }, [activeDepth, divePhase]);

  return (
    <>
      {/* Background stars */}
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Ambient light */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#58C4DD" />

      {/* Formula tunnel effect during dive */}
      <FormulaTunnel
        isActive={divePhase === 'approaching' || divePhase === 'entering'}
        progress={tunnelProgress}
        targetPosition={[diveTargetRef.current.x, diveTargetRef.current.y, diveTargetRef.current.z]}
        color={TUNNEL_COLORS[activeDepth % TUNNEL_COLORS.length]}
      />

      {/* Render all universe levels */}
      {universes.map((universe) => (
        <FractalUniverse
          key={universe.id}
          depth={universe.depth}
          position={universe.position}
          scale={universe.currentScale}
          opacity={universe.opacity}
          onDiveIn={handleDiveIn}
          isActive={universe.opacity > 0.05}
        />
      ))}

      {/* Back button hint when deep */}
      {activeDepth > 0 && (
        <group position={[0, 1.5, 0]}>
          <Text
            fontSize={0.1}
            color="#58C4DD"
            anchorX="center"
            onClick={handleGoBack}
            onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
            onPointerOut={(e) => (document.body.style.cursor = 'default')}
          >
            ← Назад (Глубина {activeDepth})
          </Text>
        </group>
      )}

      {/* Instructions */}
      {activeDepth === 0 && divePhase === 'idle' && (
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.08}
          color="#58C4DD"
          anchorX="center"
          fillOpacity={0.6}
        >
          Нажмите на узел для погружения во вселенную
        </Text>
      )}

      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={15}
        autoRotate={!isPaused && divePhase === 'idle'}
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};
