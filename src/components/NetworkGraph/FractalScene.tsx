import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
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

// 3B1B style colors
const COLORS = {
  background: '#1C1C1C',
  blue: '#58C4DD',
  lightBlue: '#9CDCEB',
  teal: '#5CD0B3',
  green: '#83C167',
  yellow: '#F9F871',
  gold: '#E8B923',
  red: '#FC6255',
  maroon: '#CF5044',
  purple: '#9A72AC',
  pink: '#D147BD',
  white: '#FFFFFF',
  grey: '#888888',
  darkGrey: '#444444',
};

// Subtle grid plane - 3B1B signature element
const SubtleGrid = ({ time }: { time: number }) => {
  const gridLines = useMemo(() => {
    const lines: { start: THREE.Vector3; end: THREE.Vector3; axis: 'x' | 'z' }[] = [];
    const size = 8;
    const divisions = 16;
    const step = size / divisions;
    
    for (let i = -divisions / 2; i <= divisions / 2; i++) {
      const pos = i * step;
      // X-axis lines
      lines.push({
        start: new THREE.Vector3(-size / 2, -2, pos),
        end: new THREE.Vector3(size / 2, -2, pos),
        axis: 'x'
      });
      // Z-axis lines
      lines.push({
        start: new THREE.Vector3(pos, -2, -size / 2),
        end: new THREE.Vector3(pos, -2, size / 2),
        axis: 'z'
      });
    }
    return lines;
  }, []);

  return (
    <group>
      {gridLines.map((line, i) => {
        const isMainAxis = Math.abs(line.start.x) < 0.01 || Math.abs(line.start.z) < 0.01;
        const opacity = isMainAxis ? 0.15 : 0.04;
        
        return (
          <Line
            key={i}
            points={[line.start, line.end]}
            color={COLORS.blue}
            lineWidth={isMainAxis ? 1.5 : 0.5}
            transparent
            opacity={opacity}
          />
        );
      })}
    </group>
  );
};

// Gentle floating mathematical point
const MathPoint = ({ 
  position, 
  color, 
  size, 
  time, 
  index 
}: { 
  position: [number, number, number];
  color: string;
  size: number;
  time: number;
  index: number;
}) => {
  // Very gentle, smooth oscillation - 3B1B style
  const y = position[1] + Math.sin(time * 0.3 + index * 0.5) * 0.1;
  const pulse = 0.8 + Math.sin(time * 0.5 + index * 0.7) * 0.2;
  
  return (
    <group position={[position[0], y, position[2]]}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={pulse * 0.9} />
      </mesh>
      {/* Soft glow */}
      <mesh>
        <sphereGeometry args={[size * 2, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={pulse * 0.15} />
      </mesh>
    </group>
  );
};

// Smooth bezier curve connection - 3B1B signature
const SmoothCurve = ({
  start,
  end,
  color,
  opacity,
  time,
  curveHeight = 0.5
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  opacity: number;
  time: number;
  curveHeight?: number;
}) => {
  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    mid.y += curveHeight;
    
    const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    return curve.getPoints(32);
  }, [start, end, curveHeight]);

  // Gentle pulse
  const pulse = 0.7 + Math.sin(time * 0.4) * 0.3;

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={opacity * pulse}
    />
  );
};

