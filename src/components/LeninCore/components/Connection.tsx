// Connection visualization with 8 semantic types
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { ConnectionData, WidgetData, CONNECTION_STYLES } from '../types';

interface ConnectionProps {
  connection: ConnectionData;
  widgets: WidgetData[];
  isHighlighted: boolean;
  isFocusActive: boolean;
}

// Animated particles for data flow connections
const DataFlowParticles: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  strength: number;
}> = ({ start, end, control, color, strength }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = Math.ceil(5 * strength);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const offsets = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      offsets[i] = i / particleCount;
    }
    
    return { positions, offsets };
  }, [particleCount]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const offset = (particles.offsets[i] + t * 0.3) % 1;
      
      // Quadratic bezier interpolation
      const mt = 1 - offset;
      const x = mt * mt * start.x + 2 * mt * offset * control.x + offset * offset * end.x;
      const y = mt * mt * start.y + 2 * mt * offset * control.y + offset * offset * end.y;
      const z = mt * mt * start.z + 2 * mt * offset * control.z + offset * offset * end.z;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
};

// Arrow head for logic chain connections
const ArrowHead: React.FC<{
  position: THREE.Vector3;
  direction: THREE.Vector3;
  color: string;
}> = ({ position, direction, color }) => {
  const rotation = useMemo(() => {
    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    euler.setFromQuaternion(quaternion);
    return euler;
  }, [direction]);

  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.05, 0.12, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

export const Connection: React.FC<ConnectionProps> = ({
  connection,
  widgets,
  isHighlighted,
  isFocusActive,
}) => {
  const { from, to, type, strength = 0.5 } = connection;
  const style = CONNECTION_STYLES[type];

  // Find connected widgets
  const startWidget = widgets.find((w) => w.id === from);
  const endWidget = widgets.find((w) => w.id === to);

  if (!startWidget || !endWidget) return null;

  // Convert positions to 3D coordinates
  const startPos = new THREE.Vector3(
    startWidget.position.x / 100,
    -startWidget.position.y / 100,
    startWidget.position.z / 50
  );
  const endPos = new THREE.Vector3(
    endWidget.position.x / 100,
    -endWidget.position.y / 100,
    endWidget.position.z / 50
  );

  // Calculate control point for curved line
  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  const controlOffset = distance * 0.3;
  
  // Perpendicular offset for curve
  const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
  const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0.2);
  const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(controlOffset));

  // Calculate visual properties based on state
  const opacity = isFocusActive
    ? isHighlighted
      ? style.opacity
      : 0.15
    : style.opacity * 0.7;

  const lineWidth = isHighlighted ? (type === 'dataFlow' ? 2 + strength * 2 : 2) : 1;
  const color = style.color;

  // Arrow direction for logic chain
  const arrowDirection = new THREE.Vector3().subVectors(endPos, controlPoint).normalize();
  const arrowPosition = endPos.clone().sub(arrowDirection.clone().multiplyScalar(0.15));

  return (
    <group>
      {/* Main line */}
      <QuadraticBezierLine
        start={startPos}
        end={endPos}
        mid={controlPoint}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={!!style.dashArray}
        dashScale={style.dashArray ? 10 : undefined}
        dashSize={style.dashArray ? 0.3 : undefined}
        gapSize={style.dashArray ? 0.15 : undefined}
      />

      {/* Data flow particles */}
      {type === 'dataFlow' && isHighlighted && (
        <DataFlowParticles
          start={startPos}
          end={endPos}
          control={controlPoint}
          color={style.particleColor || color}
          strength={strength}
        />
      )}

      {/* Logic chain arrow */}
      {type === 'logicChain' && (
        <ArrowHead
          position={arrowPosition}
          direction={arrowDirection}
          color={color}
        />
      )}

      {/* Glow effect for highlighted connections */}
      {isHighlighted && (
        <QuadraticBezierLine
          start={startPos}
          end={endPos}
          mid={controlPoint}
          color={color}
          lineWidth={lineWidth + 4}
          transparent
          opacity={opacity * 0.3}
        />
      )}
    </group>
  );
};
