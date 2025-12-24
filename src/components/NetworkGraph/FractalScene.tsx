import { useRef, useState, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { FractalUniverse } from './FractalUniverse';

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

  const handleDiveIn = useCallback((position: [number, number, number], newDepth: number) => {
    if (divePhase !== 'idle') return;

    const targetPos = new THREE.Vector3(...position);
    diveTargetRef.current = targetPos;
    diveProgressRef.current = 0;
    
    setDivePhase('approaching');
    setActiveDepth(newDepth);
    
    // Create new universe immediately but tiny and invisible
    const newUniverse: UniverseLevel = {
      id: Date.now(),
      depth: newDepth,
      position,
      targetScale: 0.01, // Start very small
      currentScale: 0.001,
      opacity: 0,
    };

    // Keep only recent universes
    setUniverses(prev => {
      const filtered = prev.filter(u => u.depth >= newDepth - 2);
      return [...filtered, newUniverse];
    });
  }, [divePhase]);

  useFrame((_, delta) => {
    const target = diveTargetRef.current;
    
    if (divePhase === 'approaching') {
      // Move camera towards clicked point smoothly
      diveProgressRef.current += delta * 1.2;
      const t = Math.min(diveProgressRef.current, 1);
      const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic
      
      // Move camera closer to target
      const direction = new THREE.Vector3().subVectors(target, camera.position).normalize();
      const distanceToTarget = camera.position.distanceTo(target);
      const moveSpeed = distanceToTarget * 0.08 * (1 + eased);
      camera.position.add(direction.multiplyScalar(moveSpeed));
      
      // When very close, start entering phase
      if (distanceToTarget < 0.15) {
        setDivePhase('entering');
        diveProgressRef.current = 0;
      }
    }
    
    if (divePhase === 'entering') {
      // "Pass through" the point - camera continues forward
      diveProgressRef.current += delta * 2;
      const t = Math.min(diveProgressRef.current, 1);
      
      // Start expanding the new universe
      setUniverses(prev => prev.map(u => {
        if (u.depth === activeDepth) {
          return {
            ...u,
            targetScale: 0.5 + t * 0.3,
            opacity: Math.min(u.opacity + 0.1, 1),
          };
        }
        // Fade out previous level
        if (u.depth === activeDepth - 1) {
          return {
            ...u,
            opacity: Math.max(u.opacity - 0.05, 0.15),
          };
        }
        return u;
      }));
      
      if (t >= 1) {
        setDivePhase('expanding');
        diveProgressRef.current = 0;
      }
    }
    
    if (divePhase === 'expanding') {
      // Final expansion and settling
      diveProgressRef.current += delta * 1.5;
      
      setUniverses(prev => prev.map(u => {
        if (u.depth === activeDepth) {
          const targetScale = 0.8;
          return {
            ...u,
            targetScale,
            currentScale: THREE.MathUtils.lerp(u.currentScale, targetScale, 0.08),
            opacity: THREE.MathUtils.lerp(u.opacity, 1, 0.1),
          };
        }
        if (u.depth < activeDepth) {
          return {
            ...u,
            opacity: THREE.MathUtils.lerp(u.opacity, 0.1, 0.05),
          };
        }
        return u;
      }));
      
      // Camera settles at comfortable distance
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const idealPos = new THREE.Vector3(...activeUniverse.position).add(new THREE.Vector3(0, 0, 1.2));
        camera.position.lerp(idealPos, 0.03);
      }
      
      if (diveProgressRef.current >= 1.5) {
        setDivePhase('idle');
      }
    }
    
    // Idle state - gentle updates
    if (divePhase === 'idle') {
      setUniverses(prev => prev.map(u => ({
        ...u,
        currentScale: THREE.MathUtils.lerp(u.currentScale, u.targetScale, 0.05),
      })));
    }

    // Update orbit controls target
    if (controlsRef.current && universes.length > 0) {
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const targetVec = new THREE.Vector3(...activeUniverse.position);
        controlsRef.current.target.lerp(targetVec, 0.05);
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

      {/* Render all universe levels */}
      {universes.map((universe) => (
        <FractalUniverse
          key={universe.id}
          depth={universe.depth}
          position={universe.position}
          scale={universe.currentScale}
          opacity={universe.opacity}
          onDiveIn={handleDiveIn}
          isActive={universe.opacity > 0.1}
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
