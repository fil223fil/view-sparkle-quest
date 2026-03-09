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

// Minimal elegant particle — single soft dot traveling along the curve
const SoftTravelingDot: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  speed: number;
  delay: number;
}> = ({ start, end, control, color, speed, delay }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const raw = clock.elapsedTime * speed - delay;
    if (raw < 0) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;
    
    const t = (raw % 3) / 3; // gentle 3-second loop
    const mt = 1 - t;
    
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    
    // Soft fade in/out at endpoints
    const fade = Math.sin(t * Math.PI);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = fade * 0.7;
    meshRef.current.scale.setScalar(0.6 + fade * 0.4);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Subtle direction indicator — small chevron at midpoint
const DirectionChevron: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  opacity: number;
}> = ({ start, end, control, color, opacity }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = 0.55; // slightly past midpoint
    const mt = 1 - t;
    
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    
    const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
    const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);
    const dz = 2 * mt * (control.z - start.z) + 2 * t * (end.z - control.z);
    
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    meshRef.current.quaternion.copy(q);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.04, 0.1, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity * 0.6} />
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
  
  // Very gentle curve — Apple prefers clean, low-arc connections
  const controlOffset = distance * 0.15;
  const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();
  const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0.05);
  const controlPoint = midPoint.clone().add(perpendicular.multiplyScalar(controlOffset));

  // Elegant opacity — connections should be felt, not shouted
  const baseOpacity = isFocusActive
    ? isHighlighted ? style.opacity : 0.08
    : style.opacity * 0.5;

  const lineWidth = isHighlighted 
    ? 1.5 + strength * 0.5 
    : 0.8;

  const color = style.color;

  let dashSize, gapSize;
  if (style.dashArray) {
    const parts = style.dashArray.split(',');
    dashSize = parseFloat(parts[0]) * 0.04;
    gapSize = parseFloat(parts[1]) * 0.04;
  }

  const showAnimation = style.animated && (isHighlighted || !isFocusActive);

  return (
    <group>
      {/* Primary line — thin, clean */}
      <QuadraticBezierLine
        start={startPos}
        end={endPos}
        mid={controlPoint}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={baseOpacity}
        dashed={!!style.dashArray}
        dashScale={1}
        dashSize={dashSize}
        gapSize={gapSize}
      />

      {/* Soft ambient glow — only when highlighted */}
      {isHighlighted && (
        <QuadraticBezierLine
          start={startPos}
          end={endPos}
          mid={controlPoint}
          color={style.secondaryColor || color}
          lineWidth={lineWidth + 6}
          transparent
          opacity={baseOpacity * 0.12}
          blending={THREE.AdditiveBlending}
        />
      )}

      {/* Single traveling dot for animated connections */}
      {showAnimation && (
        <>
          <SoftTravelingDot
            start={startPos}
            end={endPos}
            control={controlPoint}
            color={style.particleColor || style.secondaryColor || color}
            speed={0.35}
            delay={0}
          />
          {isHighlighted && (
            <SoftTravelingDot
              start={startPos}
              end={endPos}
              control={controlPoint}
              color={style.particleColor || style.secondaryColor || color}
              speed={0.35}
              delay={1.5}
            />
          )}
        </>
      )}

      {/* Direction chevron for logic/causal connections */}
      {(type === 'logicChain' || type === 'causal') && (
        <DirectionChevron
          start={startPos}
          end={endPos}
          control={controlPoint}
          color={color}
          opacity={baseOpacity}
        />
      )}

      {/* Endpoint soft dots */}
      {isHighlighted && (
        <>
          <mesh position={startPos}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={baseOpacity * 0.8} />
          </mesh>
          <mesh position={endPos}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={baseOpacity * 0.8} />
          </mesh>
        </>
      )}
    </group>
  );
};