// Orbiting accent - very subtle
const OrbitingAccent = ({
  radius,
  color,
  time,
  speed,
  yOffset
}: {
  radius: number;
  color: string;
  time: number;
  speed: number;
  yOffset: number;
}) => {
  const angle = time * speed;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const pulse = 0.6 + Math.sin(time * 0.8) * 0.4;
  
  return (
    <mesh position={[x, yOffset, z]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={pulse * 0.5} />
    </mesh>
  );
};

export const FractalScene = ({ isPaused, resetTrigger }: FractalSceneProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [universes, setUniverses] = useState<UniverseLevel[]>([
    { id: 0, depth: 0, position: [0, 0, 0], targetScale: 1, currentScale: 0, opacity: 1 }
  ]);
  const [activeDepth, setActiveDepth] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 5));
  const [time, setTime] = useState(0);
  const lastResetRef = useRef(resetTrigger);

  // Decorative points in 3B1B style
  const decorativePoints = useMemo(() => [
    { position: [-3, 0.5, -2] as [number, number, number], color: COLORS.blue, size: 0.03 },
    { position: [3.5, 0.2, -1.5] as [number, number, number], color: COLORS.teal, size: 0.025 },
    { position: [-2, -0.3, 2] as [number, number, number], color: COLORS.purple, size: 0.02 },
    { position: [2.5, 0.8, 2.5] as [number, number, number], color: COLORS.gold, size: 0.025 },
    { position: [0, 1.2, -3] as [number, number, number], color: COLORS.lightBlue, size: 0.03 },
    { position: [-3.5, -0.5, 0] as [number, number, number], color: COLORS.pink, size: 0.02 },
  ], []);

  // Subtle connecting curves
  const decorativeCurves = useMemo(() => [
    { start: [-3, 0.5, -2] as [number, number, number], end: [0, 1.2, -3] as [number, number, number], color: COLORS.blue },
    { start: [3.5, 0.2, -1.5] as [number, number, number], end: [2.5, 0.8, 2.5] as [number, number, number], color: COLORS.teal },
    { start: [-2, -0.3, 2] as [number, number, number], end: [-3.5, -0.5, 0] as [number, number, number], color: COLORS.purple },
  ], []);

  // Handle reset
  useEffect(() => {
    if (resetTrigger !== lastResetRef.current) {
      lastResetRef.current = resetTrigger;
      setUniverses([{ id: 0, depth: 0, position: [0, 0, 0], targetScale: 1, currentScale: 0, opacity: 1 }]);
      setActiveDepth(0);
      setIsZooming(false);
      setZoomTarget(new THREE.Vector3(0, 0, 0.8));
      camera.position.set(0, 0, 0.8);
    }
  }, [resetTrigger, camera]);

  const handleDiveIn = useCallback((position: [number, number, number], newDepth: number) => {
    if (isZooming) return;

    setIsZooming(true);
    
    const newUniverse: UniverseLevel = {
      id: Date.now(),
      depth: newDepth,
      position,
      targetScale: 0.3,
      currentScale: 0,
      opacity: 0,
    };

    setUniverses(prev => {
      const filtered = prev.filter(u => u.depth >= newDepth - 2);
      return [...filtered, newUniverse];
    });
    
    const targetPos = new THREE.Vector3(...position);
    const cameraTargetDistance = 0.25; // Ещё ближе к узлам
    // Фронтальный вид - камера прямо перед целью по оси Z
    const newCameraPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z + cameraTargetDistance);
    
    setZoomTarget(newCameraPos);
    setActiveDepth(newDepth);
  }, [isZooming, camera]);

  useFrame(({ clock }) => {
    if (!isPaused) {
      setTime(clock.elapsedTime);
    }
    
    if (isZooming) {
      // Smooth easing - 3B1B style
      camera.position.lerp(zoomTarget, 0.04);
      
      if (camera.position.distanceTo(zoomTarget) < 0.05) {
        setIsZooming(false);
      }
    }

    setUniverses(prev => prev.map(u => {
      const isCurrentLevel = u.depth === activeDepth;
      const isPreviousLevel = u.depth === activeDepth - 1;
      
      let targetOpacity = 0;
      if (isCurrentLevel) targetOpacity = 1;
      else if (isPreviousLevel) targetOpacity = 0.3;
      
      return {
        ...u,
        currentScale: THREE.MathUtils.lerp(u.currentScale, u.targetScale, 0.06),
        opacity: THREE.MathUtils.lerp(u.opacity, targetOpacity, 0.06),
      };
    }));

    if (controlsRef.current && universes.length > 0) {
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const target = new THREE.Vector3(...activeUniverse.position);
        controlsRef.current.target.lerp(target, 0.06);
      }
    }
  });

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
      {/* 3B1B signature: subtle grid */}
      <SubtleGrid time={time} />

      {/* Clean, minimal lighting */}
      <ambientLight intensity={0.15} color="#FFFFFF" />
      <pointLight position={[0, 3, 3]} intensity={0.3} color={COLORS.blue} decay={2} distance={15} />
      <pointLight position={[-3, 2, -2]} intensity={0.15} color={COLORS.purple} decay={2} distance={10} />

      {/* Decorative mathematical points */}
      {decorativePoints.map((point, i) => (
        <MathPoint
          key={`point-${i}`}
          position={point.position}
          color={point.color}
          size={point.size}
          time={time}
          index={i}
        />
      ))}

      {/* Subtle connecting curves */}
      {decorativeCurves.map((curve, i) => (
        <SmoothCurve
          key={`curve-${i}`}
          start={curve.start}
          end={curve.end}
          color={curve.color}
          opacity={0.15}
          time={time}
          curveHeight={0.3 + i * 0.1}
        />
      ))}

      {/* Gentle orbiting accents */}
      <OrbitingAccent radius={4} color={COLORS.blue} time={time} speed={0.08} yOffset={0} />
      <OrbitingAccent radius={5} color={COLORS.teal} time={time} speed={-0.05} yOffset={0.5} />
      <OrbitingAccent radius={3.5} color={COLORS.purple} time={time} speed={0.06} yOffset={-0.3} />

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

      {/* 3B1B style back button */}
      {activeDepth > 0 && (
        <group position={[0, 1.5, 0]}>
          <Text
            fontSize={0.05}
            color={COLORS.blue}
            anchorX="center"
            anchorY="middle"
            onClick={handleGoBack}
            onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
            onPointerOut={(e) => (document.body.style.cursor = 'default')}
            fillOpacity={0.9}
          >
            ← назад
          </Text>
        </group>
      )}

      {/* Instructions - 3B1B style */}
      {activeDepth === 0 && !isZooming && (
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.04}
          color={COLORS.grey}
          anchorX="center"
          fillOpacity={0.5}
        >
          нажмите на узел
        </Text>
      )}

      {/* Camera controls - slower, smoother */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={0.5}
        maxDistance={15}
        autoRotate={!isPaused && !isZooming}
        autoRotateSpeed={0.15}
        enableDamping
        dampingFactor={0.03}
      />
    </>
  );
};
