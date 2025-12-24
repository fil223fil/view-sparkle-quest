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
  const [isZooming, setIsZooming] = useState(false);
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 5));
  const lastResetRef = useRef(resetTrigger);

  // Handle reset
  useEffect(() => {
    if (resetTrigger !== lastResetRef.current) {
      lastResetRef.current = resetTrigger;
      setUniverses([{ id: 0, depth: 0, position: [0, 0, 0], targetScale: 1, currentScale: 0, opacity: 1 }]);
      setActiveDepth(0);
      setIsZooming(false);
      setZoomTarget(new THREE.Vector3(0, 0, 5));
      camera.position.set(0, 0, 5);
    }
  }, [resetTrigger, camera]);

  const handleDiveIn = useCallback((position: [number, number, number], newDepth: number) => {
    if (isZooming) return;

    setIsZooming(true);
    
    // Create new universe at clicked position
    const newUniverse: UniverseLevel = {
      id: Date.now(),
      depth: newDepth,
      position,
      targetScale: 0.3,
      currentScale: 0,
      opacity: 0,
    };

    // Keep only recent universes to prevent memory issues (current + 2 previous)
    setUniverses(prev => {
      const filtered = prev.filter(u => u.depth >= newDepth - 2);
      return [...filtered, newUniverse];
    });
    
    // Set camera zoom target - keep consistent scale for infinite exploration
    const targetPos = new THREE.Vector3(...position);
    const cameraTargetDistance = 0.8; // Fixed distance for consistent feel
    const direction = new THREE.Vector3().subVectors(camera.position, targetPos).normalize();
    const newCameraPos = targetPos.clone().add(direction.multiplyScalar(cameraTargetDistance));
    
    setZoomTarget(newCameraPos);
    setActiveDepth(newDepth);
  }, [isZooming, camera]);

  useFrame(() => {
    if (isZooming) {
      // Smooth camera zoom
      camera.position.lerp(zoomTarget, 0.03);
      
      if (camera.position.distanceTo(zoomTarget) < 0.05) {
        setIsZooming(false);
      }
    }

    // Update universe scales and opacities
    setUniverses(prev => prev.map(u => {
      const isCurrentLevel = u.depth === activeDepth;
      const isPreviousLevel = u.depth === activeDepth - 1;
      
      let targetOpacity = 0;
      if (isCurrentLevel) targetOpacity = 1;
      else if (isPreviousLevel) targetOpacity = 0.3;
      
      return {
        ...u,
        currentScale: THREE.MathUtils.lerp(u.currentScale, u.targetScale, 0.05),
        opacity: THREE.MathUtils.lerp(u.opacity, targetOpacity, 0.05),
      };
    }));

    // Update orbit controls target
    if (controlsRef.current && universes.length > 0) {
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const target = new THREE.Vector3(...activeUniverse.position);
        controlsRef.current.target.lerp(target, 0.05);
      }
    }
  });

  // Handle going back
  const handleGoBack = useCallback(() => {
    if (activeDepth > 0 && !isZooming) {
      setIsZooming(true);
      setActiveDepth(prev => prev - 1);
      
      const parentUniverse = universes.find(u => u.depth === activeDepth - 1);
      if (parentUniverse) {
        const targetPos = new THREE.Vector3(...parentUniverse.position);
        const cameraDistance = 2 / Math.pow(2, activeDepth - 1);
        setZoomTarget(targetPos.clone().add(new THREE.Vector3(0, 0, cameraDistance)));
      }
    }
  }, [activeDepth, isZooming, universes]);

  return (
    <>
      {/* Apple Vision Pro style subtle stars - less dense, softer */}
      <Stars
        radius={150}
        depth={80}
        count={800}
        factor={2}
        saturation={0.2}
        fade
        speed={0.2}
      />

      {/* Soft ambient lighting - Apple style */}
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#5E5CE6" decay={2} />
      <pointLight position={[5, 5, 5]} intensity={0.2} color="#0A84FF" decay={2} />
      <pointLight position={[-5, -5, -5]} intensity={0.15} color="#BF5AF2" decay={2} />

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

      {/* Apple-style back button hint */}
      {activeDepth > 0 && (
        <group position={[0, 1.5, 0]}>
          <Text
            fontSize={0.08}
            color="#0A84FF"
            anchorX="center"
            onClick={handleGoBack}
            onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
            onPointerOut={(e) => (document.body.style.cursor = 'default')}
            fillOpacity={0.8}
          >
            ← Назад
          </Text>
          <Text
            position={[0, -0.12, 0]}
            fontSize={0.04}
            color="#8E8DF0"
            anchorX="center"
            fillOpacity={0.5}
          >
            {`Глубина ${activeDepth}`}
          </Text>
        </group>
      )}

      {/* Instructions - Vision Pro subtle */}
      {activeDepth === 0 && !isZooming && (
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.06}
          color="#5AC8FA"
          anchorX="center"
          fillOpacity={0.4}
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
        autoRotate={!isPaused && !isZooming}
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};
