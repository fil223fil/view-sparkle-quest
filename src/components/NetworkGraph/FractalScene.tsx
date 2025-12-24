import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Sphere, Line } from '@react-three/drei';
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

// Particles that orbit around the camera - YOUR personal cosmos
const CameraOrbitingParticle = ({ 
  index, 
  time,
  cameraPosition
}: { 
  index: number;
  time: number;
  cameraPosition: THREE.Vector3;
}) => {
  const speed = 0.1 + (index % 5) * 0.03;
  const radius = 0.8 + (index % 4) * 0.4;
  const tilt = (index * 0.5) % Math.PI;
  const phase = index * 0.7;
  
  const angle = time * speed + phase;
  const x = cameraPosition.x + Math.cos(angle) * Math.cos(tilt) * radius;
  const y = cameraPosition.y + Math.sin(angle) * radius * 0.6;
  const z = cameraPosition.z + Math.sin(angle) * Math.cos(tilt) * radius - radius;
  
  const colors = ['#0A84FF', '#BF5AF2', '#64D2FF', '#5E5CE6', '#30D158', '#FF6482'];
  const color = colors[index % colors.length];
  const pulse = 0.5 + Math.sin(time * 2 + index) * 0.3;
  const size = 0.008 + (index % 3) * 0.004;
  
  return (
    <group position={[x, y, z]}>
      <Sphere args={[size, 6, 6]}>
        <meshBasicMaterial color={color} transparent opacity={pulse * 0.7} />
      </Sphere>
      {/* Glow */}
      <Sphere args={[size * 2.5, 4, 4]}>
        <meshBasicMaterial color={color} transparent opacity={pulse * 0.15} />
      </Sphere>
    </group>
  );
};

// Close foreground particles that create depth - very close to you
const ForegroundParticle = ({
  index,
  time,
  cameraPosition
}: {
  index: number;
  time: number;
  cameraPosition: THREE.Vector3;
}) => {
  const baseOffset = useMemo(() => ({
    x: (Math.random() - 0.5) * 3,
    y: (Math.random() - 0.5) * 2,
    z: -1.5 - Math.random() * 2
  }), []);
  
  const drift = Math.sin(time * 0.2 + index) * 0.3;
  const x = cameraPosition.x + baseOffset.x + drift;
  const y = cameraPosition.y + baseOffset.y + Math.cos(time * 0.15 + index) * 0.2;
  const z = cameraPosition.z + baseOffset.z;
  
  const colors = ['#0A84FF', '#BF5AF2', '#64D2FF'];
  const color = colors[index % 3];
  const opacity = 0.1 + Math.sin(time * 0.5 + index * 2) * 0.08;
  
  return (
    <Sphere args={[0.003 + (index % 3) * 0.002, 4, 4]} position={[x, y, z]}>
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </Sphere>
  );
};

// Energy wisps that float towards/around you
const EnergyWisp = ({
  index,
  time,
  cameraPosition
}: {
  index: number;
  time: number;
  cameraPosition: THREE.Vector3;
}) => {
  const phase = index * 1.2;
  const cycleTime = ((time * 0.08 + phase) % 3);
  
  // Move from far to close, creating sense of things coming to you
  const distance = 6 - cycleTime * 2;
  const angle = phase + time * 0.05;
  const ySpread = Math.sin(phase) * 2;
  
  const x = cameraPosition.x + Math.cos(angle) * distance;
  const y = cameraPosition.y + ySpread + Math.sin(time * 0.3 + phase) * 0.5;
  const z = cameraPosition.z - distance * 0.8;
  
  const colors = ['#64D2FF', '#BF5AF2', '#0A84FF', '#5E5CE6'];
  const color = colors[index % 4];
  const opacity = Math.sin(cycleTime / 3 * Math.PI) * 0.4;
  const size = 0.015 + Math.sin(time + index) * 0.005;
  
  return (
    <group position={[x, y, z]}>
      <Sphere args={[size, 6, 6]}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Sphere>
      {/* Trail */}
      <Sphere args={[size * 0.7, 4, 4]} position={[0.08, 0, 0.08]}>
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.4} />
      </Sphere>
      <Sphere args={[size * 0.4, 4, 4]} position={[0.15, 0, 0.15]}>
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.2} />
      </Sphere>
    </group>
  );
};

