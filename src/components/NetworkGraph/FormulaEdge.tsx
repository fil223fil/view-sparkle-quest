import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FormulaEdgeProps {
  start: [number, number, number];
  end: [number, number, number];
  opacity: number;
  formulaIndex: number;
}

const FORMULAS = [
  'E = mc²',
  'F = ma',
  '∇ × E = -∂B/∂t',
  'ψ(x,t)',
  'Σ aₙxⁿ',
  '∫ f(x)dx',
  'λ = h/p',
  'ΔxΔp ≥ ℏ/2',
  'e^(iπ) + 1 = 0',
  '∂²u/∂t²',
  'lim x→∞',
  'det(A-λI)',
];

export const FormulaEdge = ({ start, end, opacity, formulaIndex }: FormulaEdgeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const formula = FORMULAS[formulaIndex % FORMULAS.length];

  const { direction, length, midpoint } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const dir = endVec.clone().sub(startVec);
    const len = dir.length();
    dir.normalize();
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    return { direction: dir, length: len, midpoint: mid };
  }, [start, end]);

  // Create curved path for formula to follow
  const curve = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // Add slight curve offset
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(length * 0.1);
    
    mid.add(perpendicular);
    
    return new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
  }, [start, end, direction, length]);

  useFrame(({ clock }) => {
    if (textRef.current && groupRef.current) {
      // Animate progress along the curve
      const speed = 0.3 + (formulaIndex % 3) * 0.1;
      progressRef.current = (progressRef.current + 0.005 * speed) % 1;
      
      // Get position on curve
      const point = curve.getPoint(progressRef.current);
      textRef.current.position.copy(point);
      
      // Make text face camera (billboard effect handled by Text component)
      // Pulse opacity
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 2 + formulaIndex) * 0.3;
      const material = textRef.current.material as THREE.MeshBasicMaterial;
      if (material && material.opacity !== undefined) {
        material.opacity = opacity * pulse;
      }
    }
  });

  // Create dotted line segments
  const linePoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      points.push(curve.getPoint(i / segments));
    }
    return points;
  }, [curve]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  return (
    <group ref={groupRef}>
      {/* Subtle connecting line */}
      <line>
        <bufferGeometry attach="geometry" {...lineGeometry} />
        <lineDashedMaterial
          attach="material"
          color="#58C4DD"
          transparent
          opacity={opacity * 0.2}
          dashSize={0.05}
          gapSize={0.03}
        />
      </line>
      
      {/* Animated formula text */}
      <Text
        ref={textRef}
        fontSize={0.08}
        color="#58C4DD"
        anchorX="center"
        anchorY="middle"
        fillOpacity={opacity}
      >
        {formula}
        <meshBasicMaterial
          attach="material"
          color="#58C4DD"
          transparent
          opacity={opacity}
        />
      </Text>
    </group>
  );
};
