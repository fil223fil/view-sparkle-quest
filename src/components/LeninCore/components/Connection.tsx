import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
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
  const particleCount = Math.max(8, Math.ceil(20 * strength));
  
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
      const offset = (particles.offsets[i] + t * 0.4) % 1;
      
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
        size={0.12}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Animated arrow for logic chain connections
const AnimatedLogicArrow: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
}> = ({ start, end, control, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = (clock.elapsedTime * 0.3) % 1;
    
    const mt = 1 - t;
    const x = mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x;
    const y = mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y;
    const z = mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z;
    meshRef.current.position.set(x, y, z);
    
    const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
    const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);
    const dz = 2 * mt * (control.z - start.z) + 2 * t * (end.z - control.z);
    
    const direction = new THREE.Vector3(dx, dy, dz).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    meshRef.current.quaternion.copy(quaternion);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.08, 0.2, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

// Golden thread animation for Context Link
const GoldenThreadLine: React.FC<any> = (props) => {
  const lineRef = useRef<any>(null);
  const baseOpacity = props.opacity || 0.5;
  
  useFrame(({ clock }) => {
    if (lineRef.current?.material) {
      lineRef.current.material.opacity = baseOpacity * (0.5 + Math.sin(clock.elapsedTime * 3) * 0.5);
    }
  });

  return <QuadraticBezierLine ref={lineRef} {...props} />;
};

export const Connection: React.FC<ConnectionProps> = ({
  connection,
  widgets,
  isHighlighted,
  isFocusActive,
}) => {
  const { from, to, type, strength = 0.5 } = connection;
  const style = CONNECTION_STYLES[type];

  const startWidget = widgets.find((w) => w.id === from);
  const endWidget = widgets.find((w) => w.id === to);

  if (!startWidget || !endWidget) return null;

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

  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  const controlOffset = distance * 0.3;
  
  const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
  const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0.2);
  const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(controlOffset));

  const opacity = isFocusActive
    ? isHighlighted
      ? style.opacity
      : 0.15
    : style.opacity * 0.7;

  const lineWidth = isHighlighted ? (type === 'dataFlow' ? 2 + strength * 2 : 2) : 1;
  const color = style.color;
  
  // Parse dash array if exists
  let dashSize, gapSize;
  if (style.dashArray) {
    const parts = style.dashArray.split(',');
    dashSize = parseFloat(parts[0]) * 0.05;
    gapSize = parseFloat(parts[1]) * 0.05;
  }

  const LineComponent = type === 'contextLink' ? GoldenThreadLine : QuadraticBezierLine;

  return (
    <group>
      {/* Main line */}
      <LineComponent
        start={startPos}
        end={endPos}
        mid={controlPoint}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
        dashed={!!style.dashArray}
        dashScale={1}
        dashSize={dashSize}
        gapSize={gapSize}
      />

      {/* Data flow particles */}
      {type === 'dataFlow' && (isHighlighted || !isFocusActive) && (
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
        <AnimatedLogicArrow
          start={startPos}
          end={endPos}
          control={controlPoint}
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
          blending={THREE.AdditiveBlending}
        />
      )}
    </group>
  );
};