// Ambient aura around the camera - the universe breathing with you
const CameraAura = ({
  time,
  cameraPosition
}: {
  time: number;
  cameraPosition: THREE.Vector3;
}) => {
  const pulse = 0.8 + Math.sin(time * 0.4) * 0.2;
  
  return (
    <group position={[cameraPosition.x, cameraPosition.y, cameraPosition.z - 2]}>
      {/* Inner aura */}
      <Sphere args={[1.5, 16, 16]}>
        <meshBasicMaterial color="#5E5CE6" transparent opacity={0.02 * pulse} side={THREE.BackSide} />
      </Sphere>
      {/* Outer aura */}
      <Sphere args={[3, 12, 12]}>
        <meshBasicMaterial color="#0A84FF" transparent opacity={0.01 * pulse} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
};

// Orbital ring centered on camera
const PersonalOrbitalRing = ({ 
  radius, 
  color, 
  opacity, 
  rotationSpeed,
  tilt,
  time,
  cameraPosition
}: { 
  radius: number;
  color: string;
  opacity: number;
  rotationSpeed: number;
  tilt: [number, number, number];
  time: number;
  cameraPosition: THREE.Vector3;
}) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle * 3) * 0.05,
        Math.sin(angle) * radius
      ));
    }
    return pts;
  }, [radius]);
  
  return (
    <group position={[cameraPosition.x, cameraPosition.y, cameraPosition.z - 1]} rotation={[tilt[0], time * rotationSpeed, tilt[2]]}>
      <Line
        points={points}
        color={color}
        lineWidth={1}
        transparent
        opacity={opacity}
      />
    </group>
  );
};

