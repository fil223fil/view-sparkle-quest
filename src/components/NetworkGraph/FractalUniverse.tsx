import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Stars, Text, Line } from '@react-three/drei';
import * as THREE from 'three';

interface UniverseNode {
  id: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  birthTime: number;
}

interface UniverseEdge {
  from: number;
  to: number;
  opacity: number;
  birthTime: number;
}

interface FractalUniverseProps {
  depth: number;
  position: [number, number, number];
  scale: number;
  opacity: number;
  onDiveIn: (position: [number, number, number], depth: number) => void;
  isActive: boolean;
}

// Process-describing formulas grouped by category
const PROCESS_FORMULAS = {
  // Network dynamics & information flow
  network: [
    'dI/dt = αS·I',      // Information spread
    'C = Σᵢⱼ Aᵢⱼ',       // Connectivity
    'k̄ = 2E/N',          // Average degree
    'L = Σᵢⱼ dᵢⱼ/N²',    // Path length
  ],
  // Emergence & self-organization
  emergence: [
    'S = -Σ pᵢ ln pᵢ',   // Entropy
    'Φ = Σ φ(Mᵢ)',       // Integrated info
    'ΔG < 0',            // Spontaneous order
    'dS/dt ≥ 0',         // Second law
  ],
  // Complexity & fractals
  complexity: [
    'D = lim ln N/ln ε', // Fractal dimension
    'λ = lim ln|δₙ|/n',  // Lyapunov exp
    'f(x) = xⁿ + c',     // Iteration
    'z → z² + c',        // Mandelbrot
  ],
  // Quantum & wave
  quantum: [
    'ψ = Σ cₙ|n⟩',       // Superposition
    'Ĥψ = Eψ',           // Schrödinger
    'ΔxΔp ≥ ℏ/2',        // Uncertainty
    '⟨A⟩ = ⟨ψ|Â|ψ⟩',     // Expectation
  ],
  // Growth & evolution
  evolution: [
    'dN/dt = rN(1-N/K)', // Logistic growth
    'Δp = sp(1-p)',      // Selection
    'H² = 8πGρ/3',       // Expansion
    '∂ρ/∂t + ∇·J = 0',   // Conservation
  ],
};

// Harmonious color palette - deeper, more cosmic
const DEPTH_PALETTES = [
  { primary: '#58C4DD', secondary: '#3A8FA8', glow: '#7FD4E8' },  // Cyan
  { primary: '#E056A0', secondary: '#A03870', glow: '#FF7AC0' },  // Magenta
  { primary: '#9B59B6', secondary: '#6C3483', glow: '#BB79D6' },  // Purple
  { primary: '#F39C12', secondary: '#B57A0D', glow: '#FFBC42' },  // Gold
  { primary: '#2ECC71', secondary: '#1E8449', glow: '#5EFC91' },  // Emerald
];

const generateUniverseNodes = (count: number, time: number): UniverseNode[] => {
  const nodes: UniverseNode[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    const radius = 0.3 + Math.random() * 0.2;
    
    nodes.push({
      id: i,
      position: [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ],
      scale: 0,
      opacity: 0,
      birthTime: time + i * 0.15,
    });
  }
  return nodes;
};

const generateUniverseEdges = (nodeCount: number, time: number): UniverseEdge[] => {
  const edges: UniverseEdge[] = [];
  for (let i = 1; i < nodeCount; i++) {
    const connections = Math.min(2, i);
    for (let j = 0; j < connections; j++) {
      const target = Math.floor(Math.random() * i);
      edges.push({
        from: i,
        to: target,
        opacity: 0,
        birthTime: time + i * 0.15 + 0.1,
      });
    }
  }
  return edges;
};

// Get formulas based on depth level
const getFormulasForDepth = (depth: number): string[] => {
  const categories = Object.keys(PROCESS_FORMULAS) as (keyof typeof PROCESS_FORMULAS)[];
  const category = categories[depth % categories.length];
  return PROCESS_FORMULAS[category];
};

