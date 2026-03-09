// ThinkingFlowConnection — Apple-style elegant thinking path
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

// Soft traveling pulse along the thinking path
const ThinkingPulse: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  control: THREE.Vector3;
  color: string;
  delay: number;
}> = ({ start, end, control, color, delay }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const raw = (clock.elapsedTime - delay) * 0.3;
    if (raw < 0) { meshRef.current.visible = false; return; }
    meshRef.current.visible = true;
    const t = (raw % 2.5) / 2.5;
    
    const mt = 1 - t;
    meshRef.current.position.set(
      mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
      mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
      mt * mt * start.z + 2 * mt * t * control.z + t * t * end.z,
    );
    
    const fade = Math.sin(t * Math.PI);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = fade * 0.6;
    meshRef.current.scale.setScalar(0.7 + fade * 0.5);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// Subtle ring — soft breath animation
const SoftRing: React.FC<{
  position: THREE.Vector3;
  color: string;
  index: number;
}> = ({ position, color, index }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime + index * 0.7;
    const breathe = Math.sin(t * 1.5) * 0.08;
    ringRef.current.scale.setScalar(1 + breathe);
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 1.5) * 0.08;
  });

  return (
    <mesh ref={ringRef} position={position}>
      <ringGeometry args={[0.75, 0.78, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

// Step number as a small sprite
const StepBadge: React.FC<{
  position: THREE.Vector3;
  step: number;
  color: string;
}> = ({ position, step, color }) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    
    // Soft filled circle
    ctx.beginPath();
    ctx.arc(24, 24, 20, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    
    // Number
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'white';
    ctx.font = '600 18px -apple-system, SF Pro Display, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(step), 24, 25);
    
    return new THREE.CanvasTexture(canvas);
  }, [step, color]);

  return (
    <sprite position={[position.x, position.y + 0.55, position.z + 0.1]} scale={[0.3, 0.3, 1]}>
      <spriteMaterial map={texture} transparent />
    </sprite>
  );
};

export const ThinkingFlowConnection: React.FC<ThinkingFlowProps> = ({ group, widgets }) => {
  const { thinkingOrder } = group;
  
  const orderedWidgets = useMemo(() => {
    return thinkingOrder
      .map(id => widgets.find(w => w.id === id))
      .filter(Boolean) as WidgetData[];
  }, [thinkingOrder, widgets]);

  if (orderedWidgets.length < 2) return null;

  // Apple system palette
  const palette = ['#007AFF', '#34C759', '#FF9F0A', '#BF5AF2', '#FF453A'];

  return (
    <group>
      {/* Soft activation rings */}
      {orderedWidgets.map((w, i) => {
        const pos = new THREE.Vector3(w.position.x / 100, -w.position.y / 100, w.position.z / 50);
        const color = palette[i % palette.length];
        return (
          <group key={`ring-${w.id}`}>
            <SoftRing position={pos} color={color} index={i} />
            <StepBadge position={pos} step={i + 1} color={color} />
          </group>
        );
      })}

      {/* Clean connections between steps */}
      {orderedWidgets.slice(0, -1).map((w, i) => {
        const next = orderedWidgets[i + 1];
        const startPos = new THREE.Vector3(w.position.x / 100, -w.position.y / 100, w.position.z / 50);
        const endPos = new THREE.Vector3(next.position.x / 100, -next.position.y / 100, next.position.z / 50);
        
        const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(endPos, startPos).normalize();
        const perp = new THREE.Vector3(-dir.y, dir.x, 0.05);
        const dist = startPos.distanceTo(endPos);
        const control = mid.clone().add(perp.multiplyScalar(dist * 0.12));
        
        const color = palette[i % palette.length];

        return (
          <group key={`flow-${w.id}-${next.id}`}>
            {/* Primary thin line */}
            <QuadraticBezierLine
              start={startPos}
              end={endPos}
              mid={control}
              color={color}
              lineWidth={1.5}
              transparent
              opacity={0.4}
            />
            {/* Soft glow */}
            <QuadraticBezierLine
              start={startPos}
              end={endPos}
              mid={control}
              color={color}
              lineWidth={6}
              transparent
              opacity={0.06}
              blending={THREE.AdditiveBlending}
            />
            {/* Traveling pulse */}
            <ThinkingPulse
              start={startPos}
              end={endPos}
              control={control}
              color={color}
              delay={i * 0.6}
            />
          </group>
        );
      })}
    </group>
  );
};