// ThinkingFlowConnection - Animated connections showing AI thinking path between grouped widgets
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import { WidgetData } from '../types';
import type { QueryGroup } from '@/store/useChatStore';

interface ThinkingFlowProps {
  group: QueryGroup;
  widgets: WidgetData[];
}

// Animated thinking particle that travels the path
const ThinkingParticle: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  delay: number;
}> = ({ start, end, control, color, delay }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const raw = (clock.elapsedTime - delay) * 0.5;
    if (raw < 0) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;
    const t = (raw % 2) / 2; // loop every 2 seconds
    
    const mt = 1 - t;
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    // Pulse size
    meshRef.current.scale.setScalar(0.8 + Math.sin(raw * 4) * 0.3);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// Pulsing glow ring around activated widgets
const ActivationRing: React.FC<{
  position: THREE.Vector3;
  color: string;
  index: number;
}> = ({ position, color, index }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime + index * 0.5;
    ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.15;
  });

  return (
    <mesh ref={ringRef} position={position}>
      <ringGeometry args={[0.8, 0.85, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// Step number label
const StepLabel: React.FC<{
  position: THREE.Vector3;
  step: number;
}> = ({ position, step }) => {
  const ref = useRef<THREE.Sprite>(null);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    // Circle background
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(88, 196, 221, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(step), 32, 33);
    
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [step]);

  return (
    <sprite ref={ref} position={[position.x, position.y + 0.6, position.z + 0.1]} scale={[0.4, 0.4, 1]}>
      <spriteMaterial map={texture} transparent />
    </sprite>
  );
};

export const ThinkingFlowConnection: React.FC<ThinkingFlowProps> = ({ group, widgets }) => {
  const { thinkingOrder } = group;
  
  // Get positions of widgets in thinking order
  const orderedWidgets = useMemo(() => {
    return thinkingOrder
      .map(id => widgets.find(w => w.id === id))
      .filter(Boolean) as WidgetData[];
  }, [thinkingOrder, widgets]);

  if (orderedWidgets.length < 2) return null;

  // Colors for the thinking flow
  const flowColors = ['#58C4DD', '#00D4AA', '#FF9F0A', '#FF6B9D', '#9B59B6'];

  return (
    <group>
      {/* Activation rings around each grouped widget */}
      {orderedWidgets.map((w, i) => {
        const pos = new THREE.Vector3(w.position.x / 100, -w.position.y / 100, w.position.z / 50);
        return (
          <group key={`ring-${w.id}`}>
            <ActivationRing position={pos} color={flowColors[i % flowColors.length]} index={i} />
            <StepLabel position={pos} step={i + 1} />
          </group>
        );
      })}

      {/* Connections between sequential widgets in thinking order */}
      {orderedWidgets.slice(0, -1).map((w, i) => {
        const next = orderedWidgets[i + 1];
        const startPos = new THREE.Vector3(w.position.x / 100, -w.position.y / 100, w.position.z / 50);
        const endPos = new THREE.Vector3(next.position.x / 100, -next.position.y / 100, next.position.z / 50);
        
        const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const perp = new THREE.Vector3(-dir.y, dir.x, 0.15);
        const dist = startPos.distanceTo(endPos);
        const control = mid.clone().add(perp.multiplyScalar(dist * 0.25));
        
        const color = flowColors[i % flowColors.length];

        return (
          <group key={`flow-${w.id}-${next.id}`}>
            {/* Glowing flow line */}
            <QuadraticBezierLine
              start={startPos}
              end={endPos}
              mid={control}
              color={color}
              lineWidth={3}
              transparent
              opacity={0.7}
            />
            {/* Outer glow */}
            <QuadraticBezierLine
              start={startPos}
              end={endPos}
              mid={control}
              color={color}
              lineWidth={8}
              transparent
              opacity={0.15}
              blending={THREE.AdditiveBlending}
            />
            {/* Traveling particle */}
            <ThinkingParticle
              start={startPos}
              end={endPos}
              control={control}
              color={color}
              delay={i * 0.4}
            />
          </group>
        );
      })}
    </group>
  );
};