// Flowing formula component - travels along the edge
const FlowingFormula = ({
  curve,
  formula,
  offset,
  speed,
  opacity,
  color,
  time,
}: {
  curve: THREE.QuadraticBezierCurve3;
  formula: string;
  offset: number;
  speed: number;
  opacity: number;
  color: string;
  time: number;
}) => {
  // Calculate position along curve with smooth looping
  const t = ((time * speed + offset) % 1 + 1) % 1;
  const point = curve.getPoint(t);
  
  // Fade in/out at edges
  const fadeZone = 0.15;
  let fadeOpacity = 1;
  if (t < fadeZone) fadeOpacity = t / fadeZone;
  else if (t > 1 - fadeZone) fadeOpacity = (1 - t) / fadeZone;
  
  return (
    <Text
      position={[point.x, point.y, point.z]}
      fontSize={0.022}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity * fadeOpacity * 0.9}
    >
      {formula}
    </Text>
  );
};

// Dynamic edge component with flowing formulas
const DynamicEdge = ({ 
  start, 
  end, 
  opacity, 
  palette, 
  edgeIndex,
  depth,
  time 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  opacity: number; 
  palette: typeof DEPTH_PALETTES[0];
  edgeIndex: number;
  depth: number;
  time: number;
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const formulas = getFormulasForDepth(depth);
  
  // Create curved path
  const { curve, points } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const mid = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // Add curve offset based on edge index for variety
    const direction = endVec.clone().sub(startVec).normalize();
    const perpendicular = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(startVec.distanceTo(endVec) * (0.1 + (edgeIndex % 3) * 0.05));
    
    if (edgeIndex % 2 === 0) perpendicular.negate();
    mid.add(perpendicular);
    
    const bezierCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const curvePoints = bezierCurve.getPoints(40);
    
    return { curve: bezierCurve, points: curvePoints };
  }, [start, end, edgeIndex]);

  // Particle positions - energy flowing along curve
  const particleCount = 20;
  const particlePositions = useMemo(() => {
    return new Float32Array(particleCount * 3);
  }, []);

  // Animate particles flowing along the curve
  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const baseT = i / particleCount;
        const flowSpeed = 0.15 + (edgeIndex % 3) * 0.05;
        const t = ((baseT + time * flowSpeed) % 1 + 1) % 1;
        const point = curve.getPoint(t);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Multiple formulas flowing at different speeds
  const flowingFormulas = useMemo(() => {
    return [
      { formula: formulas[edgeIndex % formulas.length], offset: 0, speed: 0.12 },
      { formula: formulas[(edgeIndex + 1) % formulas.length], offset: 0.5, speed: 0.15 },
    ];
  }, [formulas, edgeIndex]);

  return (
    <group>
      {/* Main curved line */}
      <Line
        points={points}
        color={palette.primary}
        lineWidth={1.2}
        transparent
        opacity={opacity * 0.5}
      />
      
      {/* Glow line */}
      <Line
        points={points}
        color={palette.glow}
        lineWidth={4}
        transparent
        opacity={opacity * 0.1}
      />

      {/* Energy particles flowing */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={palette.glow}
          size={0.012}
          transparent
          opacity={opacity * 0.7}
          sizeAttenuation
        />
      </points>

      {/* Flowing formulas along the edge */}
      {flowingFormulas.map((f, i) => (
        <FlowingFormula
          key={i}
          curve={curve}
          formula={f.formula}
          offset={f.offset}
          speed={f.speed}
          opacity={opacity}
          color={palette.primary}
          time={time}
        />
      ))}
    </group>
  );
};

