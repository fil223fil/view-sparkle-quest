import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EdgeProps {
  start: [number, number, number];
  end: [number, number, number];
  opacity: number;
  flowOffset?: number;
}

export const Edge = ({ start, end, opacity, flowOffset = 0 }: EdgeProps) => {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const points = [
      new THREE.Vector3(...start),
      new THREE.Vector3(...end),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [start, end]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: '#58C4DD',
      transparent: true,
      opacity: opacity * 0.5,
    });
  }, []);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      const pulse = 0.3 + Math.sin(clock.elapsedTime * 3 + flowOffset) * 0.2;
      material.opacity = opacity * pulse;
    }
  });

  return (
    <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />
  );
};