// Background nebula - distant but surrounding
const NebulaCloud = ({
  position,
  size,
  color,
  opacity,
  time
}: {
  position: [number, number, number];
  size: number;
  color: string;
  opacity: number;
  time: number;
}) => {
  const pulse = 0.8 + Math.sin(time * 0.2 + position[0]) * 0.2;
  const drift = Math.sin(time * 0.08 + position[1]) * 0.2;
  
  return (
    <group position={[position[0] + drift, position[1], position[2]]}>
      <Sphere args={[size, 12, 12]}>
        <meshBasicMaterial color={color} transparent opacity={opacity * pulse * 0.12} />
      </Sphere>
      <Sphere args={[size * 0.6, 8, 8]}>
        <meshBasicMaterial color={color} transparent opacity={opacity * pulse * 0.2} />
      </Sphere>
    </group>
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


  // Generate nebula clouds
  const nebulaClouds = useMemo(() => [
    { position: [6, 2, -8] as [number, number, number], size: 2, color: '#5E5CE6', opacity: 0.4 },
    { position: [-7, -1, -6] as [number, number, number], size: 1.8, color: '#BF5AF2', opacity: 0.35 },
    { position: [4, -3, 7] as [number, number, number], size: 1.5, color: '#0A84FF', opacity: 0.3 },
    { position: [-5, 3, 5] as [number, number, number], size: 2.2, color: '#64D2FF', opacity: 0.25 },
    { position: [0, 5, -10] as [number, number, number], size: 3, color: '#FF6482', opacity: 0.2 },
  ], []);

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
    const cameraTargetDistance = 0.8;
    const direction = new THREE.Vector3().subVectors(camera.position, targetPos).normalize();
    const newCameraPos = targetPos.clone().add(direction.multiplyScalar(cameraTargetDistance));
    
    setZoomTarget(newCameraPos);
    setActiveDepth(newDepth);
  }, [isZooming, camera]);

  useFrame(({ clock }) => {
    if (!isPaused) {
      setTime(clock.elapsedTime);
    }
    
    if (isZooming) {
      camera.position.lerp(zoomTarget, 0.03);
      
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
        currentScale: THREE.MathUtils.lerp(u.currentScale, u.targetScale, 0.05),
        opacity: THREE.MathUtils.lerp(u.opacity, targetOpacity, 0.05),
      };
    }));

    if (controlsRef.current && universes.length > 0) {
      const activeUniverse = universes.find(u => u.depth === activeDepth);
      if (activeUniverse) {
        const target = new THREE.Vector3(...activeUniverse.position);
        controlsRef.current.target.lerp(target, 0.05);
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
      {/* Deep space star layers - multiple depths for parallax feel */}
      <Stars
        radius={300}
        depth={200}
        count={1500}
        factor={1.5}
        saturation={0.15}
        fade
        speed={0.05}
      />
      <Stars
        radius={150}
        depth={80}
        count={500}
        factor={2}
        saturation={0.2}
        fade
        speed={0.1}
      />

      {/* Nebula clouds - distant cosmic atmosphere */}
      {nebulaClouds.map((cloud, i) => (
        <NebulaCloud
          key={`nebula-${i}`}
          position={cloud.position}
          size={cloud.size}
          color={cloud.color}
          opacity={cloud.opacity}
          time={time}
        />
      ))}

      {/* Personal orbital rings - YOUR space */}
      <PersonalOrbitalRing radius={2} color="#5E5CE6" opacity={0.06} rotationSpeed={0.03} tilt={[0.2, 0, 0.1]} time={time} cameraPosition={camera.position} />
      <PersonalOrbitalRing radius={2.8} color="#0A84FF" opacity={0.04} rotationSpeed={-0.02} tilt={[0.4, 0, -0.15]} time={time} cameraPosition={camera.position} />
      <PersonalOrbitalRing radius={3.5} color="#BF5AF2" opacity={0.03} rotationSpeed={0.015} tilt={[-0.15, 0, 0.3]} time={time} cameraPosition={camera.position} />

      {/* Particles orbiting around YOU */}
      {[...Array(20)].map((_, i) => (
        <CameraOrbitingParticle
          key={`orbit-${i}`}
          index={i}
          time={time}
          cameraPosition={camera.position}
        />
      ))}

      {/* Very close foreground particles - intimacy */}
      {[...Array(15)].map((_, i) => (
        <ForegroundParticle
          key={`fg-${i}`}
          index={i}
          time={time}
          cameraPosition={camera.position}
        />
      ))}

      {/* Energy wisps flowing towards you */}
      {[...Array(8)].map((_, i) => (
        <EnergyWisp
          key={`wisp-${i}`}
          index={i}
          time={time}
          cameraPosition={camera.position}
        />
      ))}

      {/* Your personal aura - the universe breathing with you */}
      <CameraAura time={time} cameraPosition={camera.position} />

      {/* Volumetric lighting - pulsing with life */}
      <ambientLight intensity={0.025 + Math.sin(time * 0.5) * 0.01} color="#E8E8ED" />
      <pointLight 
        position={[0, 0, 0]} 
        intensity={0.2 + Math.sin(time * 0.8) * 0.05} 
        color="#5E5CE6" 
        decay={2} 
        distance={20} 
      />
      <pointLight 
        position={[Math.sin(time * 0.2) * 10, 5, Math.cos(time * 0.2) * 5]} 
        intensity={0.1} 
        color="#0A84FF" 
        decay={2} 
        distance={25} 
      />
      <pointLight 
        position={[Math.cos(time * 0.15) * -8, -3, Math.sin(time * 0.15) * -5]} 
        intensity={0.08} 
        color="#BF5AF2" 
        decay={2} 
        distance={20} 
      />
      <pointLight position={[0, 8, -8]} intensity={0.05} color="#64D2FF" decay={2} distance={15} />

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

      {/* visionOS style back button */}
      {activeDepth > 0 && (
        <group position={[0, 1.4, 0]}>
          <mesh
            onClick={handleGoBack}
            onPointerOver={(e) => (document.body.style.cursor = 'pointer')}
            onPointerOut={(e) => (document.body.style.cursor = 'default')}
          >
            <planeGeometry args={[0.28, 0.08]} />
            <meshBasicMaterial color="#1C1C1E" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[0.29, 0.09]} />
            <meshBasicMaterial color="#0A84FF" transparent opacity={0.2} />
          </mesh>
          <Text
            position={[0, 0, 0.001]}
            fontSize={0.038}
            color="#0A84FF"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.95}
          >
            ← Назад
          </Text>
        </group>
      )}

      {/* Instructions */}
      {activeDepth === 0 && !isZooming && (
        <Text
          position={[0, -1.0, 0]}
          fontSize={0.045}
          color="#ffffff"
          anchorX="center"
          fillOpacity={0.2}
        >
          Нажмите на узел
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
        autoRotateSpeed={0.25}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};