export const FractalUniverse = ({ 
  depth, 
  position, 
  scale: universeScale, 
  opacity: universeOpacity,
  onDiveIn,
  isActive
}: FractalUniverseProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [nodes, setNodes] = useState<UniverseNode[]>([]);
  const [edges, setEdges] = useState<UniverseEdge[]>([]);
  const [time, setTime] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const initialized = useRef(false);

  const palette = DEPTH_PALETTES[depth % DEPTH_PALETTES.length];

  // Initialize universe when becoming active
  useFrame(({ clock }) => {
    if (isActive && !initialized.current) {
      initialized.current = true;
      const nodeCount = Math.max(5, 8 - depth);
      setNodes(generateUniverseNodes(nodeCount, clock.elapsedTime));
      setEdges(generateUniverseEdges(nodeCount, clock.elapsedTime));
    }
    
    if (isActive) {
      setTime(clock.elapsedTime);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.05;
    }
  });

  // Animate nodes
  const animatedNodes = nodes.map((node) => {
    const age = time - node.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.8));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...node, scale: eased, opacity: eased * universeOpacity };
  });

  const animatedEdges = edges.map((edge) => {
    const age = time - edge.birthTime;
    const progress = Math.min(1, Math.max(0, age / 0.6));
    const eased = 1 - Math.pow(1 - progress, 3);
    return { ...edge, opacity: eased * universeOpacity };
  });

  const handleNodeClick = useCallback((nodePosition: [number, number, number]) => {
    if (depth < 4) {
      const worldPos: [number, number, number] = [
        position[0] + nodePosition[0] * universeScale,
        position[1] + nodePosition[1] * universeScale,
        position[2] + nodePosition[2] * universeScale,
      ];
      onDiveIn(worldPos, depth + 1);
    }
  }, [depth, position, universeScale, onDiveIn]);

  if (!isActive) return null;

  return (
    <group ref={groupRef} position={position} scale={universeScale}>
      {/* Inner stars with depth color */}
      <Stars
        radius={2}
        depth={1}
        count={80}
        factor={0.4}
        saturation={0.5}
        fade
        speed={0.2}
      />

      {/* Center core with pulsing glow */}
      <Sphere args={[0.04, 16, 16]}>
        <meshBasicMaterial 
          color={palette.primary} 
          transparent 
          opacity={(0.4 + Math.sin(time * 3) * 0.2) * universeOpacity} 
        />
      </Sphere>
      <Sphere args={[0.08, 12, 12]}>
        <meshBasicMaterial 
          color={palette.glow} 
          transparent 
          opacity={(0.1 + Math.sin(time * 2) * 0.05) * universeOpacity} 
        />
      </Sphere>

      {/* Dynamic edges */}
      {animatedEdges.map((edge, i) => {
        const startNode = animatedNodes.find(n => n.id === edge.from);
        const endNode = animatedNodes.find(n => n.id === edge.to);
        if (!startNode || !endNode) return null;

        return (
          <DynamicEdge
            key={`edge-${i}`}
            start={startNode.position}
            end={endNode.position}
            opacity={edge.opacity}
            palette={palette}
            edgeIndex={i}
            depth={depth}
            time={time}
          />
        );
      })}

      {/* Nodes with glow */}
      {animatedNodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const pulse = 1 + Math.sin(time * 2 + node.id) * 0.1;
        
        return (
          <group key={`node-${node.id}`} position={node.position}>
            {/* Core */}
            <Sphere
              args={[0.025, 24, 24]}
              scale={node.scale * pulse * (isHovered ? 1.4 : 1)}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(node.position);
              }}
              onPointerOver={() => {
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredNode(null);
                document.body.style.cursor = 'default';
              }}
            >
              <meshBasicMaterial 
                color={isHovered ? palette.glow : palette.primary} 
                transparent 
                opacity={node.opacity} 
              />
            </Sphere>
            {/* Outer glow */}
            <Sphere args={[0.025, 12, 12]} scale={node.scale * pulse * 2.5}>
              <meshBasicMaterial 
                color={palette.glow} 
                transparent 
                opacity={node.opacity * 0.12} 
              />
            </Sphere>
            {/* Extra glow on hover */}
            {isHovered && (
              <Sphere args={[0.025, 8, 8]} scale={node.scale * 4}>
                <meshBasicMaterial 
                  color={palette.glow} 
                  transparent 
                  opacity={node.opacity * 0.08} 
                />
              </Sphere>
            )}
          </group>
        );
      })}

      {/* Depth indicator */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.035}
        color={palette.primary}
        anchorX="center"
        fillOpacity={universeOpacity * 0.4}
      >
        {`Уровень ${depth + 1}`}
      </Text>
    </group>
  );
};
